# Ralph Autonomous Loop Instructions

## Context
You are working on the Financial Tracker app expansion. Read `@context.md` for system details, `@active.md` for pending tasks, and `@completed.md` for what's done.

## Loop Protocol
1. Read `status.json` to check current state
2. Read `@active.md` to find the next unchecked task
3. Execute the task
4. Mark the task as complete in `@active.md`
5. Move completed tasks to `@completed.md` periodically
6. Update `progress.json` with counts
7. Log actions to `logs/` directory

## Rules
- Work on ONE task at a time
- Test after each change
- If blocked, note the blocker and skip to next task
- Never modify migration files that have been run
- Always read files before editing them
