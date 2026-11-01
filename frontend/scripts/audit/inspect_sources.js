import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('src');

function getAllFiles(dir, exts = ['.js', '.jsx', '.ts', '.tsx']) {
  let res = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      res = res.concat(getAllFiles(full, exts));
    } else if (exts.includes(path.extname(item))) {
      res.push(full);
    }
  }
  return res;
}

const allSrcFiles = getAllFiles(srcDir);

// 1. Check all files in src/mocks
const mockFiles = fs.readdirSync(path.join(srcDir, 'mocks')).map(f => path.join(srcDir, 'mocks', f));

// For each mock file, who imports it?
const mockUsage = {};
mockFiles.forEach(mf => {
  const base = path.basename(mf, path.extname(mf));
  mockUsage[base] = {
    file: 'src/mocks/' + path.basename(mf),
    importedBy: [],
    hasLocalStorageKey: false,
    contentSummary: ''
  };
});

allSrcFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');

  mockFiles.forEach(mf => {
    const base = path.basename(mf, path.extname(mf));
    const importRegex = new RegExp(`from\\s+['\"].*\\/${base}(\\.js)?['\"]`);
    if (importRegex.test(content) && rel !== ('src/mocks/' + path.basename(mf))) {
      mockUsage[base].importedBy.push(rel);
    }
  });
});

// Check SMART_SCHEDULING_DB_V1 in all files
const filesWithDbKey = [];
allSrcFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');
  if (content.includes('SMART_SCHEDULING_DB')) {
    filesWithDbKey.push(rel);
  }
});

// Check pages / components importing directly from mocks
const directMockImportsInUI = [];
allSrcFiles.forEach(file => {
  const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');
  if (rel.startsWith('src/pages/') || rel.startsWith('src/components/') || rel.startsWith('src/layouts/')) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(/from\s+['\"][^'\"]*mocks\/[^'\"]+['\"]/g);
    if (matches) {
      directMockImportsInUI.push({ file: rel, imports: matches });
    }
  }
});

fs.writeFileSync('scripts/audit/mock_usage.json', JSON.stringify({
  mockUsage,
  filesWithDbKey,
  directMockImportsInUI
}, null, 2));

console.log('Done scanning sources.');
console.log('Files with SMART_SCHEDULING_DB:', filesWithDbKey);
console.log('Direct mock imports in UI:', directMockImportsInUI);
