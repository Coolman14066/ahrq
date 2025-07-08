const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('=== NPM Rollup Issue Diagnostic ===\n');

// 1. Check environment
console.log('1. Environment Information:');
console.log(`   Platform: ${os.platform()}`);
console.log(`   Architecture: ${os.arch()}`);
console.log(`   Node Version: ${process.version}`);
console.log(`   NPM Version: ${process.env.npm_version || 'Not in npm script'}`);
console.log(`   Current Directory: ${process.cwd()}`);

// 2. Check if rollup directory exists
console.log('\n2. Rollup Installation Check:');
const rollupPath = path.join(__dirname, 'node_modules', 'rollup');
console.log(`   Rollup directory exists: ${fs.existsSync(rollupPath)}`);

if (fs.existsSync(rollupPath)) {
  const rollupPackageJson = path.join(rollupPath, 'package.json');
  if (fs.existsSync(rollupPackageJson)) {
    const rollupPkg = JSON.parse(fs.readFileSync(rollupPackageJson, 'utf8'));
    console.log(`   Rollup version: ${rollupPkg.version}`);
  }
}

// 3. Check for platform-specific rollup packages
console.log('\n3. Platform-Specific Rollup Packages:');
const nodeModules = path.join(__dirname, 'node_modules');
const rollupPackages = fs.readdirSync(nodeModules)
  .filter(dir => dir.startsWith('@rollup'))
  .map(dir => {
    const subDirs = fs.readdirSync(path.join(nodeModules, dir));
    return subDirs.map(subDir => `${dir}/${subDir}`);
  })
  .flat();

rollupPackages.forEach(pkg => {
  console.log(`   Found: ${pkg}`);
});

// 4. Check package-lock.json for rollup entries
console.log('\n4. Package-lock.json Analysis:');
const lockPath = path.join(__dirname, 'package-lock.json');
if (fs.existsSync(lockPath)) {
  const lockContent = fs.readFileSync(lockPath, 'utf8');
  const rollupRefs = lockContent.match(/@rollup\/rollup-[^"]+/g);
  if (rollupRefs) {
    const uniqueRefs = [...new Set(rollupRefs)];
    console.log(`   Found ${uniqueRefs.length} unique rollup platform references:`);
    uniqueRefs.forEach(ref => console.log(`   - ${ref}`));
  }
} else {
  console.log('   package-lock.json not found');
}

// 5. Check if running in WSL
console.log('\n5. WSL Detection:');
const isWSL = process.platform === 'linux' && 
  (process.env.WSL_DISTRO_NAME || fs.existsSync('/proc/version') && 
   fs.readFileSync('/proc/version', 'utf8').toLowerCase().includes('microsoft'));
console.log(`   Running in WSL: ${isWSL}`);
console.log(`   WSL_DISTRO_NAME: ${process.env.WSL_DISTRO_NAME || 'Not set'}`);

// 6. Expected vs Actual platform binary
console.log('\n6. Expected Platform Binary:');
const expectedBinary = `@rollup/rollup-${os.platform()}-${os.arch()}-${os.platform() === 'win32' ? 'msvc' : ''}`.replace(/-$/, '');
console.log(`   Expected: ${expectedBinary}`);
console.log(`   Exists: ${fs.existsSync(path.join(nodeModules, ...expectedBinary.split('/')))}`);

console.log('\n=== Diagnostic Complete ===');