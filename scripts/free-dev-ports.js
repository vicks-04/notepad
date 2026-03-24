const { execSync } = require("node:child_process");

const ports = [5000, 5173, 5174];

function listWindowsPids(port) {
  const output = execSync(
    `powershell -NoProfile -Command "Get-NetTCPConnection -State Listen -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`,
    {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8"
    }
  );

  return [...new Set(
    output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((pid) => pid && pid !== "0" && pid !== String(process.pid))
  )];
}

function listUnixPids(port) {
  const output = execSync(`lsof -ti tcp:${port}`, {
    stdio: ["ignore", "pipe", "ignore"],
    encoding: "utf8"
  });

  return [...new Set(
    output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((pid) => pid && pid !== String(process.pid))
  )];
}

function killPid(pid) {
  if (process.platform === "win32") {
    execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
    return;
  }

  execSync(`kill -9 ${pid}`, { stdio: "ignore" });
}

for (const port of ports) {
  try {
    const pids = process.platform === "win32" ? listWindowsPids(port) : listUnixPids(port);

    for (const pid of pids) {
      try {
        killPid(pid);
        console.log(`Freed port ${port} by stopping PID ${pid}`);
      } catch (error) {
        console.warn(`Unable to stop PID ${pid} on port ${port}: ${error.message}`);
      }
    }
  } catch (error) {
    // Nothing was listening on that port.
  }
}
