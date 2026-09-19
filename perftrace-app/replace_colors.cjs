const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync('src');

const replacements = [
  { regex: /bg-\[#0f111a\]/g, replacement: 'bg-surface-base' },
  { regex: /bg-\[#141622\]/g, replacement: 'bg-surface-panel' },
  { regex: /bg-\[#1e2136\]/g, replacement: 'bg-surface-hover' },
  { regex: /bg-\[#2a2d45\]/g, replacement: 'bg-surface-active' },
  
  { regex: /border-\[#2a2d3e\]/g, replacement: 'border-subtle' },
  { regex: /border-\[#3b3f58\]/g, replacement: 'border-strong' },
  
  { regex: /text-\[#8b92b2\]/g, replacement: 'text-muted' },
  { regex: /text-\[#9ca3af\]/g, replacement: 'text-muted' },
  { regex: /text-\[#6b7280\]/g, replacement: 'text-muted' },
  { regex: /text-\[#4b5563\]/g, replacement: 'text-muted' },
  { regex: /text-gray-300/g, replacement: 'text-main' },
  { regex: /text-gray-200/g, replacement: 'text-main' },
  { regex: /text-gray-100/g, replacement: 'text-main' },
  { regex: /text-white/g, replacement: 'text-main' },
  { regex: /hover:text-white/g, replacement: 'hover:text-main' },
  { regex: /hover:text-gray-200/g, replacement: 'hover:text-main' },
  { regex: /text-gray-500/g, replacement: 'text-muted' },
  
  { regex: /bg-\[#3b82f6\]/g, replacement: 'bg-blue-500' },
  { regex: /border-\[#3b82f6\]/g, replacement: 'border-blue-500' },
  { regex: /text-\[#10b981\]/g, replacement: 'text-emerald-500' },
  { regex: /text-\[#f59e0b\]/g, replacement: 'text-amber-500' },
  { regex: /text-emerald-400/g, replacement: 'text-emerald-500' }
];

let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  replacements.forEach(r => {
    content = content.replace(r.regex, r.replacement);
  });
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log('Updated:', file);
  }
});

console.log(`Updated ${changedFiles} files.`);
