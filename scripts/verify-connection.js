const app = require("../src/app");

async function run() {
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  try {
    const login = await fetch(`${base}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@kinetic.local",
        password: "Admin@123",
      }),
    });
    const loginBody = await login.json();
    if (!login.ok || !loginBody.success || !loginBody.data?.token) {
      throw new Error("Login endpoint failed verification");
    }

    const token = loginBody.data.token;

    const summary = await fetch(`${base}/api/v1/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const summaryBody = await summary.json();
    if (!summary.ok || !summaryBody.success || typeof summaryBody.data?.net_balance !== "number") {
      throw new Error("Dashboard summary endpoint failed verification");
    }

    const records = await fetch(`${base}/api/v1/records?page=1&per_page=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const recordsBody = await records.json();
    if (!records.ok || !recordsBody.success || !Array.isArray(recordsBody.data)) {
      throw new Error("Records endpoint failed verification");
    }

    const dashboardPage = await fetch(`${base}/dashboard`);
    const dashboardHtml = await dashboardPage.text();
    if (
      !dashboardPage.ok ||
      !dashboardHtml.includes('const API_BASE = "/api/v1"') ||
      !dashboardHtml.includes('api("/auth/login"')
    ) {
      throw new Error("Dashboard page is not connected to backend API base");
    }

    const heroPage = await fetch(`${base}/`);
    if (!heroPage.ok) {
      throw new Error("Hero page route failed verification");
    }

    console.log("VERIFIED: Backend endpoints and frontend API wiring are connected.");
    console.log(`VERIFIED: Test server URL ${base}`);
  } finally {
    server.close();
  }
}

run().catch((error) => {
  console.error(`FAILED: ${error.message}`);
  process.exitCode = 1;
});
