# pdsview — agent orientation

## Identity (workspace architecture)

**Scope:** standalone client-side browser for the PUBLIC contents of any atproto PDS (handle/DID/at:// → records).
**Not this repo:** authenticated PDS access (see the OAuth prior art in `CroftC/.claude/DECISIONS.md`).
Card + altitudes: `CroftC/.claude/ARCHITECTURE.md`. Concurrent-session norms:
`CroftC/.claude/COORDINATION.md` (multi-turn work in a worktree —
`git -C pdsview worktree add ../worktrees/<feature>/pdsview -b claude/<feature>` — never this
checkout; stage by path, never `git add -A`).
