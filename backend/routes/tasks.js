const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Helper: check if user has access to a project
async function getProjectAccess(projectId, userId) {
  const project = await db.projects.findOne({ _id: projectId });
  if (!project) return null;
  
  const isOwner = project.ownerId === userId;
  const membership = await db.members.findOne({ projectId, userId });
  
  if (!isOwner && !membership) return null;
  
  return {
    project,
    role: isOwner ? 'admin' : 'member'
  };
}

// GET /api/tasks?projectId=xxx - get tasks for a project
router.get('/', async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ error: 'projectId is required' });

    const access = await getProjectAccess(projectId, req.user.id);
    if (!access) return res.status(403).json({ error: 'Access denied' });

    const tasks = await db.tasks.find({ projectId });

    // Enrich with assignee names
    const enriched = await Promise.all(tasks.map(async task => {
      if (task.assigneeId) {
        const user = await db.users.findOne({ _id: task.assigneeId });
        return { ...task, assigneeName: user?.name || 'Unknown' };
      }
      return task;
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tasks - create a task
router.post('/', async (req, res) => {
  try {
    const { projectId, title, description, assigneeId, dueDate, priority } = req.body;

    if (!projectId || !title) {
      return res.status(400).json({ error: 'projectId and title are required' });
    }

    const access = await getProjectAccess(projectId, req.user.id);
    if (!access) return res.status(403).json({ error: 'Access denied' });

    // Only admin can create tasks
    if (access.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create tasks' });
    }

    const task = await db.tasks.insert({
      projectId,
      title,
      description: description || '',
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
      priority: priority || 'medium', // low, medium, high
      status: 'todo', // todo, in-progress, done
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Get assignee name if set
    let assigneeName = null;
    if (assigneeId) {
      const user = await db.users.findOne({ _id: assigneeId });
      assigneeName = user?.name;
    }

    res.status(201).json({ ...task, assigneeName });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/tasks/:id - update a task
router.put('/:id', async (req, res) => {
  try {
    const task = await db.tasks.findOne({ _id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const access = await getProjectAccess(task.projectId, req.user.id);
    if (!access) return res.status(403).json({ error: 'Access denied' });

    const { title, description, assigneeId, dueDate, priority, status } = req.body;

    // Members can only update status of tasks assigned to them
    if (access.role === 'member') {
      if (task.assigneeId !== req.user.id) {
        return res.status(403).json({ error: 'You can only update tasks assigned to you' });
      }
      // Members can only change status
      await db.tasks.update(
        { _id: req.params.id },
        { $set: { status, updatedAt: new Date().toISOString() } }
      );
    } else {
      // Admin can update everything
      const updates = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (assigneeId !== undefined) updates.assigneeId = assigneeId;
      if (dueDate !== undefined) updates.dueDate = dueDate;
      if (priority !== undefined) updates.priority = priority;
      if (status !== undefined) updates.status = status;
      updates.updatedAt = new Date().toISOString();

      await db.tasks.update({ _id: req.params.id }, { $set: updates });
    }

    const updated = await db.tasks.findOne({ _id: req.params.id });
    let assigneeName = null;
    if (updated.assigneeId) {
      const user = await db.users.findOne({ _id: updated.assigneeId });
      assigneeName = user?.name;
    }

    res.json({ ...updated, assigneeName });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/tasks/:id - delete a task (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const task = await db.tasks.findOne({ _id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const access = await getProjectAccess(task.projectId, req.user.id);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    if (access.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    await db.tasks.remove({ _id: req.params.id });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/tasks/dashboard - get dashboard stats for current user
router.get('/dashboard', async (req, res) => {
  try {
    // Get all projects this user is part of
    const memberships = await db.members.find({ userId: req.user.id });
    const memberProjectIds = memberships.map(m => m.projectId);
    const projects = await db.projects.find({
      $or: [
        { ownerId: req.user.id },
        { _id: { $in: memberProjectIds } }
      ]
    });

    const projectIds = projects.map(p => p._id);
    const allTasks = await db.tasks.find({ projectId: { $in: projectIds } });

    const myTasks = allTasks.filter(t => t.assigneeId === req.user.id);
    const today = new Date().toISOString().split('T')[0];
    const overdue = myTasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'done');

    res.json({
      totalProjects: projects.length,
      totalTasks: allTasks.length,
      myTasks: myTasks.length,
      overdue: overdue.length,
      tasksByStatus: {
        todo: allTasks.filter(t => t.status === 'todo').length,
        inProgress: allTasks.filter(t => t.status === 'in-progress').length,
        done: allTasks.filter(t => t.status === 'done').length,
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
