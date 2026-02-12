import { readdir } from "fs/promises";
import { join } from "path";

const JOBS_DIR = join(process.cwd(), ".claude", "heartbeat", "jobs");

export interface Job {
  name: string;
  schedule: string;
  prompt: string;
}

function parseJobFile(name: string, content: string): Job | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) {
    console.error(`Invalid job file format: ${name}`);
    return null;
  }

  const frontmatter = match[1];
  const prompt = match[2].trim();

  const scheduleLine = frontmatter
    .split("\n")
    .find((l) => l.startsWith("schedule:"));
  if (!scheduleLine) {
    console.error(`No schedule found in job: ${name}`);
    return null;
  }

  const schedule = scheduleLine
    .replace("schedule:", "")
    .trim()
    .replace(/^["']|["']$/g, "");

  return { name, schedule, prompt };
}

export async function loadJobs(): Promise<Job[]> {
  const jobs: Job[] = [];
  let files: string[];
  try {
    files = await readdir(JOBS_DIR);
  } catch {
    return jobs;
  }

  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const content = await Bun.file(join(JOBS_DIR, file)).text();
    const job = parseJobFile(file.replace(/\.md$/, ""), content);
    if (job) jobs.push(job);
  }
  return jobs;
}
