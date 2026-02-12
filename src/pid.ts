import { writeFile, unlink } from "fs/promises";
import { join } from "path";

const PID_FILE = join(process.cwd(), ".claude", "heartbeat", "daemon.pid");

export function getPidPath(): string {
  return PID_FILE;
}

export async function writePidFile(): Promise<void> {
  await writeFile(PID_FILE, String(process.pid) + "\n");
}

export async function cleanupPidFile(): Promise<void> {
  try {
    await unlink(PID_FILE);
  } catch {
    // already gone
  }
}
