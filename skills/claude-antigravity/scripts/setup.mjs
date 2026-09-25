#!/usr/bin/env node
/**
 * Cross-Platform One-Click Setup Script for Claude Code + Antigravity (claude-agy).
 * Works natively on Windows 10/11, macOS, and Linux without shell dependencies.
 *
 * Requirements: Node.js 18+ (already required by @anthropic-ai/claude-code)
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync, spawn } from 'node:child_process';
import net from 'node:net';

const CPA_VERSION = '7.3.17';
const TARGET_DIR = process.env.TARGET_DIR || path.join(os.homedir(), 'claude-agy');

console.log('\x1b[36m============================================================\x1b[0m');
console.log('\x1b[36m 🚀 Claude-Agy Universal Cross-Platform Setup (Node.js Engine)\x1b[0m');
console.log('\x1b[36m============================================================\x1b[0m');
console.log(`\x1b[33mThư mục cài đặt: ${TARGET_DIR}\x1b[0m`);
console.log(`\x1b[33mHệ điều hành:    ${process.platform} (${process.arch})\x1b[0m\n`);

// 1. Tạo cấu trúc thư mục ứng dụng
const binDir = path.join(TARGET_DIR, 'bin');
const configDir = path.join(TARGET_DIR, 'config');
const dataDir = path.join(TARGET_DIR, 'data');
const logsDir = path.join(TARGET_DIR, 'logs');
const scriptsDir = path.join(TARGET_DIR, 'scripts');

for (const dir of [binDir, configDir, dataDir, logsDir, scriptsDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 2. Kiểm tra & Cài đặt Claude Code CLI (@anthropic-ai/claude-code)
console.log('\x1b[36m[1/6] Kiểm tra Anthropic Claude Code CLI...\x1b[0m');
let claudeAvailable = false;
try {
  const checkCmd = process.platform === 'win32' ? 'where claude' : 'which claude';
  execSync(checkCmd, { stdio: 'ignore' });
  claudeAvailable = true;
} catch {
  claudeAvailable = false;
}

if (!claudeAvailable) {
  console.log('  -> Đang cài đặt @anthropic-ai/claude-code toàn cục qua npm...');
  try {
    execSync('npm install -g @anthropic-ai/claude-code', { stdio: 'inherit' });
    console.log('  \x1b[32m-> Đã cài đặt @anthropic-ai/claude-code thành công.\x1b[0m');
  } catch (err) {
    console.error('  \x1b[31m[LỖI] Không thể cài đặt @anthropic-ai/claude-code:\x1b[0m', err.message);
    process.exit(1);
  }
} else {
  console.log('  \x1b[32m-> Claude Code CLI đã có sẵn.\x1b[0m');
}

// 3. Tải và giải nén binary CLIProxyAPI
console.log(`\n\x1b[36m[2/6] Kiểm tra CLIProxyAPI binary (v${CPA_VERSION})...\x1b[0m`);
const isWin = process.platform === 'win32';
const exeName = isWin ? 'cli-proxy-api.exe' : 'cli-proxy-api';
const proxyExePath = path.join(binDir, exeName);

if (!fs.existsSync(proxyExePath)) {
  const platform = process.platform;
  const arch = process.arch;
  let archiveName = '';
  let isZip = false;

  if (platform === 'win32') {
    isZip = true;
    archiveName = arch === 'arm64'
      ? `CLIProxyAPI_${CPA_VERSION}_windows_arm64.zip`
      : `CLIProxyAPI_${CPA_VERSION}_windows_amd64.zip`;
  } else if (platform === 'linux') {
    archiveName = arch === 'arm64'
      ? `CLIProxyAPI_${CPA_VERSION}_linux_aarch64.tar.gz`
      : `CLIProxyAPI_${CPA_VERSION}_linux_amd64.tar.gz`;
  } else if (platform === 'darwin') {
    archiveName = arch === 'arm64'
      ? `CLIProxyAPI_${CPA_VERSION}_darwin_arm64.tar.gz`
      : `CLIProxyAPI_${CPA_VERSION}_darwin_amd64.tar.gz`;
  } else {
    console.error(`  \x1b[31m[LỖI] Hệ điều hành ${platform} chưa được hỗ trợ.\x1b[0m`);
    process.exit(1);
  }

  const downloadUrl = `https://github.com/router-for-me/CLIProxyAPI/releases/download/v${CPA_VERSION}/${archiveName}`;
  const tempArchive = path.join(os.tmpdir(), archiveName);
  const tempExtract = path.join(os.tmpdir(), `cpa_extract_${Date.now()}`);

  console.log(`  -> Đang tải ${archiveName} từ GitHub...`);
  try {
    let downloaded = false;
    // 1. Thử tải bằng curl (hỗ trợ proxy tự động và chuẩn đa nền tảng)
    const curlBin = isWin ? 'curl.exe' : 'curl';
    try {
      execSync(`${curlBin} -fsSL -o "${tempArchive}" "${downloadUrl}"`, { stdio: 'inherit' });
      if (fs.existsSync(tempArchive) && fs.statSync(tempArchive).size > 1000) {
        downloaded = true;
      }
    } catch {}

    // 2. Fallback bằng powershell trên Windows nếu curl thất bại
    if (!downloaded && isWin) {
      try {
        execSync(`powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '${downloadUrl}' -OutFile '${tempArchive}' -UseBasicParsing"`, { stdio: 'inherit' });
        if (fs.existsSync(tempArchive) && fs.statSync(tempArchive).size > 1000) {
          downloaded = true;
        }
      } catch {}
    }

    // 3. Fallback bằng native fetch
    if (!downloaded) {
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const arrayBuffer = await res.arrayBuffer();
      fs.writeFileSync(tempArchive, Buffer.from(arrayBuffer));
    }
    console.log('  -> Tải hoàn tất. Đang giải nén...');

    if (!fs.existsSync(tempExtract)) fs.mkdirSync(tempExtract, { recursive: true });

    let extractSuccess = false;
    try {
      execSync(`tar -xf "${tempArchive}" -C "${tempExtract}"`, { stdio: 'ignore' });
      extractSuccess = true;
    } catch {
      if (isWin && isZip) {
        execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${tempArchive}' -DestinationPath '${tempExtract}' -Force"`, { stdio: 'ignore' });
        extractSuccess = true;
      }
    }

    if (!extractSuccess) {
      throw new Error('Giải nén archive thất bại.');
    }

    // Tìm binary đã giải nén
    function findFileRecursive(dir, targetName) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const res = findFileRecursive(full, targetName);
          if (res) return res;
        } else if (entry.name.toLowerCase() === targetName.toLowerCase()) {
          return full;
        }
      }
      return null;
    }

    const foundBinary = findFileRecursive(tempExtract, exeName);
    if (!foundBinary) {
      throw new Error(`Không tìm thấy file ${exeName} trong nội dung giải nén.`);
    }

    fs.copyFileSync(foundBinary, proxyExePath);
    if (!isWin) {
      fs.chmodSync(proxyExePath, 0o755);
    }

    // Dọn dẹp temp
    try {
      fs.rmSync(tempArchive, { force: true });
      fs.rmSync(tempExtract, { recursive: true, force: true });
    } catch {}

    console.log(`  \x1b[32m-> Đã cài đặt binary: ${proxyExePath}\x1b[0m`);
  } catch (err) {
    console.error('  \x1b[31m[LỖI] Không thể tải/cài đặt CLIProxyAPI:\x1b[0m', err.message);
    process.exit(1);
  }
} else {
  console.log(`  \x1b[32m-> Binary ${exeName} đã có sẵn.\x1b[0m`);
}

// 4. Khởi tạo cấu hình config.yaml & settings.env
console.log('\n\x1b[36m[3/6] Cấu hình proxy config.yaml & settings.env...\x1b[0m');
const yamlDataDir = dataDir.replace(/\\/g, '/');
const configYaml = `host: "127.0.0.1"
port: 8318
auth-dir: "${yamlDataDir}"
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
`;
fs.writeFileSync(path.join(configDir, 'config.yaml'), configYaml, 'utf-8');

const settingsEnv = `PORT=8318
AUTO_BYPASS_PERMISSIONS=true
DEFAULT_MODEL=claude-sonnet-4-6
`;
fs.writeFileSync(path.join(configDir, 'settings.env'), settingsEnv, 'utf-8');
console.log('  \x1b[32m-> Đã ghi file config/config.yaml và config/settings.env.\x1b[0m');

// 5. Cấu hình tự động bypass Trust Dialog của Claude Code
console.log('\n\x1b[36m[4/6] Cấu hình Claude Code Onboarding & Trust Dialog...\x1b[0m');
try {
  const claudeConfigPath = path.join(os.homedir(), '.claude.json');
  let claudeConfig = {};
  if (fs.existsSync(claudeConfigPath)) {
    try {
      claudeConfig = JSON.parse(fs.readFileSync(claudeConfigPath, 'utf-8'));
    } catch {}
  }
  claudeConfig.bypassPermissionsModeAccepted = true;
  claudeConfig.hasCompletedOnboarding = true;
  if (claudeConfig.projects && typeof claudeConfig.projects === 'object') {
    for (const key of Object.keys(claudeConfig.projects)) {
      if (typeof claudeConfig.projects[key] === 'object' && claudeConfig.projects[key] !== null) {
        claudeConfig.projects[key].hasTrustDialogAccepted = true;
      }
    }
  }
  fs.writeFileSync(claudeConfigPath, JSON.stringify(claudeConfig, null, 2), 'utf-8');
  console.log('  \x1b[32m-> Đã tự động cấu hình bypass dialog trong ~/.claude.json.\x1b[0m');
} catch (err) {
  console.log('  \x1b[33m-> Bỏ qua thiết lập trust dialog:\x1b[0m', err.message);
}

// 6. Dynamic Multi-Source Token Resolver
console.log('\n\x1b[36m[5/6] Đồng bộ Google Antigravity OAuth Token (Dynamic Resolver)...\x1b[0m');
export function resolveAntigravityToken(appDataDir) {
  const home = os.homedir();
  const tokenCandidates = [
    path.join(home, '.gemini', 'antigravity-cli', 'antigravity-oauth-token'),
    path.join(home, '.gemini', 'jetski-standalone-oauth-token'),
    path.join(home, '.gemini', 'oauth_creds.json')
  ];

  for (const candidatePath of tokenCandidates) {
    if (fs.existsSync(candidatePath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(candidatePath, 'utf-8'));
        const tok = raw.token || raw;
        const idTok = raw.id_token || '';
        const accessToken = tok.access_token || raw.access_token;
        const refreshToken = tok.refresh_token || raw.refresh_token;
        const expiry = tok.expiry || raw.expiry_date || '';

        if (accessToken && refreshToken) {
          let email = 'user@antigravity';
          if (idTok && idTok.includes('.')) {
            try {
              const parts = idTok.split('.');
              if (parts.length >= 2) {
                const payloadStr = Buffer.from(parts[1], 'base64').toString('utf-8');
                const payload = JSON.parse(payloadStr);
                if (payload.email) email = payload.email;
              }
            } catch {}
          }

          const authObj = {
            type: 'antigravity',
            email: email,
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: 3600,
            timestamp: Date.now(),
            expired: expiry
          };

          const targetAuthFile = path.join(appDataDir, 'antigravity-auth.json');
          fs.writeFileSync(targetAuthFile, JSON.stringify(authObj, null, 2), 'utf-8');
          return { success: true, email, source: candidatePath };
        }
      } catch (err) {
        // Tiếp tục kiểm tra candidate tiếp theo
      }
    }
  }
  return { success: false, error: 'Không tìm thấy file token Antigravity hợp lệ tại ~/.gemini' };
}

const syncResult = resolveAntigravityToken(dataDir);
if (syncResult.success) {
  console.log(`  \x1b[32m-> [OK] Đã phát hiện và đồng bộ token thành công từ:\x1b[0m\n     📂 ${syncResult.source}`);
  console.log(`     👤 Tài khoản: \x1b[33m${syncResult.email}\x1b[0m`);
} else {
  console.log(`  \x1b[33m-> [CHÚ Ý] ${syncResult.error}.\x1b[0m`);
  console.log('     Bạn có thể đăng nhập bằng lệnh: cli-proxy-api --config config/config.yaml -antigravity-login');
}

// 7. Tạo Launcher Script Đa Nền Tảng (bin/claude-agy.mjs + wrappers)
console.log('\n\x1b[36m[6/6] Khởi tạo Universal Launcher (claude-agy.mjs)...\x1b[0m');

const launcherCode = `#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const binDir = path.dirname(__filename);
const appDir = path.resolve(binDir, '..');
const isWin = process.platform === 'win32';

// 1. Dynamic Token Sync trước khi chạy
function syncToken() {
  const home = os.homedir();
  const tokenCandidates = [
    path.join(home, '.gemini', 'antigravity-cli', 'antigravity-oauth-token'),
    path.join(home, '.gemini', 'jetski-standalone-oauth-token'),
    path.join(home, '.gemini', 'oauth_creds.json')
  ];
  for (const p of tokenCandidates) {
    if (fs.existsSync(p)) {
      try {
        const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
        const tok = raw.token || raw;
        const idTok = raw.id_token || '';
        const accessToken = tok.access_token || raw.access_token;
        const refreshToken = tok.refresh_token || raw.refresh_token;
        const expiry = tok.expiry || raw.expiry_date || '';
        if (accessToken && refreshToken) {
          let email = 'user@antigravity';
          if (idTok && idTok.includes('.')) {
            try {
              const payload = JSON.parse(Buffer.from(idTok.split('.')[1], 'base64').toString('utf-8'));
              if (payload.email) email = payload.email;
            } catch {}
          }
          const authObj = {
            type: 'antigravity',
            email,
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: 3600,
            timestamp: Date.now(),
            expired: expiry
          };
          fs.writeFileSync(path.join(appDir, 'data', 'antigravity-auth.json'), JSON.stringify(authObj, null, 2), 'utf-8');
          return;
        }
      } catch {}
    }
  }
}
syncToken();

// 2. Đọc settings.env
let port = 8318;
let autoBypass = true;
let defaultModel = 'claude-sonnet-4-6';

const settingsPath = path.join(appDir, 'config', 'settings.env');
if (fs.existsSync(settingsPath)) {
  const lines = fs.readFileSync(settingsPath, 'utf-8').split('\\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...vParts] = trimmed.split('=');
      const val = vParts.join('=').trim().replace(/^["']|["']$/g, '');
      if (k.trim() === 'PORT') port = parseInt(val, 10) || 8318;
      if (k.trim() === 'AUTO_BYPASS_PERMISSIONS') autoBypass = val === 'true';
      if (k.trim() === 'DEFAULT_MODEL') defaultModel = val;
    }
  }
}

// 3. Phân tích tham số dòng lệnh
const rawArgs = process.argv.slice(2);
let enableBypass = autoBypass;
let modelSpecified = false;
const processedArgs = [];

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === '--bypass' || arg === '-y' || arg === '--dangerously-skip-permissions') {
    enableBypass = true;
  } else if (arg === '--no-bypass') {
    enableBypass = false;
  } else {
    if (arg === '--model' || arg === '-m' || arg.startsWith('--model=')) {
      modelSpecified = true;
    }
    processedArgs.push(arg);
  }
}

if (!modelSpecified && defaultModel) {
  processedArgs.unshift(defaultModel);
  processedArgs.unshift('--model');
}

if (enableBypass) {
  process.env.IS_SANDBOX = '1';
  if (!processedArgs.includes('--dangerously-skip-permissions')) {
    processedArgs.unshift('--dangerously-skip-permissions');
  }
}

process.env.ANTHROPIC_BASE_URL = \`http://127.0.0.1:\${port}\`;
process.env.ANTHROPIC_AUTH_TOKEN = 'sk-personal-claude-token';
process.env.CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY = '1';

// 4. Kiểm tra cổng proxy và khởi chạy ngầm nếu chưa chạy
function isPortOpen(host, portNum) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(250);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => { socket.destroy(); resolve(false); });
    socket.connect(portNum, host);
  });
}

let proxyProc = null;
let startedProxy = false;

const portAlreadyOpen = await isPortOpen('127.0.0.1', port);
if (!portAlreadyOpen) {
  const proxyExe = path.join(appDir, 'bin', isWin ? 'cli-proxy-api.exe' : 'cli-proxy-api');
  const proxyConfig = path.join(appDir, 'config', 'config.yaml');
  const proxyLog = fs.openSync(path.join(appDir, 'logs', 'proxy.log'), 'a');
  const proxyErr = fs.openSync(path.join(appDir, 'logs', 'proxy.err.log'), 'a');

  proxyProc = spawn(proxyExe, ['--config', proxyConfig], {
    detached: !isWin,
    stdio: ['ignore', proxyLog, proxyErr],
    windowsHide: true
  });
  startedProxy = true;

  // Đợi cổng mở (tối đa 5s)
  let ready = false;
  for (let attempt = 0; attempt < 25; attempt++) {
    await new Promise((r) => setTimeout(r, 200));
    if (await isPortOpen('127.0.0.1', port)) {
      ready = true;
      break;
    }
  }
  if (!ready) {
    console.error('\\x1b[31m[LỖI] Không thể kết nối tới Proxy. Xem chi tiết tại logs/proxy.err.log\\x1b[0m');
    if (proxyProc) proxyProc.kill();
    process.exit(1);
  }
}

// 5. Khởi chạy Claude Code CLI
const claudeExecutable = isWin ? 'claude.cmd' : 'claude';
const claudeProc = spawn(claudeExecutable, processedArgs, {
  stdio: 'inherit',
  shell: isWin
});

function cleanup() {
  if (startedProxy && proxyProc) {
    try {
      if (isWin) {
        spawn('taskkill', ['/pid', proxyProc.pid.toString(), '/f', '/t'], { stdio: 'ignore' });
      } else {
        proxyProc.kill('SIGTERM');
      }
    } catch {}
  }
}

process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });
process.on('exit', () => cleanup());

claudeProc.on('exit', (code) => {
  cleanup();
  process.exit(code ?? 0);
});
`;

fs.writeFileSync(path.join(binDir, 'claude-agy.mjs'), launcherCode, 'utf-8');
if (!isWin) {
  fs.chmodSync(path.join(binDir, 'claude-agy.mjs'), 0o755);
}

// Tạo wrapper cho Windows CMD & PowerShell
if (isWin) {
  const cmdWrapper = `@echo off\r\nnode "%~dp0claude-agy.mjs" %*\r\n`;
  fs.writeFileSync(path.join(binDir, 'claude-agy.cmd'), cmdWrapper, 'ascii');
}

// Tạo symlink hoặc shell shim cho Unix
if (!isWin) {
  const shShim = `#!/usr/bin/env bash\nexec node "${path.join(binDir, 'claude-agy.mjs')}" "$@"\n`;
  const shPath = path.join(binDir, 'claude-agy');
  fs.writeFileSync(shPath, shShim, 'utf-8');
  fs.chmodSync(shPath, 0o755);
}

// Tạo uninstaller đa nền tảng
const uninstallerCode = `#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const appDir = path.resolve(path.dirname(__filename), '..');

console.log('\\x1b[36m>> Bắt đầu gỡ cài đặt Claude-Agy...\\x1b[0m');

try {
  if (process.platform === 'win32') {
    execSync('taskkill /f /im cli-proxy-api.exe', { stdio: 'ignore' });
  } else {
    execSync('pkill -f cli-proxy-api', { stdio: 'ignore' });
  }
} catch {}

if (process.platform === 'win32') {
  try {
    const binDir = path.join(appDir, 'bin');
    execSync(\`powershell -NoProfile -Command "$p = [Environment]::GetEnvironmentVariable('Path', 'User'); if ($p -like '*\${binDir}*') { [Environment]::SetEnvironmentVariable('Path', (($p -split ';' | Where-Object { $_ -and $_ -ne '\${binDir}' }) -join ';'), 'User') }"\`, { stdio: 'ignore' });
  } catch {}
}

console.log('\\x1b[32m>> Đã dừng tiến trình proxy và gỡ PATH thành công.\\x1b[0m');
console.log(\`>> Để xóa sạch dữ liệu, hãy chạy: rm -rf "\${appDir}" hoặc Remove-Item -Recurse -Force "\${appDir}"\`);
`;
fs.writeFileSync(path.join(scriptsDir, 'uninstall.mjs'), uninstallerCode, 'utf-8');
fs.writeFileSync(path.join(TARGET_DIR, 'uninstall.mjs'), uninstallerCode, 'utf-8');

// 8. Cấu hình biến môi trường PATH
console.log('\n\x1b[36mCấu hình môi trường PATH toàn cục...\x1b[0m');
if (isWin) {
  try {
    const psCheck = `powershell -NoProfile -Command "$u = [Environment]::GetEnvironmentVariable('Path', 'User'); if (-not ($u -split ';' -contains '${binDir}')) { [Environment]::SetEnvironmentVariable('Path', ($u + ';${binDir}'), 'User') }"`;
    execSync(psCheck, { stdio: 'ignore' });
    console.log(`  \x1b[32m-> Đã thêm ${binDir} vào User PATH.\x1b[0m`);
  } catch (err) {
    console.log('  \x1b[33m-> Không thể ghi tự động vào User PATH, vui lòng thêm thủ công:\x1b[0m', binDir);
  }
} else {
  // Symlink vào /usr/local/bin nếu có quyền sudo, hoặc gợi ý PATH
  try {
    const symlinkTarget = '/usr/local/bin/claude-agy';
    if (!fs.existsSync(symlinkTarget)) {
      execSync(`ln -sf "${path.join(binDir, 'claude-agy')}" "${symlinkTarget}"`, { stdio: 'ignore' });
      console.log(`  \x1b[32m-> Đã tạo symlink toàn cục tại ${symlinkTarget}.\x1b[0m`);
    }
  } catch {
    console.log(`  \x1b[33m-> Hãy thêm dòng sau vào ~/.bashrc hoặc ~/.zshrc:\x1b[0m export PATH="$PATH:${binDir}"`);
  }
}

console.log(`
\x1b[32m============================================================\x1b[0m
\x1b[32m 🎉 HOÀN TẤT CÀI ĐẶT CLAUDE-AGY (UNIVERSAL ENGINE)!\x1b[0m
\x1b[32m============================================================\x1b[0m
 \x1b[36m👉 Lệnh sử dụng:\x1b[0m claude-agy
 \x1b[36m👉 Đổi Model:\x1b[0m    Trong khung chat Claude, gõ \x1b[33m/model\x1b[0m
 \x1b[36m👉 Gỡ cài đặt:\x1b[0m   node "${path.join(TARGET_DIR, 'uninstall.mjs')}"

 * Mẹo: Mở một cửa sổ Terminal mới để nhận diện lệnh 'claude-agy' ngay lập tức.
`);
