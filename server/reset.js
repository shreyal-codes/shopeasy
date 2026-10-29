// Deletes the database file so it is rebuilt from schema.sql + seed.sql on next start.
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'shopeasy.db');
if (fs.existsSync(file)) fs.unlinkSync(file);
console.log('Database deleted. Run "npm start" to create a fresh one.');
