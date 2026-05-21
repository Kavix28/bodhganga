const http = require('http');

const API_BASE = 'http://localhost:9090/api';

async function fetchJson(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        const status = response.status;
        let data;
        try {
            data = await response.json();
        } catch(e) {
            data = await response.text();
        }
        return { status, data };
    } catch(err) {
        return { status: 500, error: err.message };
    }
}

async function runTests() {
    console.log("Starting API Tests...\n");
    let jwtToken = '';

    // 1. Test Login (Admin)
    console.log("1. Testing Admin Login...");
    const loginRes = await fetchJson('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ emailOrPhone: 'admin@bodhganga.in', password: 'Admin@123' })
    });
    if (loginRes.status === 200 && loginRes.data.success) {
        console.log("   ✅ Login successful");
        jwtToken = loginRes.data.data.token;
    } else {
        console.log("   ❌ Login failed:", loginRes.status, loginRes.data);
    }

    // 2. Test Profile (Requires Auth)
    if (jwtToken) {
        console.log("\n2. Testing Protected Route (/api/profile)...");
        const profileRes = await fetchJson('/profile', {
            headers: { 'Authorization': `Bearer ${jwtToken}` }
        });
        if (profileRes.status === 200) {
            console.log("   ✅ Profile fetch successful");
        } else {
            console.log("   ❌ Profile fetch failed:", profileRes.status, profileRes.data);
        }
    }

    // 3. Test Public Courses
    console.log("\n3. Testing Public Courses (/api/courses/list)...");
    const coursesRes = await fetchJson('/courses/list');
    if (coursesRes.status === 200) {
        console.log(`   ✅ Courses fetch successful. Found ${coursesRes.data.data?.length || 0} courses.`);
    } else {
        console.log("   ❌ Courses fetch failed:", coursesRes.status, coursesRes.data);
    }

    // 4. Test Public Blog
    console.log("\n4. Testing Blog API (/api/blog/posts)...");
    const blogRes = await fetchJson('/blog/posts');
    if (blogRes.status === 200) {
        console.log(`   ✅ Blog fetch successful. Total elements: ${blogRes.data.pagination?.totalElements || 0}`);
    } else {
        console.log("   ❌ Blog fetch failed:", blogRes.status, blogRes.data);
    }
    
    console.log("\nTests completed.");
}

runTests();
