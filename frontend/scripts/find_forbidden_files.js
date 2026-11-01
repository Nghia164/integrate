import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve('.');
const srcDir = path.join(projectRoot, 'src');

const entryFiles = [
  'src/App.jsx',
  'src/layouts/ManagerLayout.jsx',
  'src/layouts/EmployeeLayout.jsx',
];

// Add all files in manager and employees pages
function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (/\.(jsx?|tsx?)$/.test(file)) {
      results.push(fullPath);
    }
  }
  return results;
}

const pageFiles = [
  ...getFiles(path.join(srcDir, 'pages', 'manager')),
  ...getFiles(path.join(srcDir, 'pages', 'employees')),
  ...entryFiles.map(f => path.join(projectRoot, f))
];

const visited = new Set();
const forbiddenFiles = new Set();

function resolveImport(importPath, currentFileDir) {
  let resolved;
  if (importPath.startsWith('.')) {
    resolved = path.resolve(currentFileDir, importPath);
  } else if (importPath.startsWith('@/')) {
    resolved = path.resolve(srcDir, importPath.slice(2));
  } else {
    return null; // node_modules
  }

  // Extensions
  const exts = ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx'];
  for (const ext of exts) {
    const p = resolved + ext;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return p;
    }
  }
  return null;
}

function scanFile(filePath) {
  if (visited.has(filePath)) return;
  visited.add(filePath);

  const relative = path.relative(projectRoot, filePath).replace(/\\/g, '/');
  forbiddenFiles.add(relative);

  const content = fs.readFileSync(filePath, 'utf8');
  const importRegex = /(?:import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]|export\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]|import\(['"]([^'"]+)['"]\))/g;

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1] || match[2] || match[3];
    if (importPath) {
      const resolved = resolveImport(importPath, path.dirname(filePath));
      if (resolved && resolved.startsWith(srcDir)) {
        scanFile(resolved);
      }
    }
  }
}

for (const pf of pageFiles) {
  scanFile(pf);
}

const sortedList = Array.from(forbiddenFiles).sort();
console.log('=== VÙNG CẤM GHI ĐÈ: TỔNG SỐ ' + sortedList.length + ' FILES ===');
sortedList.forEach(f => console.log(f));
fs.writeFileSync('scripts/forbidden_files.json', JSON.stringify(sortedList, null, 2));
