import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const value = (flag, fallback) =>
  args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback;
const withWorker = !args.includes("--web-only");
const maxWorkerRestarts = 5;
let workerRestarts = 0;
let stopping = false;

const children = [];

function start(name, command, commandArgs) {
  const child = spawn(command, commandArgs, {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env },
  });
  const prefix = `[${name}]`;
  child.stdout.on("data", (chunk) => {
    process.stdout.write(
      String(chunk)
        .split("\n")
        .filter((line) => line.length)
        .map((line) => prefix + " " + line)
        .join("\n") + "\n",
    );
  });
  child.stderr.on("data", (chunk) => process.stderr.write(prefix + " " + chunk));
  child.on("exit", (code) => {
    if (stopping) return;
    if (code === 0 || code === null) {
      process.stderr.write(`${prefix} stopped.\n`);
      return;
    }
    if (name === "worker" && workerRestarts < maxWorkerRestarts) {
      workerRestarts += 1;
      const delay = 2000 * workerRestarts;
      process.stderr.write(
        `${prefix} exited with code ${code}. Restarting in ${delay / 1000}s (${workerRestarts}/${maxWorkerRestarts}).\n`,
      );
      setTimeout(startWorker, delay);
      return;
    }
    process.stderr.write(
      name === "worker"
        ? `${prefix} exited with code ${code} and will not be restarted again. Uploaded documents stay queued until you run "npm run worker".\n`
        : `${prefix} exited with code ${code}.\n`,
    );
  });
  children.push(child);
  return child;
}

function shutdown(code = 0) {
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  process.exit(code);
}

for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => shutdown(0));

start(
  "web",
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    value("--host", "0.0.0.0"),
    "--port",
    value("--port", "3000"),
  ],
);

function startWorker() {
  start("worker", process.execPath, [
    "--env-file=.env.local",
    "--import",
    "tsx",
    "scripts/worker.ts",
  ]);
}

if (withWorker) startWorker();
else
  process.stderr.write(
    '[dev] --web-only: the processing worker is not running. Uploads stay queued until you run "npm run worker".\n',
  );
