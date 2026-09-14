import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('====================================================');
console.log('Starting Multi-Agent AI Platform...');
console.log('====================================================');

const backendPath = path.resolve(__dirname, 'backend');
const frontendPath = path.resolve(__dirname, 'frontend');

const backend = spawn(npmCmd, ['run', 'dev'], {
  cwd: backendPath,
  stdio: 'inherit',
  shell: true
});

const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: frontendPath,
  stdio: 'inherit',
  shell: true
});

console.log('\nBackend Gateway (Port 5050), Services (5001-5004)');
console.log('Frontend UI (Port 5174)');
console.log('Opening browser at: http://localhost:5174\n');

setTimeout(() => {
  const startCmd = isWin ? 'cmd.exe' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
  const args = isWin ? ['/c', 'start', 'http://localhost:5174'] : ['http://localhost:5174'];
  spawn(startCmd, args, { stdio: 'ignore' });
}, 3500);

const cleanExit = () => {
  try {
    backend.kill();
    frontend.kill();
  } catch (e) {}
  process.exit();
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
