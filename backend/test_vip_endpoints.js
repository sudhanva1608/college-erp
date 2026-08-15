const http = require('http');

const API_BASE = 'http://localhost:5001/api';

// Helper to make HTTP requests
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const clientOptions = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (options.body) {
      clientOptions.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(clientOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let body = data;
        if (res.headers['content-type'] && res.headers['content-type'].includes('application/json')) {
          try {
            body = JSON.parse(data);
          } catch (e) {
            // Ignored
          }
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING VIP ENDPOINTS END-TO-END TESTS ---');

  // 1. Login
  console.log('\n1. Logging in as DEAN123...');
  let loginRes;
  try {
    loginRes = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: { id: 'DEAN123', password: 'dean123', role: 'supervisor' }
    });
  } catch (err) {
    console.error('Failed to connect to backend server. Make sure it is running on port 5001.');
    console.error(err);
    process.exit(1);
  }

  if (loginRes.statusCode !== 200) {
    console.error('❌ Login failed:', loginRes.body);
    process.exit(1);
  }

  const token = loginRes.body.token;
  console.log('✅ Login successful! Token retrieved.');

  const vipHeaders = {
    'Authorization': `Bearer ${token}`
  };

  // Helper for authed requests
  const authedGet = (path) => request(`${API_BASE}${path}`, { headers: vipHeaders });

  // 2. Get all students
  console.log('\n2. Testing GET /api/vip/students...');
  const studentsRes = await authedGet('/vip/students');
  if (studentsRes.statusCode === 200 && studentsRes.body.students) {
    console.log(`✅ Success! Found ${studentsRes.body.students.length} students (Total: ${studentsRes.body.pagination.total})`);
    console.log('   Sample student:', studentsRes.body.students[0]);
  } else {
    console.error(`❌ Failed: Status ${studentsRes.statusCode}`, studentsRes.body);
  }

  // 3. Get student by ID
  console.log('\n3. Testing GET /api/vip/students/CS21B042...');
  const studentByIdRes = await authedGet('/vip/students/CS21B042');
  if (studentByIdRes.statusCode === 200) {
    console.log(`✅ Success! Student retrieved:`, studentByIdRes.body.name, `(${studentByIdRes.body.id})`);
    console.log(`   Department: ${studentByIdRes.body.department}, Marks count: ${studentByIdRes.body.marks.length}`);
  } else {
    console.error(`❌ Failed: Status ${studentByIdRes.statusCode}`, studentByIdRes.body);
  }

  // 4. Update student
  console.log('\n4. Testing PUT /api/vip/students/CS21B042...');
  const updateRes = await request(`${API_BASE}/vip/students/CS21B042`, {
    method: 'PUT',
    headers: vipHeaders,
    body: { name: 'Prajwal Navada GP', department: 'Computer Science' }
  });
  if (updateRes.statusCode === 200) {
    console.log(`✅ Success! Student updated:`, updateRes.body.student);
  } else {
    console.error(`❌ Failed: Status ${updateRes.statusCode}`, updateRes.body);
  }

  // 5. Test Leaderboard Department
  console.log('\n5. Testing GET /api/vip/leaderboard/dept?type=cie1...');
  const lbDeptRes = await authedGet('/vip/leaderboard/dept?type=cie1');
  if (lbDeptRes.statusCode === 200) {
    console.log(`✅ Success! Department Leaderboard retrieved:`, Object.keys(lbDeptRes.body));
    for (const [dept, list] of Object.entries(lbDeptRes.body)) {
      console.log(`   - ${dept}: Top student: ${list[0]?.name || 'N/A'} (Score: ${list[0]?.totalScore || 0})`);
    }
  } else {
    console.error(`❌ Failed: Status ${lbDeptRes.statusCode}`, lbDeptRes.body);
  }

  // 6. Test Leaderboard Class
  console.log('\n6. Testing GET /api/vip/leaderboard/class?type=cie2...');
  const lbClassRes = await authedGet('/vip/leaderboard/class?type=cie2');
  if (lbClassRes.statusCode === 200) {
    console.log(`✅ Success! Class Leaderboard retrieved:`, Object.keys(lbClassRes.body));
  } else {
    console.error(`❌ Failed: Status ${lbClassRes.statusCode}`, lbClassRes.body);
  }

  // 7. Test Leaderboard Batch
  console.log('\n7. Testing GET /api/vip/leaderboard/batch?type=total...');
  const lbBatchRes = await authedGet('/vip/leaderboard/batch?type=total');
  if (lbBatchRes.statusCode === 200) {
    console.log(`✅ Success! Batch Leaderboard retrieved.`);
    const overallList = lbBatchRes.body.Overall || [];
    console.log(`   Top 3 in Batch:`);
    overallList.slice(0, 3).forEach((s, idx) => {
      console.log(`   ${idx + 1}. ${s.name} (${s.id}) - Score: ${s.totalScore}`);
    });
  } else {
    console.error(`❌ Failed: Status ${lbBatchRes.statusCode}`, lbBatchRes.body);
  }

  // 8. API Stats
  console.log('\n8. Testing GET /api/vip/api-stats...');
  const apiStatsRes = await authedGet('/vip/api-stats');
  if (apiStatsRes.statusCode === 200) {
    console.log(`✅ Success! API Usage Stats retrieved:`, apiStatsRes.body);
  } else {
    console.error(`❌ Failed: Status ${apiStatsRes.statusCode}`, apiStatsRes.body);
  }

  // 9. Active Sessions
  console.log('\n9. Testing GET /api/vip/sessions...');
  const sessionsRes = await authedGet('/vip/sessions');
  if (sessionsRes.statusCode === 200) {
    console.log(`✅ Success! Active sessions retrieved:`, sessionsRes.body.count, 'active sessions.');
    if (sessionsRes.body.sessions && sessionsRes.body.sessions.length > 0) {
      console.log('   Sample session ID:', sessionsRes.body.sessions[0].sessionId, 'User:', sessionsRes.body.sessions[0].userName);
    }
  } else {
    console.error(`❌ Failed: Status ${sessionsRes.statusCode}`, sessionsRes.body);
  }

  // 10. Download reports (as JSON format for ease of testing)
  console.log('\n10. Testing student report download (JSON)...');
  const studentReportRes = await authedGet('/vip/students/report?format=json');
  if (studentReportRes.statusCode === 200) {
    console.log(`✅ Success! Student report downloaded:`, studentReportRes.body.length, 'students in report.');
  } else {
    console.error(`❌ Failed: Status ${studentReportRes.statusCode}`, studentReportRes.body);
  }

  console.log('\n11. Testing faculty marks report download (JSON)...');
  const marksReportRes = await authedGet('/vip/faculty-marks-report?format=json');
  if (marksReportRes.statusCode === 200) {
    console.log(`✅ Success! Faculty marks report downloaded:`, marksReportRes.body.length, 'records in report.');
  } else {
    console.error(`❌ Failed: Status ${marksReportRes.statusCode}`, marksReportRes.body);
  }

  console.log('\n--- TESTS COMPLETED ---');
}

runTests();
