---
description: Start the heartbeat daemon
---

Start the heartbeat daemon for this project. Follow these steps exactly:

1. **Ensure Bun is installed**: Run `which bun`. If it's not found:
   - Tell the user Bun is required and will be auto-installed.
   - Run:
     ```bash
     curl -fsSL https://bun.sh/install | bash
     ```
   - Then source the shell profile to make `bun` available in the current session:
     ```bash
     source ~/.bashrc 2>/dev/null || source ~/.zshrc 2>/dev/null || true
     ```
   - Verify `bun` is now available with `which bun`. If still not found, tell the user installation failed and to install manually from https://bun.sh, then exit.
   - Tell the user Bun was auto-installed successfully.

2. **Launch daemon**: The daemon auto-initializes config and has a built-in safeguard against duplicate instances. Start it in the background:
   ```bash
   mkdir -p .claude/heartbeat/logs && nohup bun run ${CLAUDE_PLUGIN_ROOT}/src/index.ts > .claude/heartbeat/logs/daemon.log 2>&1 & echo $!
   ```
   Use the description "🦞 Starting ClaudeClaw server" for this command.
   Wait 1 second, then check `cat .claude/heartbeat/logs/daemon.log`. If it contains "Aborted: daemon already running", tell the user and exit.

3. **Report**: Print the ASCII art below then show the PID and status info.

CRITICAL: Output the ASCII art block below EXACTLY as-is inside a markdown code block. Do NOT re-indent, re-align, or adjust ANY whitespace. Copy every character verbatim. Only replace `<PID>` and `<WORKING_DIR>` with actual values.

```
🦞         🦞
   ▐▛███▜▌
  ▝▜█████▛▘
    ▘▘ ▝▝
```

# HELLO, I AM YOUR CLAUDECLAW!
**Daemon is running! PID: \<PID> | Dir: \<WORKING_DIR>**

```
   1. Enable heartbeat?
   2. Configure Telegram?

/heartbeat:status  - check status
/heartbeat:stop    - stop daemon
```

After displaying the above, use the **AskUserQuestion** tool to ask both questions at once:

- Question 1: "Enable heartbeat?" (header: "Heartbeat", options: "Yes" / "No")
- Question 2: "Configure Telegram?" (header: "Telegram", options: "Yes" / "No")

Then, based on their answers:

- **If yes to heartbeat**: Use AskUserQuestion again with two questions:
  - "What prompt should the heartbeat run on each check?" (header: "Prompt", options: provide 2-3 example prompts relevant to the project)
  - "How often should it run in minutes?" (header: "Interval", options: "5", "15 (Recommended)", "30", "60")
  - Set `heartbeat.enabled` to `true`, `heartbeat.prompt` to their answer, `heartbeat.interval` to their answer.

- **If yes to Telegram**: Use AskUserQuestion again with two questions:
  - "What is your Telegram bot token?" (header: "Bot token", options: let user type via Other)
  - "What are the allowed Telegram user IDs?" (header: "User IDs", options: let user type via Other)
  - Set `telegram.token` and `telegram.allowedUserIds` (as array of numbers) accordingly.
  - Note: Telegram bot runs in-process with the daemon. All components (heartbeat, cron, telegram) share one Claude session.

Update `.claude/heartbeat/settings.json` with their answers. The daemon hot-reloads settings and jobs every 30 seconds — no restart needed.

---

## Reference: File Formats

### Settings — `.claude/heartbeat/settings.json`
```json
{
  "heartbeat": {
    "enabled": true,
    "interval": 15,
    "prompt": "Check git status and summarize recent changes."
  },
  "telegram": {
    "token": "123456:ABC-DEF...",
    "allowedUserIds": [123456789]
  }
}
```
- `heartbeat.enabled` — whether the recurring heartbeat runs
- `heartbeat.interval` — minutes between heartbeat runs
- `heartbeat.prompt` — the prompt sent to Claude on each heartbeat
- `telegram.token` — Telegram bot token from @BotFather
- `telegram.allowedUserIds` — array of numeric Telegram user IDs allowed to interact

### Jobs — `.claude/heartbeat/jobs/<name>.md`
Jobs are markdown files with cron schedule frontmatter and a prompt body:
```markdown
---
schedule: "0 9 * * *"
---
Your prompt here. Claude will run this at the scheduled time.
```
- Schedule uses standard cron syntax: `minute hour day-of-month month day-of-week`
- The filename (without `.md`) becomes the job name
- Jobs are loaded at daemon startup from `.claude/heartbeat/jobs/`
