# Stop any running dev server
Write-Host "Stopping dev server..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node_modules*" } | Stop-Process -Force

# Wait a moment
Start-Sleep -Seconds 2

# Regenerate Prisma Client
Write-Host "Regenerating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

# Start dev server
Write-Host "Starting dev server..." -ForegroundColor Green
pnpm run dev

