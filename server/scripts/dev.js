const { spawn } = require("child_process");
const path = require("path");

const PORT = process.env.PORT || "5001";

console.log("=================================================");
console.log("🚀 Starting RideX Full-Stack Platform");
console.log(`   - Backend REST & WebSocket: http://localhost:${PORT}`);
console.log("   - React Frontend Web App:   http://localhost:3000");
console.log("=================================================");

const rootDir = path.resolve(__dirname, "..", "..");
const isWin = process.platform === "win32";

const backend = spawn("node", [path.join("server", "index.js")], {
  cwd: rootDir,
  stdio: "inherit",
  shell: isWin,
  env: { ...process.env, PORT }
});

const npmCmd = isWin ? "npm.cmd" : "npm";
const frontend = spawn(npmCmd, ["run", "client"], {
  cwd: rootDir,
  stdio: "inherit",
  shell: isWin,
  env: { ...process.env, PORT: "3000", BROWSER: "none" }
});

function cleanup() {
  console.log("\nShutting down RideX services...");
  try { backend.kill(); } catch (e) {}
  try { frontend.kill(); } catch (e) {}
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
