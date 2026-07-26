const { execSync } = require('child_process');
const path = require('path');

function runCommand(command, options = {}) {
  try {
    return execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    if (options.ignoreError) {
      return null;
    }
    console.error(`Command failed: ${command}`);
    process.exit(1);
  }
}

const sleep = (ms) => {
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  } catch (e) {
    const start = Date.now();
    while (Date.now() - start < ms) {}
  }
};

console.log('Starting PostgreSQL container...');
const dockerComposePath = path.join(__dirname, 'docker-compose.yml');
runCommand(`docker compose -f "${dockerComposePath}" up -d`);

console.log('Waiting for database to be ready...');
let isReady = false;
const maxAttempts = 30;
let attempts = 0;

while (!isReady && attempts < maxAttempts) {
  attempts++;
  try {
    execSync('docker exec college-erp-postgres pg_isready -U postgres', { stdio: 'ignore' });
    isReady = true;
  } catch (e) {
    sleep(1000);
  }
}

if (!isReady) {
  console.error('Database failed to start in time.');
  process.exit(1);
}

console.log('Database is ready. Syncing migration status...');
const backendDir = path.join(__dirname, '..', 'backend');

try {
  execSync('npx prisma migrate resolve --applied 20260712000000_add_semester', {
    cwd: backendDir,
    stdio: 'inherit'
  });
} catch (error) {
  // prisma migrate resolve returns non-zero code on P3008 (already applied), which we ignore.
  console.log('Migration status checked (either already applied or resolved).');
}

console.log('Database start process completed successfully.');
