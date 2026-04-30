const Datastore = require('nedb-promises');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data');

// Create data directory path
const fs = require('fs');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

const db = {
  users: Datastore.create({ filename: path.join(dbPath, 'users.db'), autoload: true }),
  projects: Datastore.create({ filename: path.join(dbPath, 'projects.db'), autoload: true }),
  tasks: Datastore.create({ filename: path.join(dbPath, 'tasks.db'), autoload: true }),
  members: Datastore.create({ filename: path.join(dbPath, 'members.db'), autoload: true }),
};

// Create indexes for faster lookups
db.users.ensureIndex({ fieldName: 'email', unique: true });
db.projects.ensureIndex({ fieldName: 'createdAt' });
db.tasks.ensureIndex({ fieldName: 'projectId' });
db.members.ensureIndex({ fieldName: 'projectId' });

module.exports = db;
