const { copyFileSync, mkdirSync } = require('fs');
const { dirname, join } = require('path');

const srcPath = join(__dirname, '..', 'src', 'db', 'schema.sql');
const destPath = join(__dirname, '..', 'dist', 'db', 'schema.sql');

mkdirSync(dirname(destPath), { recursive: true });
copyFileSync(srcPath, destPath);
