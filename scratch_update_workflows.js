const fs = require('fs');
const path = require('path');

const workflowsDir = path.join(__dirname, '.agent', 'workflows');

const replacements = [
  { search: /Django 5 \+ DRF \(Backend\)/g, replace: 'Node.js + Express + Mongoose (Backend)' },
  { search: /Django ORM/g, replace: 'Mongoose' },
  { search: /DRF ViewSet/gi, replace: 'Dynamic API Controller' },
  { search: /DRF View/gi, replace: 'API Route' },
  { search: /DRF Serializer/gi, replace: 'Mongoose Schema' },
  { search: /DRF/g, replace: 'Express' },
  { search: /views\.py/g, replace: 'populateHelper.js' },
  { search: /serializers\.py/g, replace: 'models/*.js' },
  { search: /models\.py/g, replace: 'models/*.js' },
  { search: /urls\.py/g, replace: 'populateRoutes.js' },
  { search: /Django/g, replace: 'Node.js/Express' },
  { search: /python manage\.py runserver/g, replace: 'node server.js (or npm run dev)' },
  { search: /python manage\.py makemigrations/g, replace: 'Mongoose schema updates' },
  { search: /python manage\.py migrate/g, replace: 'MongoDB sync' },
  { search: /pytest-django/g, replace: 'jest' },
];

const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.md'));

let updatedCount = 0;

for (const file of files) {
  // Skip the two files we just fully rewrote manually
  if (file === 'build-module-brain.md' || file === 'build-system-brain.md') {
    continue;
  }

  const filePath = path.join(workflowsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (const { search, replace } of replacements) {
    content = content.replace(search, replace);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${file}`);
    updatedCount++;
  }
}

console.log(`Finished updating ${updatedCount} workflow files.`);
