# MP3 — Diagnose simulated CI failure RUN-1042

Baseline local tests pass, but simulated CI `RUN-1042` failed.

## Acceptance criteria

1. Use ci-doctor MCP `get_ci_run` to retrieve the failure evidence.
2. Extract the failure signature and use `lookup_known_fix` for approved remediation guidance.
3. Add a regression test proving the application honors `HPE_JOB_TIMEOUT_SEC`.
4. Make the smallest backward-compatible fix: prefer `HPE_JOB_TIMEOUT_SEC`, fall back to legacy `JOB_TIMEOUT_SECONDS`, then default to 30.
5. Do not hard-code the expected CI value.
6. Modify repository files through MCP `apply_repo_patch` for this exercise.
7. All pytest tests must pass before completion.
8. Do not merge automatically.

## Hook exercise requirements

- `PreToolUse`: generic repository writes and destructive/main-bypass commands are blocked.
- `PostToolUse`: each MCP `apply_repo_patch` triggers automatic pytest validation.
- `Stop`: the agent may not finish while pytest is red; repeated failure escalates instead of looping forever.
