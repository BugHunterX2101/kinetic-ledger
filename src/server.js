const app = require("./app");
const env = require("./config/env");

app.listen(env.PORT, () => {
  // Startup log is intentionally concise for quick local verification.
  console.log(`Kinetic Ledger API running on http://localhost:${env.PORT}`);
});
