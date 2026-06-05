const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const backendModelsDir = path.join(rootDir, 'backend', 'src', 'models');
const backendServicesDir = path.join(rootDir, 'backend', 'src', 'services');
const frontendPagesDir = path.join(rootDir, 'frontend', 'src', 'pages');
const frontendComponentsDir = path.join(rootDir, 'frontend', 'src', 'components');
const knowledgeBrainDir = path.join(rootDir, 'knowledge_brain');

if (!fs.existsSync(knowledgeBrainDir)) {
  fs.mkdirSync(knowledgeBrainDir, { recursive: true });
}

// Data structures
const modules = {}; // { moduleName: { models: [], frontendFiles: [], apiCalls: [], crossRefs: [] } }
const systemRefs = {}; // { targetModel: Set(callerModels) }

function getModule(name) {
  const modName = name || 'Core';
  if (!modules[modName]) {
    modules[modName] = { models: [], services: [], frontendFiles: [], apiCalls: [], crossRefs: new Set() };
  }
  return modules[modName];
}

// 1. Parse Backend Models
if (fs.existsSync(backendModelsDir)) {
  const modelFiles = fs.readdirSync(backendModelsDir).filter(f => f.endsWith('.js'));
  modelFiles.forEach(file => {
    const content = fs.readFileSync(path.join(backendModelsDir, file), 'utf8');
    const modelName = file.replace('.js', '');
    
    // Attempt to guess module from modelName (simple heuristic)
    let moduleName = 'Core';
    if (['Ticket', 'Todo', 'CommentsThreads'].includes(modelName)) moduleName = 'Tickets';
    else if (['Tasks', 'TaskType', 'MileStone'].includes(modelName)) moduleName = 'Tasks';
    else if (['Employee', 'Department', 'Designation', 'Role', 'Agent'].includes(modelName)) moduleName = 'HR';
    else if (['Leave', 'LeavePolicy', 'LeaveTypes', 'Attendance', 'DailyActivity', 'Regularization', 'Shift'].includes(modelName)) moduleName = 'Attendance';
    else if (['Client', 'LeadType', 'ProjectType', 'ReferenceType'].includes(modelName)) moduleName = 'Masters';
    
    const mod = getModule(moduleName);
    
    // Extract refs
    const refs = [];
    const refRegex = /ref:\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = refRegex.exec(content)) !== null) {
      refs.push(match[1]);
      mod.crossRefs.add(match[1]);
      if (!systemRefs[match[1]]) systemRefs[match[1]] = new Set();
      systemRefs[match[1]].add(modelName);
    }
    
    mod.models.push({
      name: modelName,
      file,
      refs: [...new Set(refs)],
      approxLines: content.split('\n').length
    });
  });
}

// 1b. Parse Backend Services
if (fs.existsSync(backendServicesDir)) {
  const serviceFiles = fs.readdirSync(backendServicesDir).filter(f => f.endsWith('.js'));
  serviceFiles.forEach(file => {
    const content = fs.readFileSync(path.join(backendServicesDir, file), 'utf8');
    const serviceName = file.replace('.js', '');
    
    let moduleName = 'Core';
    if (['tickets', 'ticketTaskSync', 'commentthreads'].includes(serviceName)) moduleName = 'Tickets';
    else if (['tasks', 'milestoneService'].includes(serviceName)) moduleName = 'Tasks';
    else if (['employee', 'agents', 'AgentInviteService'].includes(serviceName)) moduleName = 'HR';
    else if (['leaves', 'attendances', 'regularizations'].includes(serviceName)) moduleName = 'Attendance';
    else moduleName = 'Core';
    
    const mod = getModule(moduleName);
    
    // Extract exported functions
    const exportedFns = [];
    const exportRegex = /export (?:async )?function ([a-zA-Z0-9_]+)/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      exportedFns.push(match[1]);
    }
    
    mod.services.push({
      name: file,
      functions: exportedFns,
      approxLines: content.split('\n').length
    });
  });
}

// 2. Parse Frontend
function scanDir(dir, type) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  items.forEach(item => {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      scanDir(fullPath, type);
    } else if (item.name.endsWith('.jsx') || item.name.endsWith('.js')) {
      const relPath = path.relative(rootDir, fullPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Determine module by top-level folder under pages/components
      let moduleName = 'Core';
      const parts = path.relative(type === 'page' ? frontendPagesDir : frontendComponentsDir, fullPath).split(path.sep);
      if (parts.length > 1) {
        moduleName = parts[0];
      }
      
      const mod = getModule(moduleName);
      mod.frontendFiles.push({ file: relPath, name: item.name });
      
      // Find API calls
      const apiRegex = /axiosInstance\.(post|get|put|delete)\(\s*[`'"]([^`'"]+)[`'"]/g;
      let match;
      while ((match = apiRegex.exec(content)) !== null) {
        const method = match[1];
        const url = match[2];
        if (url.includes('/populate/')) {
          mod.apiCalls.push({
            file: relPath,
            method,
            url,
            // Extract model if possible
            targetModel: url.split('/')[3] || 'unknown'
          });
        }
      }
    }
  });
}

scanDir(frontendPagesDir, 'page');
scanDir(frontendComponentsDir, 'component');

// 3. Generate Markdowns
for (const [modName, data] of Object.entries(modules)) {
  const modDir = path.join(knowledgeBrainDir, modName);
  if (!fs.existsSync(modDir)) fs.mkdirSync(modDir, { recursive: true });
  
  // MODULE_BRAIN.md
  let brainMd = `# ${modName} Module Brain\n\n## Overview\nThis module contains ${data.models.length} models, ${data.services.length} services, and ${data.frontendFiles.length} frontend files.\n\n`;
  brainMd += `## Backend Models\n| Model | File | Lines | References |\n|---|---|---|---|\n`;
  data.models.forEach(m => {
    brainMd += `| ${m.name} | ${m.file} | ${m.approxLines} | ${m.refs.join(', ')} |\n`;
  });
  
  if (data.services.length > 0) {
    brainMd += `\n## Backend Services (Business Logic Hooks)\n| Service File | Lines | Exported Functions |\n|---|---|---|\n`;
    data.services.forEach(s => {
      brainMd += `| ${s.name} | ${s.approxLines} | ${s.functions.join(', ')} |\n`;
    });
  }
  
  brainMd += `\n## Dynamic API Usage\n| File | Method | URL | Target Model |\n|---|---|---|---|\n`;
  data.apiCalls.slice(0, 50).forEach(api => { // limit to avoid massive tables
    brainMd += `| ${api.file.split(path.sep).pop()} | ${api.method.toUpperCase()} | ${api.url} | ${api.targetModel} |\n`;
  });
  
  fs.writeFileSync(path.join(modDir, 'MODULE_BRAIN.md'), brainMd);
  
  // METHOD_INDEX.md
  let methodMd = `# Method & Model Index: ${modName}\n\n`;
  methodMd += `## Models (Alphabetical)\n| Model | Source File |\n|---|---|\n`;
  data.models.sort((a,b) => a.name.localeCompare(b.name)).forEach(m => {
    methodMd += `| ${m.name} | ${m.file} |\n`;
  });
  
  if (data.services.length > 0) {
    methodMd += `\n## Service Functions (Alphabetical)\n| Function | Service File |\n|---|---|\n`;
    const allFns = [];
    data.services.forEach(s => {
      s.functions.forEach(f => allFns.push({ fn: f, file: s.name }));
    });
    allFns.sort((a,b) => a.fn.localeCompare(b.fn)).forEach(item => {
      methodMd += `| ${item.fn} | ${item.file} |\n`;
    });
  }
  
  fs.writeFileSync(path.join(modDir, 'METHOD_INDEX.md'), methodMd);
  
  // CROSS_MODULE_MAP.md
  let crossMd = `# Cross Module Map: ${modName}\n\n## Outbound References (Mongoose)\n`;
  crossMd += `| Target Collection |\n|---|\n`;
  [...data.crossRefs].forEach(ref => {
    crossMd += `| ${ref} |\n`;
  });
  fs.writeFileSync(path.join(modDir, 'CROSS_MODULE_MAP.md'), crossMd);
  
  // DATA_FLOW.md
  let flowMd = `# Data Flow: ${modName}\n\n## API Payloads\n`;
  flowMd += `Extracted from React Components targeting the generic API endpoint.\n\n`;
  data.apiCalls.forEach(api => {
    flowMd += `- **${api.file.split(path.sep).pop()}** -> \`${api.method.toUpperCase()} ${api.url}\`\n`;
  });
  fs.writeFileSync(path.join(modDir, 'DATA_FLOW.md'), flowMd);
}

// 4. Generate SYSTEM Brain
const sysDir = path.join(knowledgeBrainDir, '_SYSTEM');
if (!fs.existsSync(sysDir)) fs.mkdirSync(sysDir, { recursive: true });

let sysMd = `# System Module Dependencies\n\n## Shared Collections (Inbound Refs)\n| Target Model | Referenced By |\n|---|---|\n`;
for (const [target, callers] of Object.entries(systemRefs)) {
  if (callers.size > 1) {
    sysMd += `| ${target} | ${[...callers].join(', ')} |\n`;
  }
}
fs.writeFileSync(path.join(sysDir, 'SHARED_COLLECTIONS.md'), sysMd);

let covMd = `# System Coverage\n\nModules Scanned: ${Object.keys(modules).length}\n`;
for (const modName of Object.keys(modules)) {
  covMd += `- ${modName} (Models: ${modules[modName].models.length}, Frontend: ${modules[modName].frontendFiles.length})\n`;
}
fs.writeFileSync(path.join(sysDir, 'SYSTEM_COVERAGE.md'), covMd);

console.log('Brain extraction complete! Folders created in knowledge_brain/');
