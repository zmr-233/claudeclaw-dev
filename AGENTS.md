# Repository Guidelines

## Project Structure & Module Organization
- Core source is in `src/`.
- CLI entrypoint is `src/index.ts`; command handlers are in `src/commands/`.
- Runtime modules include scheduling (`src/cron.ts`), jobs (`src/jobs.ts`), sessions (`src/sessions.ts`), and web UI/server (`src/web.ts`).
- User-facing command docs live in `commands/*.md`.
- Prompt and agent instruction assets are in `prompts/` and `skills/`.
- Runtime state is written under `.claude/claudeclaw/` (PID, settings, logs) at execution time.

## Build, Test, and Development Commands
- `bun run start` — start the default daemon flow (`src/index.ts`).
- `bun run status` — show daemon status and heartbeat/job info.
- `bun run telegram` — start telegram-related command flow.
- `bun run dev:web` — watch mode for fast web UI development (auto-replaces existing daemon).
- `bunx tsc --noEmit` — TypeScript type-check pass (use for validation before larger changes).

## Coding Style & Naming Conventions
- Language: TypeScript (ES modules, Bun runtime).
- Use 2-space indentation and keep code straightforward; avoid unnecessary abstraction.
- File naming: short lowercase module names (e.g., `runner.ts`, `statusline.ts`).
- Prefer explicit names for commands/functions (`startWebUi`, `reloadSettings`).
- Keep frontend styles in `src/web.ts` cohesive with existing CSS variable patterns.

## Testing Guidelines
- There is no dedicated test suite yet.
- Minimum validation for changes:
  - Run `bunx tsc --noEmit`.
  - Run impacted commands locally (for UI work: `bun run dev:web`).
- For behavior changes, include a brief manual verification note in the PR description.

## Commit & Pull Request Guidelines
- Follow current history style: short, imperative commit messages (e.g., `add dev:web watch script`, `sync heartbeat toggle with daemon state immediately`).
- Keep commits scoped to one logical change.
- PRs should include:
  - What changed and why.
  - Commands run for verification.
  - UI screenshot/GIF for `src/web.ts` changes.
  - Linked issue/task when applicable.

## Security & Configuration Tips
- Never commit secrets (tokens, private IDs, local `.claude` runtime data).
- Validate settings changes carefully; web settings APIs write to `.claude/claudeclaw/settings.json`.
