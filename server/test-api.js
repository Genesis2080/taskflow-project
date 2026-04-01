const http = require('http');
const { spawn } = require('child_process');

const BASE_PATH = '/api/v1/tasks';
const BASE_URL = 'http://localhost:3000';
let server;

function startServer() {
  return new Promise((resolve, reject) => {
    server = spawn('node', ['src/index.js'], { cwd: __dirname, stdio: 'pipe' });
    server.stdout.on('data', data => {
      console.log(data.toString());
      if (data.toString().includes('Servidor escuchando')) {
        setTimeout(resolve, 500);
      }
    });
    server.on('error', reject);
  });
}

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const fullPath = path === '/' ? BASE_PATH : BASE_PATH + path;
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: fullPath,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, body: json });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('=== Test Endpoints TaskFlow ===\n');

  // Test 1: GET all tasks (empty)
  console.log('1. GET /api/v1/tasks');
  let res = await request('GET', '/');
  console.log(`   Status: ${res.status}, Body: ${JSON.stringify(res.body)}\n`);

  // Test 2: POST create task (valid)
  console.log('2. POST /api/v1/tasks (válido)');
  res = await request('POST', '/', { text: 'Tarea de prueba', priority: 'urgent', category: 'Trabajo' });
  console.log(`   Status: ${res.status}, Body: ${JSON.stringify(res.body)}\n`);
  const taskId = res.body?.id;

  // Test 3: POST create task (missing text)
  console.log('3. POST /api/v1/tasks (sin texto)');
  res = await request('POST', '/', { priority: 'urgent' });
  console.log(`   Status: ${res.status}, Body: ${JSON.stringify(res.body)}\n`);

  // Test 4: POST create task (invalid priority)
  console.log('4. POST /api/v1/tasks (prioridad inválida)');
  res = await request('POST', '/', { text: 'Test', priority: 'invalid' });
  console.log(`   Status: ${res.status}, Body: ${JSON.stringify(res.body)}\n`);

  // Test 5: GET single task
  if (taskId) {
    console.log(`5. GET /api/v1/tasks/${taskId}`);
    res = await request('GET', `/${taskId}`);
    console.log(`   Status: ${res.status}, Body: ${JSON.stringify(res.body)}\n`);
  }

  // Test 6: PUT update task (toggle completed)
  if (taskId) {
    console.log(`6. PUT /api/v1/tasks/${taskId} (completar)`);
    res = await request('PUT', `/${taskId}`, { completed: true });
    console.log(`   Status: ${res.status}, Body: ${JSON.stringify(res.body)}\n`);
  }

  // Test 7: PUT update task (text)
  if (taskId) {
    console.log(`7. PUT /api/v1/tasks/${taskId} (editar texto)`);
    res = await request('PUT', `/${taskId}`, { text: 'Tarea editada' });
    console.log(`   Status: ${res.status}, Body: ${JSON.stringify(res.body)}\n`);
  }

  // Test 8: PUT update task (invalid text)
  if (taskId) {
    console.log(`8. PUT /api/v1/tasks/${taskId} (texto vacío)`);
    res = await request('PUT', `/${taskId}`, { text: '' });
    console.log(`   Status: ${res.status}, Body: ${JSON.stringify(res.body)}\n`);
  }

  // Test 9: PUT update task (not found)
  console.log('9. PUT /api/v1/tasks/not-exist (no encontrado)');
  res = await request('PUT', '/not-exist', { text: 'Test' });
  console.log(`   Status: ${res.status}, Body: ${JSON.stringify(res.body)}\n`);

  // Test 10: GET single task (not found)
  console.log('10. GET /api/v1/tasks/not-exist (no encontrado)');
  res = await request('GET', '/not-exist');
  console.log(`   Status: ${res.status}, Body: ${JSON.stringify(res.body)}\n`);

  // Test 11: DELETE task
  if (taskId) {
    console.log(`11. DELETE /api/v1/tasks/${taskId}`);
    res = await request('DELETE', `/${taskId}`);
    console.log(`   Status: ${res.status}\n`);
  }

  // Test 12: DELETE task (not found)
  console.log('12. DELETE /api/v1/tasks/not-exist (no encontrado)');
  res = await request('DELETE', '/not-exist');
  console.log(`   Status: ${res.status}, Body: ${JSON.stringify(res.body)}\n`);

  console.log('=== Tests completados ===');
  
  server.kill();
  process.exit(0);
}

startServer()
  .then(runTests)
  .catch(err => {
    console.error('Error:', err);
    if (server) server.kill();
    process.exit(1);
  });