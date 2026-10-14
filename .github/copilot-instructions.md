# Copilot instructions — MP3 CI Failure Doctor

- Treat `work-items/MP3.md` as the source of truth.
- Retrieve CI evidence with `ci-doctor/get_ci_run` and approved remediation guidance with `ci-doctor/lookup_known_fix` before editing.
- For this exercise, repository writes must go through `ci-doctor/apply_repo_patch`; do not use the generic editor to bypass the scoped MCP write path.
- Add a regression test before the production fix.
- Never weaken or delete a valid test merely to obtain green.
- `PostToolUse` automatically runs pytest after the MCP patch; treat that verifier output as the observation for the next agent turn.
- `PreToolUse` and `Stop` hooks are policy/completion controls. Do not attempt to bypass them.
- Keep the compatibility fix minimal: prefer `HPE_JOB_TIMEOUT_SEC`, fall back to `JOB_TIMEOUT_SECONDS`, then default to 30.
- Stop before merge/deployment; a human reviews the PR and evidence.
