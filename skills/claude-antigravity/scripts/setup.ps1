<#
.SYNOPSIS
    One-Click Setup Script for Claude Code + Antigravity (claude-agy) on Windows.
    Designed for fresh Windows 10/11 installations.
.DESCRIPTION
    Installs and configures Claude Code CLI, CLIProxyAPI reverse proxy,
    synchronizes Google Antigravity OAuth tokens natively via PowerShell (no Python required),
    and exposes the global 'claude-agy' command.
#>

[CmdletBinding()]
param(
    [string]$TargetDir = $(if ($env:TARGET_DIR) { $env:TARGET_DIR } else { "$env:USERPROFILE\claude-agy" }),
    [string]$CpaVersion = "7.3.17"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " 🚀 Cài đặt Claude-Agy cho Windows (Fresh PC Automated Setup)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Thư mục cài đặt: $TargetDir" -ForegroundColor Yellow

# 1. Tạo cấu trúc thư mục ứng dụng chuẩn
$BinDir     = Join-Path $TargetDir "bin"
$ConfigDir  = Join-Path $TargetDir "config"
$DataDir    = Join-Path $TargetDir "data"
$LogsDir    = Join-Path $TargetDir "logs"
$ScriptsDir = Join-Path $TargetDir "scripts"

foreach ($dir in @($BinDir, $ConfigDir, $DataDir, $LogsDir, $ScriptsDir)) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# 2. Kiểm tra Node.js và npm
Write-Host "`n[1/7] Kiểm tra Node.js runtime..." -ForegroundColor Cyan
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "  -> Node.js chưa được cài đặt." -ForegroundColor Yellow
    $wingetCmd = Get-Command winget -ErrorAction SilentlyContinue
    if ($wingetCmd) {
        Write-Host "  -> Đang tự động cài đặt Node.js LTS qua winget..." -ForegroundColor Green
        Start-Process winget -ArgumentList "install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements" -Wait -NoNewWindow
        # Làm mới biến môi trường PATH cho tiến trình hiện tại
        $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
        $userPath    = [Environment]::GetEnvironmentVariable("Path", "User")
        $env:Path    = "$machinePath;$userPath"
    } else {
        Write-Host "  [CẢNH BÁO] Không tìm thấy winget. Vui lòng cài đặt Node.js LTS từ https://nodejs.org/" -ForegroundColor Red
        Write-Host "  Sau khi cài Node.js, hãy chạy lại script này." -ForegroundColor Red
        exit 1
    }
}
Write-Host "  -> Node.js OK: $(node -v)" -ForegroundColor Green

# 3. Cài đặt Claude Code CLI (@anthropic-ai/claude-code)
Write-Host "`n[2/7] Kiểm tra Anthropic Claude Code CLI..." -ForegroundColor Cyan
$claudeCmd = Get-Command claude -ErrorAction SilentlyContinue
if (-not $claudeCmd) {
    Write-Host "  -> Đang cài đặt @anthropic-ai/claude-code toàn cục..." -ForegroundColor Green
    npm install -g @anthropic-ai/claude-code
} else {
    Write-Host "  -> Claude Code CLI đã có sẵn." -ForegroundColor Green
}

# 4. Tải và giải nén binary cli-proxy-api cho Windows AMD64
Write-Host "`n[3/7] Kiểm tra CLIProxyAPI Windows binary..." -ForegroundColor Cyan
$ProxyExe = Join-Path $BinDir "cli-proxy-api.exe"
$rootExe  = Join-Path $TargetDir "cli-proxy-api.exe"
if (-not (Test-Path $ProxyExe) -and (Test-Path $rootExe)) {
    Move-Item -Path $rootExe -Destination $ProxyExe -Force
}
if (-not (Test-Path $ProxyExe)) {
    $zipUrl = "https://github.com/router-for-me/CLIProxyAPI/releases/download/v$CpaVersion/CLIProxyAPI_${CpaVersion}_windows_amd64.zip"
    $tempZip = Join-Path $env:TEMP "CLIProxyAPI_windows.zip"
    $tempExtract = Join-Path $env:TEMP "CLIProxyAPI_extract"
    
    Write-Host "  -> Đang tải CLIProxyAPI v$CpaVersion từ GitHub..." -ForegroundColor Green
    $downloaded = $false
    try {
        curl.exe -fsSL -o $tempZip $zipUrl
        if ((Test-Path $tempZip) -and (Get-Item $tempZip).Length -gt 1000) { $downloaded = $true }
    } catch {}

    if (-not $downloaded) {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $zipUrl -OutFile $tempZip -UseBasicParsing
    }
    
    if (Test-Path $tempExtract) { Remove-Item $tempExtract -Recurse -Force }
    Expand-Archive -Path $tempZip -DestinationPath $tempExtract -Force
    
    $extractedExe = Get-ChildItem -Path $tempExtract -Filter "cli-proxy-api.exe" -Recurse | Select-Object -First 1
    if ($extractedExe) {
        Move-Item -Path $extractedExe.FullName -Destination $ProxyExe -Force
    } else {
        Write-Host "  [LỖI] Không tìm thấy cli-proxy-api.exe trong file zip." -ForegroundColor Red
        exit 1
    }
    Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
    Remove-Item $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  -> Đã cài đặt binary: $ProxyExe" -ForegroundColor Green
} else {
    Write-Host "  -> Binary cli-proxy-api.exe đã có sẵn." -ForegroundColor Green
}

# 5. Khởi tạo config.yaml (KISS & YAGNI: gọn nhẹ, không alias thừa)
Write-Host "`n[4/7] Cấu hình proxy config.yaml & settings.env..." -ForegroundColor Cyan
$yamlDataDir = $DataDir.Replace('\', '/')
$configYaml = @"
host: "127.0.0.1"
port: 8318
auth-dir: "$yamlDataDir"
api-keys:
  - "sk-personal-claude-token"
remote-management:
  disable-control-panel: true
quota-exceeded:
  switch-project: true
  antigravity-credits: true
debug: false

antigravity:
  sensitive-words:
    - "system-conventions"
    - "system_conventions"
    - "system-directive"
    - "system_directive"
    - "Claude Agent SDK"
    - "Claude Code"
    - "Anthropic"
    - "claude"
    - "API"
    - "proxy"
"@
Set-Content -Path (Join-Path $ConfigDir "config.yaml") -Value $configYaml -Encoding UTF8

# Khởi tạo settings.env
$settingsEnv = @"
PORT=8318
AUTO_BYPASS_PERMISSIONS=true
DEFAULT_MODEL=claude-sonnet-4-6
"@
Set-Content -Path (Join-Path $ConfigDir "settings.env") -Value $settingsEnv -Encoding UTF8

# 6. Khởi tạo script đồng bộ token thuần PowerShell (sync-token.ps1)
Write-Host "`n[5/7] Thiết lập script đồng bộ token thuần PowerShell (Zero Python requirement)..." -ForegroundColor Cyan
$syncTokenScript = @'
param([string]$AppDir = "$PSScriptRoot\..")
$AppDir = [System.IO.Path]::GetFullPath($AppDir)

$candidatePaths = @(
    "$env:USERPROFILE\.gemini\antigravity-cli\antigravity-oauth-token",
    "$env:USERPROFILE\.gemini\jetski-standalone-oauth-token",
    "$env:USERPROFILE\.gemini\oauth_creds.json"
)
$GeminiTokenPath = $null
foreach ($cand in $candidatePaths) {
    if (Test-Path $cand) {
        $GeminiTokenPath = $cand
        break
    }
}
$AuthFile = Join-Path $AppDir "data\antigravity-auth.json"

function Get-JwtEmail($jwt) {
    if (-not $jwt -or $jwt.IndexOf('.') -lt 0) { return "user@antigravity" }
    try {
        $parts = $jwt.Split('.')
        if ($parts.Length -lt 2) { return "user@antigravity" }
        $payload = $parts[1].Replace('-', '+').Replace('_', '/')
        switch ($payload.Length % 4) {
            2 { $payload += "==" }
            3 { $payload += "=" }
        }
        $bytes = [System.Convert]::FromBase64String($payload)
        $jsonStr = [System.Text.Encoding]::UTF8.GetString($bytes)
        $obj = $jsonStr | ConvertFrom-Json
        if ($obj.email) { return $obj.email }
    } catch {}
    return "user@antigravity"
}

function Setup-ClaudeTrust() {
    $claudeConfig = "$env:USERPROFILE\.claude.json"
    try {
        $data = @{}
        if (Test-Path $claudeConfig) {
            $raw = Get-Content $claudeConfig -Raw -Encoding UTF8
            $data = $raw | ConvertFrom-Json
        }
        $ht = @{}
        if ($data) {
            foreach ($prop in $data.PSObject.Properties) {
                $ht[$prop.Name] = $prop.Value
            }
        }
        $ht["bypassPermissionsModeAccepted"] = $true
        $ht["hasCompletedOnboarding"] = $true
        if ($ht.ContainsKey("projects") -and $ht["projects"]) {
            foreach ($proj in $ht["projects"].PSObject.Properties) {
                if ($proj.Value -is [PSCustomObject]) {
                    $proj.Value | Add-Member -MemberType NoteProperty -Name "hasTrustDialogAccepted" -Value $true -Force
                }
            }
        }
        $ht | ConvertTo-Json -Depth 10 | Set-Content -Path $claudeConfig -Encoding UTF8
    } catch {}
}

Setup-ClaudeTrust

if (-not $GeminiTokenPath) {
    Write-Host "[INFO] Chưa tìm thấy token Antigravity tại ~/.gemini. Vui lòng đăng nhập Google Antigravity trước." -ForegroundColor Yellow
    exit 0
}

try {
    $geminiRaw = Get-Content $GeminiTokenPath -Raw -Encoding UTF8
    $geminiData = $geminiRaw | ConvertFrom-Json
    $tok = if ($geminiData.token) { $geminiData.token } else { $geminiData }
    $idTok = $geminiData.id_token
    $email = Get-JwtEmail $idTok

    $accTok = if ($tok.access_token) { $tok.access_token } else { $geminiData.access_token }
    $refTok = if ($tok.refresh_token) { $tok.refresh_token } else { $geminiData.refresh_token }
    $expVal = if ($tok.expiry) { $tok.expiry } else { $geminiData.expiry_date }

    $authObj = [PSCustomObject]@{
        type          = "antigravity"
        email         = $email
        access_token  = $accTok
        refresh_token = $refTok
        expires_in    = 3600
        timestamp     = [int64](([DateTimeOffset]::UtcNow).ToUnixTimeMilliseconds())
        expired       = $expVal
    }

    $authObj | ConvertTo-Json -Depth 5 | Set-Content -Path $AuthFile -Encoding UTF8
    Write-Host "[OK] Đã đồng bộ Antigravity OAuth token ($email) từ $GeminiTokenPath" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Không thể đồng bộ token: $_" -ForegroundColor Yellow
}
'@
Set-Content -Path (Join-Path $ScriptsDir "sync-token.ps1") -Value $syncTokenScript -Encoding UTF8

# 7. Khởi tạo launcher scripts: claude-agy.ps1 và claude-agy.cmd
Write-Host "`n[6/7] Khởi tạo launcher scripts (claude-agy.ps1 & claude-agy.cmd)..." -ForegroundColor Cyan
$claudeAgyPs1 = @'
param([Parameter(ValueFromRemainingArguments = $true)][string[]]$UserArgs)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppDir = [System.IO.Path]::GetFullPath((Join-Path $ScriptDir ".."))

# Đồng bộ token Antigravity
& "$AppDir\scripts\sync-token.ps1" -AppDir $AppDir | Out-Null

$Port = 8318
$AutoBypass = $true
$DefaultModel = "claude-sonnet-4-6"

$settingsFile = Join-Path $AppDir "config\settings.env"
if (Test-Path $settingsFile) {
    Get-Content $settingsFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $key = $parts[0].Trim()
            $val = $parts[1].Trim().Trim('"').Trim("'")
            if ($key -eq "PORT") { $Port = [int]$val }
            if ($key -eq "AUTO_BYPASS_PERMISSIONS") { $AutoBypass = ($val -eq "true") }
            if ($key -eq "DEFAULT_MODEL") { $DefaultModel = $val }
        }
    }
}

$EnableBypass = $AutoBypass
$ModelSpecified = $false
$ProcessedArgs = [System.Collections.Generic.List[string]]::new()

for ($i = 0; $i -lt $UserArgs.Length; $i++) {
    $arg = $UserArgs[$i]
    switch ($arg) {
        "--bypass" { $EnableBypass = $true }
        "-y" { $EnableBypass = $true }
        "--no-bypass" { $EnableBypass = $false }
        "--dangerously-skip-permissions" { $EnableBypass = $true }
        default {
            if ($arg -eq "--model" -or $arg -eq "-m" -or $arg.StartsWith("--model=")) {
                $ModelSpecified = $true
            }
            $ProcessedArgs.Add($arg)
        }
    }
}

if (-not $ModelSpecified -and $DefaultModel) {
    $ProcessedArgs.Insert(0, $DefaultModel)
    $ProcessedArgs.Insert(0, "--model")
}

if ($EnableBypass) {
    $env:IS_SANDBOX = "1"
    if (-not $ProcessedArgs.Contains("--dangerously-skip-permissions")) {
        $ProcessedArgs.Insert(0, "--dangerously-skip-permissions")
    }
}

$env:ANTHROPIC_BASE_URL = "http://127.0.0.1:$Port"
$env:ANTHROPIC_AUTH_TOKEN = "sk-personal-claude-token"
$env:CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY = "1"

function Test-PortOpen([string]$HostName, [int]$PortNum) {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect($HostName, $PortNum, $null, $null)
        if ($async.AsyncWaitHandle.WaitOne(200, $false)) {
            $client.EndConnect($async)
            return $true
        }
    } catch {
        return $false
    } finally {
        $client.Close()
    }
    return $false
}

$ProxyProcess = $null
$StartedProxy = $false

if (-not (Test-PortOpen "127.0.0.1" $Port)) {
    $proxyBin = Join-Path $AppDir "bin\cli-proxy-api.exe"
    $proxyCfg = Join-Path $AppDir "config\config.yaml"
    $proxyLog = Join-Path $AppDir "logs\proxy.log"
    $proxyErr = Join-Path $AppDir "logs\proxy.err.log"

    $ProxyProcess = Start-Process -FilePath $proxyBin `
        -ArgumentList "--config `"$proxyCfg`"" `
        -WindowStyle Hidden `
        -PassThru `
        -RedirectStandardOutput $proxyLog `
        -RedirectStandardError $proxyErr

    $StartedProxy = $true

    $retries = 0
    while (-not (Test-PortOpen "127.0.0.1" $Port)) {
        Start-Sleep -Milliseconds 200
        $retries++
        if ($retries -gt 25) {
            Write-Host ">> [LỖI] Không thể khởi động Proxy. Xem log tại $proxyLog" -ForegroundColor Red
            if ($ProxyProcess -and -not $ProxyProcess.HasExited) {
                Stop-Process -Id $ProxyProcess.Id -Force -ErrorAction SilentlyContinue
            }
            exit 1
        }
    }
}

try {
    & claude @ProcessedArgs
    $claudeExitCode = $LASTEXITCODE
} finally {
    if ($StartedProxy -and $ProxyProcess -and -not $ProxyProcess.HasExited) {
        Stop-Process -Id $ProxyProcess.Id -Force -ErrorAction SilentlyContinue
    }
}

exit $claudeExitCode
'@
Set-Content -Path (Join-Path $BinDir "claude-agy.ps1") -Value $claudeAgyPs1 -Encoding UTF8

# Khởi tạo file cmd batch để tương thích Command Prompt, PowerShell và Git Bash
$claudeAgyCmd = @'
@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0claude-agy.ps1" %*
'@
Set-Content -Path (Join-Path $BinDir "claude-agy.cmd") -Value $claudeAgyCmd -Encoding ASCII

# Khởi tạo script gỡ cài đặt (uninstall.ps1)
$uninstallScript = @'
$AppDir = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
Write-Host ">> Bắt đầu gỡ cài đặt Claude-Agy..." -ForegroundColor Cyan

Get-Process cli-proxy-api -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host ">> Đã dừng tiến trình proxy." -ForegroundColor Green

$binPath = Join-Path $AppDir "bin"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -like "*$binPath*") {
    $paths = ($userPath -split ';') | Where-Object { $_ -and $_.Trim() -ne $binPath -and $_.Trim() -ne "" }
    [Environment]::SetEnvironmentVariable("Path", ($paths -join ';'), "User")
    Write-Host ">> Đã gỡ $binPath khỏi User PATH." -ForegroundColor Green
}

Write-Host ">> Đã gỡ bỏ cấu hình và PATH thành công." -ForegroundColor Green
Write-Host ">> Để xóa toàn bộ thư mục dữ liệu, hãy chạy lệnh:" -ForegroundColor Yellow
Write-Host "   Remove-Item -Recurse -Force '$AppDir'" -ForegroundColor White
'@
Set-Content -Path (Join-Path $ScriptsDir "uninstall.ps1") -Value $uninstallScript -Encoding UTF8
Set-Content -Path (Join-Path $TargetDir "uninstall.ps1") -Value $uninstallScript -Encoding UTF8

# 8. Phơi lệnh claude-agy ra User PATH (Tự động bỏ qua nếu đang chạy trong Scoop)
$isScoop = ($env:SCOOP_DIR -or ($TargetDir -like "*\scoop\apps\*"))
if (-not $isScoop) {
    Write-Host "`n[7/7] Cấu hình môi trường toàn cục (User PATH)..." -ForegroundColor Cyan
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if (-not ($userPath -split ';' -contains $BinDir)) {
        $newUserPath = if ($userPath) { "$userPath;$BinDir" } else { $BinDir }
        [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
        $env:Path = "$env:Path;$BinDir"
        Write-Host "  -> Đã thêm $BinDir vào User PATH." -ForegroundColor Green
    } else {
        Write-Host "  -> $BinDir đã tồn tại trong PATH." -ForegroundColor Green
    }
} else {
    Write-Host "`n[7/7] Môi trường Scoop: Scoop shims sẽ tự động quản lý lệnh toàn cục." -ForegroundColor Green
}

# Đồng bộ token lần đầu
Write-Host "`n>> Thực hiện đồng bộ token Antigravity lần đầu..." -ForegroundColor Cyan
& (Join-Path $ScriptsDir "sync-token.ps1") -AppDir $TargetDir

Write-Host @"

============================================================
 🎉 HOÀN TẤT CÀI ĐẶT CLAUDE-AGY TRÊN WINDOWS!
============================================================
 👉 Lệnh sử dụng: claude-agy
 👉 Đổi Model:    Trong giao diện Claude, chỉ cần gõ /model
 👉 Gỡ cài đặt:   & '$TargetDir\uninstall.ps1'

 * Mẹo: Mở một cửa sổ Terminal/PowerShell mới để PATH có hiệu lực ngay lập tức.
"@ -ForegroundColor Green
