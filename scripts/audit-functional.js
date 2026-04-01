async function run() {
  const base = "http://localhost:3000/api/v1";
  const results = [];

  const check = (name, pass, detail = "") => {
    results.push({ name, pass, detail });
  };

  async function request(path, options = {}) {
    const res = await fetch(`${base}${path}`, options);
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { res, body };
  }

  async function login(email, password) {
    const { res, body } = await request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return { status: res.status, body, token: body?.data?.token || null };
  }

  const health = await request("/health");
  check("Health endpoint", health.res.status === 200 && health.body?.success === true, `status=${health.res.status}`);

  const admin = await login("admin@kinetic.local", "Admin@123");
  const analyst = await login("analyst@kinetic.local", "Analyst@123");
  const viewer = await login("viewer@kinetic.local", "Viewer@123");

  check("Admin login", admin.status === 200 && !!admin.token, `status=${admin.status}`);
  check("Analyst login", analyst.status === 200 && !!analyst.token, `status=${analyst.status}`);
  check("Viewer login", viewer.status === 200 && !!viewer.token, `status=${viewer.status}`);

  const usersAdmin = await request("/users", { headers: { Authorization: `Bearer ${admin.token}` } });
  const usersAnalyst = await request("/users", { headers: { Authorization: `Bearer ${analyst.token}` } });
  check("GET /users admin-only", usersAdmin.res.status === 200 && usersAnalyst.res.status === 403, `admin=${usersAdmin.res.status}, analyst=${usersAnalyst.res.status}`);

  const meViewer = await request("/users/me", { headers: { Authorization: `Bearer ${viewer.token}` } });
  check("GET /users/me for all authenticated", meViewer.res.status === 200 && meViewer.body?.data?.email === "viewer@kinetic.local", `status=${meViewer.res.status}`);

  const viewerRecords = await request("/records?page=1&per_page=5", { headers: { Authorization: `Bearer ${viewer.token}` } });
  check("Viewer can list records", viewerRecords.res.status === 200 && Array.isArray(viewerRecords.body?.data), `status=${viewerRecords.res.status}`);

  const viewerFilter = await request("/records?type=income", { headers: { Authorization: `Bearer ${viewer.token}` } });
  check("Viewer cannot filter/search records", viewerFilter.res.status === 403, `status=${viewerFilter.res.status}`);

  const analystFilter = await request("/records?type=income&category=Liquid%20Equity&page=1&per_page=5", { headers: { Authorization: `Bearer ${analyst.token}` } });
  check("Analyst can filter records", analystFilter.res.status === 200, `status=${analystFilter.res.status}`);

  const summaryViewer = await request("/dashboard/summary", { headers: { Authorization: `Bearer ${viewer.token}` } });
  const byCategoryViewer = await request("/dashboard/by-category", { headers: { Authorization: `Bearer ${viewer.token}` } });
  const byCategoryAnalyst = await request("/dashboard/by-category", { headers: { Authorization: `Bearer ${analyst.token}` } });
  const trendsViewer = await request("/dashboard/trends", { headers: { Authorization: `Bearer ${viewer.token}` } });
  const trendsAnalyst = await request("/dashboard/trends", { headers: { Authorization: `Bearer ${analyst.token}` } });
  const recentViewer = await request("/dashboard/recent?limit=100", { headers: { Authorization: `Bearer ${viewer.token}` } });

  check("Dashboard summary viewer+", summaryViewer.res.status === 200, `status=${summaryViewer.res.status}`);
  check("Dashboard by-category analyst+", byCategoryViewer.res.status === 403 && byCategoryAnalyst.res.status === 200, `viewer=${byCategoryViewer.res.status}, analyst=${byCategoryAnalyst.res.status}`);
  check("Dashboard trends analyst+", trendsViewer.res.status === 403 && trendsAnalyst.res.status === 200, `viewer=${trendsViewer.res.status}, analyst=${trendsAnalyst.res.status}`);
  check("Dashboard recent viewer+ with max limit", recentViewer.res.status === 200 && (recentViewer.body?.data?.length || 0) <= 50, `status=${recentViewer.res.status}, count=${recentViewer.body?.data?.length || 0}`);

  const createUserEmail = `qa_${Date.now()}@kinetic.local`;
  const createUser = await request("/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${admin.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: createUserEmail, password: "TempPass@123", role: "viewer" }),
  });
  const createdUserId = createUser.body?.data?.id;

  check("Admin can create user", createUser.res.status === 201 && !!createdUserId, `status=${createUser.res.status}`);

  const duplicateUser = await request("/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${admin.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: createUserEmail, password: "TempPass@123", role: "viewer" }),
  });
  check("Duplicate email returns 409", duplicateUser.res.status === 409, `status=${duplicateUser.res.status}`);

  const deactivateUser = await request(`/users/${createdUserId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  check("Admin can deactivate user", deactivateUser.res.status === 200, `status=${deactivateUser.res.status}`);

  const inactiveLogin = await login(createUserEmail, "TempPass@123");
  check("Inactive user login returns 403", inactiveLogin.status === 403, `status=${inactiveLogin.status}`);

  const createRecord = await request("/records", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${admin.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: 1234.56,
      type: "income",
      category: "QA",
      date: new Date().toISOString().slice(0, 10),
      notes: "qa record",
      status: "verified",
    }),
  });

  const recordId = createRecord.body?.data?.id;
  check("Admin can create record", createRecord.res.status === 201 && !!recordId, `status=${createRecord.res.status}`);

  const updateRecord = await request(`/records/${recordId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${admin.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ notes: "qa record updated" }),
  });
  check("Admin can update record", updateRecord.res.status === 200, `status=${updateRecord.res.status}`);

  const deleteRecord = await request(`/records/${recordId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  check("Admin can soft-delete record", deleteRecord.res.status === 200, `status=${deleteRecord.res.status}`);

  const searchDeleted = await request(`/records?q=qa record updated`, {
    headers: { Authorization: `Bearer ${analyst.token}` },
  });
  const deletedStillVisible = (searchDeleted.body?.data || []).some((r) => r.id === recordId);
  check("Soft-deleted records excluded from listing", searchDeleted.res.status === 200 && !deletedStillVisible, `status=${searchDeleted.res.status}`);

  const adminSelfDemote = await request(`/users/${admin.body.data.user.id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${admin.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role: "viewer" }),
  });
  check("Admin cannot demote self", adminSelfDemote.res.status === 403, `status=${adminSelfDemote.res.status}`);

  const failed = results.filter((r) => !r.pass);
  for (const r of results) {
    const icon = r.pass ? "PASS" : "FAIL";
    console.log(`${icon} | ${r.name}${r.detail ? ` | ${r.detail}` : ""}`);
  }

  console.log(`\nSummary: ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(`FAIL | Unexpected error | ${error.message}`);
  process.exitCode = 1;
});
