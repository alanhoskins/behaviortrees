const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

// Convert PascalCase or camelCase to kebab-case
function toKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

// File mappings (old path to new path)
const fileMap = new Map();

// Find all component files
async function findComponentFiles() {
  const { stdout } = await execAsync('find ./src -name "*.tsx" | grep -v "node_modules"');
  return stdout.trim().split('\n').filter(Boolean);
}

// Process a file path and add to the mapping if needed
function processFile(filePath) {
  // Skip files that are already kebab-case
  if (path.basename(filePath).includes('-')) {
    return false;
  }
  
  // Skip files in the UI directory as they're already kebab-case
  if (filePath.includes('/ui/')) {
    return false;
  }

  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const basename = path.basename(filePath, ext);
  
  // Skip main.tsx
  if (basename === 'main') {
    return false;
  }
  
  const kebabName = toKebabCase(basename);
  const newPath = path.join(dir, kebabName + ext);
  
  // Add to file map
  fileMap.set(filePath, newPath);
  return true;
}

// Rename files and update imports
async function renameFiles() {
  const files = await findComponentFiles();
  
  // Generate file mapping
  files.forEach(processFile);
  
  console.log('Files to be renamed:');
  fileMap.forEach((newPath, oldPath) => {
    console.log(`${oldPath} → ${newPath}`);
  });
  
  // Rename files
  for (const [oldPath, newPath] of fileMap) {
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed: ${oldPath} → ${newPath}`);
  }
  
  // Update imports in all files
  const allFiles = await findComponentFiles();
  const jsFiles = (await execAsync('find ./src -name "*.ts" | grep -v "*.tsx" | grep -v "node_modules"')).stdout.trim().split('\n').filter(Boolean);
  
  const filesToUpdate = [...allFiles, ...jsFiles];
  
  for (const file of filesToUpdate) {
    let content = await readFileAsync(file, 'utf8');
    let changed = false;
    
    // Replace import statements
    for (const [oldPath, newPath] of fileMap) {
      const oldBasename = path.basename(oldPath, path.extname(oldPath));
      const newBasename = path.basename(newPath, path.extname(newPath));
      
      // Match import statements with the component name
      const regex = new RegExp(`(from\\s+['"])([^'"]*\\/)(${oldBasename})(['"])`, 'g');
      const newContent = content.replace(regex, (match, start, middle, component, end) => {
        changed = true;
        return `${start}${middle}${newBasename}${end}`;
      });
      
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    }
    
    if (changed) {
      await writeFileAsync(file, content, 'utf8');
      console.log(`Updated imports in: ${file}`);
    }
  }
}

// Execute the script
renameFiles().then(() => {
  console.log('All files have been renamed and imports updated.');
}).catch(err => {
  console.error('Error:', err);
});