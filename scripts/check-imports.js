#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Get package.json dependencies
function getInstalledPackages() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const allDeps = {
    ...packageJson.dependencies || {},
    ...packageJson.devDependencies || {},
    ...packageJson.peerDependencies || {}
  };
  
  return new Set(Object.keys(allDeps));
}

// Get all TypeScript/JavaScript files
function getAllSourceFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other build directories
      if (!['node_modules', 'dist', 'build', '.git', 'coverage'].includes(file)) {
        getAllSourceFiles(filePath, fileList);
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Extract imports from a file
function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];
  
  // Match ES6 imports
  const importRegex = /import\s+(?:(?:\{[^}]*\}|[\w\s,*]+)\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push({
      module: match[1],
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  // Match require statements
  const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
  while ((match = requireRegex.exec(content)) !== null) {
    imports.push({
      module: match[1],
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  return imports;
}

// Check if import is a node built-in module
function isNodeBuiltin(moduleName) {
  const builtins = [
    'fs', 'path', 'http', 'https', 'crypto', 'os', 'util', 'stream',
    'events', 'child_process', 'cluster', 'dgram', 'dns', 'net',
    'readline', 'repl', 'tls', 'tty', 'url', 'util', 'vm', 'zlib'
  ];
  return builtins.includes(moduleName);
}

// Check if import is a relative path
function isRelativePath(moduleName) {
  return moduleName.startsWith('./') || moduleName.startsWith('../') || moduleName.startsWith('/');
}

// Get the package name from import path
function getPackageName(importPath) {
  // Handle scoped packages like @mui/material
  if (importPath.startsWith('@')) {
    const parts = importPath.split('/');
    return parts.slice(0, 2).join('/');
  }
  // Handle regular packages
  return importPath.split('/')[0];
}

// Main validation function
function validateImports() {
  console.log(`${colors.blue}🔍 Checking imports...${colors.reset}\n`);
  
  const installedPackages = getInstalledPackages();
  const srcDir = path.join(process.cwd(), 'src');
  const files = getAllSourceFiles(srcDir);
  
  let hasErrors = false;
  const errors = [];
  const warnings = [];
  
  files.forEach(file => {
    const imports = extractImports(file);
    const relativePath = path.relative(process.cwd(), file);
    
    imports.forEach(({ module: importPath, line }) => {
      // Skip relative imports and node built-ins
      if (isRelativePath(importPath) || isNodeBuiltin(importPath)) {
        return;
      }
      
      const packageName = getPackageName(importPath);
      
      if (!installedPackages.has(packageName)) {
        hasErrors = true;
        errors.push({
          file: relativePath,
          line,
          package: packageName,
          import: importPath
        });
      }
    });
  });
  
  // Report results
  if (errors.length > 0) {
    console.log(`${colors.red}❌ Found ${errors.length} missing dependencies:${colors.reset}\n`);
    
    const groupedErrors = {};
    errors.forEach(error => {
      if (!groupedErrors[error.package]) {
        groupedErrors[error.package] = [];
      }
      groupedErrors[error.package].push(error);
    });
    
    Object.entries(groupedErrors).forEach(([pkg, errs]) => {
      console.log(`${colors.yellow}📦 Missing package: ${pkg}${colors.reset}`);
      errs.forEach(err => {
        console.log(`   ${err.file}:${err.line} - import from '${err.import}'`);
      });
      console.log();
    });
    
    console.log(`${colors.blue}💡 To fix, run:${colors.reset}`);
    console.log(`   npm install ${Object.keys(groupedErrors).join(' ')}\n`);
    
    process.exit(1);
  } else {
    console.log(`${colors.green}✅ All imports are valid!${colors.reset}`);
    console.log(`   Checked ${files.length} files`);
    console.log(`   Found ${installedPackages.size} installed packages\n`);
  }
}

// Run validation
try {
  validateImports();
} catch (error) {
  console.error(`${colors.red}Error during import validation:${colors.reset}`, error.message);
  process.exit(1);
}