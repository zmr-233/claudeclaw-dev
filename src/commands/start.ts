import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { run } from "../runner";
import { writeState, type StateData } from "../statusline";
import { cronMatches, nextCronMatch } from "../cron";
import { loadJobs } from "../jobs";
import { writePidFile, cleanupPidFile } from "../pid";

const CLAUDE_DIR = join(process.cwd(), ".claude");
const HEARTBEAT_DIR = join(CLAUDE_DIR, "heartbeat");
const STATUSLINE_FILE = join(CLAUDE_DIR, "statusline.cjs");
const CLAUDE_SETTINGS_FILE = join(CLAUDE_DIR, "settings.json");

// --- Statusline setup/teardown ---

const STATUSLINE_SCRIPT = `#!/usr/bin/env node
const { readFileSync } = require("fs");
const { join } = require("path");

const STATE_FILE = join(__dirname, "heartbeat", "state.json");

function formatCountdown(ms) {
  if (ms <= 0) return "now!";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return h + "h " + m + "m";
  if (m > 0) return m + "m";
  return "<1m";
}

try {
  const state = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
  const now = Date.now();
  const parts = [];

  if (state.heartbeat) {
    parts.push("\\x1b[31m\\u2665\\x1b[0m " + formatCountdown(state.heartbeat.nextAt - now));
  }

  for (const job of state.jobs || []) {
    parts.push(job.name + " " + formatCountdown(job.nextAt - now));
  }

  process.stdout.write(parts.join(" \\x1b[2m|\\x1b[0m "));
} catch {
  process.stdout.write("\\x1b[31m\\u2665\\x1b[0m waiting...");
}
`;

async function setupStatusline() {
  await mkdir(CLAUDE_DIR, { recursive: true });
  await writeFile(STATUSLINE_FILE, STATUSLINE_SCRIPT);

  let settings: Record<string, unknown> = {};
  try {
    settings = await Bun.file(CLAUDE_SETTINGS_FILE).json();
  } catch {
    // file doesn't exist or isn't valid JSON
  }
  settings.statusLine = {
    type: "command",
    command: "node .claude/statusline.cjs",
  };
  await writeFile(CLAUDE_SETTINGS_FILE, JSON.stringify(settings, null, 2) + "\n");
}

async function teardownStatusline() {
  try {
    const settings = await Bun.file(CLAUDE_SETTINGS_FILE).json();
    delete settings.statusLine;
    await writeFile(CLAUDE_SETTINGS_FILE, JSON.stringify(settings, null, 2) + "\n");
  } catch {
    // file doesn't exist, nothing to clean up
  }

  try {
    await unlink(STATUSLINE_FILE);
  } catch {
    // already gone
  }
}

// --- Main ---

interface Settings {
  heartbeat: {
    enabled: boolean;
    interval: number;
    prompt: string;
  };
}

export async function start() {
  const settingsFile = Bun.file(join(HEARTBEAT_DIR, "settings.json"));
  const settings: Settings = await settingsFile.json();
  const jobs = await loadJobs();

  await setupStatusline();
  await writePidFile();

  async function shutdown() {
    await teardownStatusline();
    await cleanupPidFile();
    process.exit(0);
  }
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  console.log("Claude Heartbeat daemon started");
  console.log(`  PID: ${process.pid}`);
  console.log(`  Heartbeat: ${settings.heartbeat.enabled ? `every ${settings.heartbeat.interval}m` : "disabled"}`);
  console.log(`  Jobs loaded: ${jobs.length}`);
  jobs.forEach((j) => console.log(`    - ${j.name} [${j.schedule}]`));

  let nextHeartbeatAt = 0;
  if (settings.heartbeat.enabled) {
    const ms = settings.heartbeat.interval * 60_000;
    run("heartbeat", settings.heartbeat.prompt);
    nextHeartbeatAt = Date.now() + ms;
    setInterval(() => {
      run("heartbeat", settings.heartbeat.prompt);
      nextHeartbeatAt = Date.now() + ms;
    }, ms);
  }

  function updateState() {
    const now = new Date();
    const state: StateData = {
      heartbeat: settings.heartbeat.enabled
        ? { nextAt: nextHeartbeatAt }
        : undefined,
      jobs: jobs.map((job) => ({
        name: job.name,
        nextAt: nextCronMatch(job.schedule, now).getTime(),
      })),
    };
    writeState(state);
  }

  updateState();

  setInterval(() => {
    const now = new Date();
    for (const job of jobs) {
      if (cronMatches(job.schedule, now)) {
        run(job.name, job.prompt);
      }
    }
    updateState();
  }, 60_000);
}
