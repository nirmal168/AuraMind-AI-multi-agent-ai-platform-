import { spawn } from 'child_process';
import path from 'path';
import net from 'net';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const findAvailablePort = async (startPort = 5174, endPort = 5199) => {
  for (let port = startPort; port <= endPort; port += 1) {
    const isAvailable = await new Promise((resolve) => {
      const tester = net.createServer();
      tester.once('error', () => resolve(false));
      tester.once('listening', () => {
        tester.close(() => resolve(true));
      });
      tester.listen(port, '127.0.0.1');
    });

    if (isAvailable) return port;
  }

  return startPort;
};

console.log('====================================================');
console.log('Starting Multi-Agent AI Platform...');
console.log('====================================================');

const backendPath = path.resolve(__dirname, 'backend');
const frontendPath = path.resolve(__dirname, 'frontend');

const frontendPort = await findAvailablePort();

const backend = spawn(npmCmd, ['run', 'dev'], {
  cwd: backendPath,
  stdio: 'inherit',
  shell: true
});

const frontend = spawn(npmCmd, ['run', 'dev', '--', '--host', '0.0.0.0', '--port', String(frontendPort)], {
  cwd: frontendPath,
  stdio: 'inherit',
  shell: true
});

console.log('\nBackend Gateway (Port 5050), Services (5001-5004)');
console.log(`Frontend UI (Port ${frontendPort})`);
console.log(`Opening browser at: http://localhost:${frontendPort}\n`);

setTimeout(() => {
  const startCmd = isWin ? 'cmd.exe' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
  const args = isWin ? ['/c', 'start', `http://localhost:${frontendPort}`] : [`http://localhost:${frontendPort}`];
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
