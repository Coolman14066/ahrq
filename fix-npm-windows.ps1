# PowerShell script to fix npm dependencies for Windows

Write-Host "Fixing npm dependencies for Windows..." -ForegroundColor Green

# 1. Remove node_modules and package-lock.json
Write-Host "`n1. Removing node_modules and package-lock.json..." -ForegroundColor Yellow
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue

# 2. Clear npm cache
Write-Host "`n2. Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# 3. Install dependencies fresh
Write-Host "`n3. Installing dependencies..." -ForegroundColor Yellow
npm install

# 4. Verify installation
Write-Host "`n4. Verifying installation..." -ForegroundColor Yellow
if (Test-Path "node_modules/@rollup/rollup-win32-x64-msvc") {
    Write-Host "✓ Windows Rollup binary installed successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Windows Rollup binary not found. Trying alternative fix..." -ForegroundColor Red
    # Try installing rollup directly
    npm install --save-dev @rollup/rollup-win32-x64-msvc
}

Write-Host "`nFix complete! Try running 'npm run dev' now." -ForegroundColor Green