<#
.SYNOPSIS
    Gỡ cài đặt hoàn toàn Claude-Agy trên Windows.
#>
param(
    [string]$TargetDir = "$env:USERPROFILE\claude-agy"
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " 🗑️ Bắt đầu gỡ cài đặt Claude-Agy trên Windows..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Dừng các tiến trình proxy nếu đang chạy
Get-Process cli-proxy-api -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "[1/3] Đã dừng các tiến trình cli-proxy-api." -ForegroundColor Green

# 2. Xóa khỏi User PATH
$binPath = Join-Path $TargetDir "bin"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -like "*$binPath*") {
    $paths = ($userPath -split ';') | Where-Object { $_ -and $_.Trim() -ne $binPath -and $_.Trim() -ne "" }
    [Environment]::SetEnvironmentVariable("Path", ($paths -join ';'), "User")
    Write-Host "[2/3] Đã gỡ $binPath khỏi User PATH." -ForegroundColor Green
} else {
    Write-Host "[2/3] $binPath không nằm trong User PATH." -ForegroundColor Yellow
}

# 3. Xóa thư mục cài đặt
if (Test-Path $TargetDir) {
    Remove-Item -Path $TargetDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "[3/3] Đã xóa toàn bộ thư mục: $TargetDir" -ForegroundColor Green
} else {
    Write-Host "[3/3] Thư mục $TargetDir không tồn tại." -ForegroundColor Yellow
}

Write-Host "`n🎉 Đã gỡ bỏ hoàn toàn Claude-Agy khỏi hệ thống Windows!" -ForegroundColor Green
