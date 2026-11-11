# Repository deep clean and environment reset

Run from the repository root. This document is both the runbook and the record
of what the cleanup is allowed to touch.

## Safety rules

- Never run `git clean -fdx`. This repository has many untracked source files
  (`ANTI_SLOP.md`, landing components, migrations, select primitives, tests).
- Never kill OpenCode itself, postgres, macOS services, or the user's normal
  Chrome, Discord, or VS Code windows.
- Only kill the project dev server tree and, if present, headless test
  browsers or test workers spawned by this repository.
- Do not delete `.env`, `.git`, `node_modules`, `ui-refer/`, `public/`,
  `video/src/`, `src/generated/prisma`, `next-env.d.ts`, or `prisma/migrations`.
- Do not delete `~/.local/share/opencode`. It contains the live OpenCode
  database, auth, logs, and shell session state, not a disposable cache.
- Do not delete `~/.cache/opencode/bin/rg` while this agent session is running.
  It is the only ripgrep binary used by the agent tooling.

## 1. Process termination

Find the listener on the project port, walk up to the `bun run dev` parent, and
stop the tree with `TERM`, then `KILL` if needed. Always filter with
`-sTCP:LISTEN`. A bare `lsof -ti tcp:3000` also matches browser client
connections and can kill a normal Chrome renderer.

```bash
listener="$(lsof -nP -iTCP:3000 -sTCP:LISTEN -t | head -1)"
pids=""
if [ -n "$listener" ]; then
  pids="$listener"
  p="$listener"
  while [ "$p" != "1" ] && [ -n "$p" ]; do
    ppid="$(ps -p "$p" -o ppid= | tr -d ' ')"
    [ -z "$ppid" ] && break
    cmd="$(ps -p "$ppid" -o command=)"
    case "$cmd" in
      *"next dev"*|*"bun run dev"*) pids="$pids $ppid"; p="$ppid" ;;
      *) break ;;
    esac
  done
fi

if [ -n "$pids" ]; then
  echo "Stopping dev server tree: $pids"
  kill -TERM $pids 2>/dev/null || true
  sleep 2
  for p in $pids; do
    if kill -0 "$p" 2>/dev/null; then
      echo "KILL $p"
      kill -KILL "$p" 2>/dev/null || true
    fi
  done
fi
```

Check for test runners, headless browsers, and zombies. Normal Chrome, Discord,
and VS Code are excluded.

```bash
ps -axo pid,ppid,stat,command \
  | grep -Ei 'playwright|headless_shell|chromium.*--headless|firefox.*--headless|webkit.*--headless|vitest|jest|node .*test' \
  | grep -v grep || true

ps -axo stat,pid,ppid,command | awk '$1 ~ /^Z/ {print}' || true
```

Verify the project port is free. Other listeners belong to macOS, postgres,
Discord, VS Code, or OpenCode and are not part of this cleanup.

```bash
lsof -nP -iTCP:3000-3010 -sTCP:LISTEN || true
```

## 2. Artifact and report purge

```bash
rm -rf .next coverage playwright-report test-results blob-report tmp .turbo dist build out
rm -f tsconfig.tsbuildinfo .eslintcache
rm -rf node_modules/.cache node_modules/.vite
```

Remove the empty OpenCode temp browser profiles. Keep the parent temp directory.

```bash
rm -rf "${TMPDIR%/}/opencode"/*
```

## 3. Junk and trace clearance

```bash
rm -rf video/stills

find . -name '.DS_Store' \
  -not -path './node_modules/*' \
  -not -path './.git/*' \
  -delete

find . -type f \
  \( -name '*.log' -o -name '*.zip' -o -name '*.trace' -o -name '*.har' \) \
  -not -path './node_modules/*' \
  -not -path './.git/*' \
  -delete
```

macOS Finder may recreate `.DS_Store` in the repo root immediately after it is
deleted. It is gitignored. Do not disable Finder or treat that as a failed
cleanup.

## 4. Verification

```bash
lsof -nP -iTCP:3000-3010 -sTCP:LISTEN || true

ps -axo pid,ppid,stat,command \
  | grep -Ei 'next dev|next-server|playwright|vitest|jest' \
  | grep -v grep || true

find . -maxdepth 2 \
  \( -name '.next' -o -name 'coverage' -o -name 'playwright-report' \
     -o -name 'test-results' -o -name 'blob-report' -o -name 'tmp' \
     -o -name '*.tsbuildinfo' \) -print

find . -type f \
  \( -name '*.log' -o -name '*.zip' -o -name '*.trace' -o -name '*.har' \) \
  -not -path './node_modules/*' \
  -not -path './.git/*' -print

git status --short
```

Report every PID that survives `TERM` and `KILL`. Report every artifact that
still exists after the purge.

## Report template

```text
Process termination
- dev server PIDs stopped:
- headless browser PIDs stopped:
- test worker PIDs stopped:
- failed to stop:
- port 3000-3010 listeners after cleanup:

Artifacts
- .next:
- coverage / playwright-report / test-results / blob-report:
- tsconfig.tsbuildinfo / .eslintcache:
- node_modules caches:
- video/stills:
- .DS_Store:
- .log / .zip / .trace / .har:

Preserved on purpose
- node_modules, .env, .git, ui-refer, public, video/src
- src/generated/prisma, next-env.d.ts, prisma/migrations
- ~/.local/share/opencode (live database/auth/session)
- ~/.cache/opencode/bin/rg (active agent grep binary)
```
