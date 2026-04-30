const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// All project routes require login
router.use(authenticate);

// GET /api/projects - get all projects for the current user
router.get('/', async (req, res) => {
  try {
    // Find projects where user is owner OR member
    const memberships = await db.members.find({ userId: req.user.id });
    const memberProjectIds = memberships.map(m => m.projectId);

    const projects = await db.projects.find({
      $or: [
        { ownerId: req.user.id },
        { _id: { $in: memberProjectIds } }
      ]
    });

    // Add role info to each project
    const enriched = projects.map(p => ({
      ...p,
      role: p.ownerId === req.user.id ? 'admin' : 'member'
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects - create a new project
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const project = await db.projects.insert({
      name,
      description: description || '',
      ownerId: req.user.id,
      ownerName: req.user.name,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ ...project, role: 'admin' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/projects/:id - get single project with members
router.get('/:id', async (req, res) => {
  try {
    const project = await db.projects.findOne({ _id: req.params.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Check access
    const membership = await db.members.findOne({ projectId: req.params.id, userId: req.user.id });
    const isOwner = project.ownerId === req.user.id;
    if (!isOwner && !membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get members
    const members = await db.members.find({ projectId: req.params.id });

    // Enrich members with user info
    const enrichedMembers = await Promise.all(members.map(async m => {
      const user = await db.users.findOne({ _id: m.userId });
      return { ...m, name: user?.name, email: user?.email };
    }));

    // Also add owner
    const owner = await db.users.findOne({ _id: project.ownerId });
    const allMembers = [
      { userId: project.ownerId, name: owner?.name, email: owner?.email, role: 'admin' },
      ...enrichedMembers
    ];

    res.json({
      ...project,
      role: isOwner ? 'admin' : 'member',
      members: allMembers
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/projects/:id - update project (admin only)
router.put('/:id', async (req, res) => {
  try {
    const project = await db.projects.findOne({ _id: req.params.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== req.user.id) return res.status(403).json({ error: 'Admin only' });

    const { name, description } = req.body;
    await db.projects.update({ _id: req.params.id }, { $set: { name, description } });

    res.json({ ...project, name, description });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id - delete project (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const project = await db.projects.findOne({ _id: req.params.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== req.user.id) return res.status(403).json({ error: 'Admin only' });

    // Delete project, its tasks, and memberships
    await db.projects.remove({ _id: req.params.id });
    await db.tasks.remove({ projectId: req.params.id }, { multi: true });
    await db.members.remove({ projectId: req.params.id }, { multi: true });

    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects/:id/invite - add member by email (admin only)
router.post('/:id/invite', async (req, res) => {
  try {
    const project = await db.projects.findOne({ _id: req.params.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== req.user.id) return res.status(403).json({ error: 'Admin only' });

    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const invitedUser = await db.users.findOne({ email: email.toLowerCase() });
    if (!invitedUser) return res.status(404).json({ error: 'No user found with that email' });

    if (invitedUser._id === req.user.id) {
      return res.status(400).json({ error: 'You are already the project owner' });
    }

    // Check if already a member
    const existing = await db.members.findOne({ projectId: req.params.id, userId: invitedUser._id });
    if (existing) return res.status(400).json({ error: 'User is already a member' });

    await db.members.insert({
      projectId: req.params.id,
      userId: invitedUser._id,
      role: 'member',
      joinedAt: new Date().toISOString(),
    });

    res.json({ message: 'Member added', user: { id: invitedUser._id, name: invitedUser.name, email: invitedUser.email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id/members/:userId - remove member (admin only)
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const project = await db.projects.findOne({ _id: req.params.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== req.user.id) return res.status(403).json({ error: 'Admin only' });

    await db.members.remove({ projectId: req.params.id, userId: req.params.userId });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
