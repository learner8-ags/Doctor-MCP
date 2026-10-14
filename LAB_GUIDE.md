## Common first 15 minutes — start with a fresh GitHub repo

1. Go to **https://github.com/new** and create a new **private** repository. Do not initialize it with a README.
2. Unzip this starter locally and push it:

```bash
git init
git add .
git commit -m "lab: starter application"
git branch -M main
git remote add origin <YOUR-NEW-REPO-URL>
git push -u origin main
```

3. Open the folder in VS Code, sign in to GitHub Copilot, and **Trust the workspace**.
4. Use the **Local** agent harness/session target. This lab uses Local `PreToolUse`, `PostToolUse`, and `Stop` hooks.
5. Create the Python environment:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

6. Run `pytest -q`; the starter must be green locally.
7. Read `work-items/MP3.md`.

# Mini-project 3 — CI Failure Doctor via MCP + Hooks

**Spotlight:** custom MCP CI evidence/fix tools, MCP-driven repository edits, deterministic hook guardrails, verifier feedback loops.

## Architecture you should observe

`Prompt → Copilot Agent → ci-doctor MCP evidence → ci-doctor apply_repo_patch → PostToolUse pytest → failure/success feedback → next agent action → Stop completion gate`

Hooks are intentionally used for things that should not rely only on the model remembering instructions.

## Phase 1 — configure ci-doctor MCP (25 min)

Register the included MCP server (`mcp_server/server.py`) with VS Code, start it, and verify its tools are visible. These steps are for **Windows** with VS Code and GitHub Copilot.

### Step 1 — Confirm the prerequisites

1. Open the repo folder in VS Code (**File → Open Folder…**) and **Trust** the workspace.
2. Open a terminal in VS Code (**Terminal → New Terminal**, PowerShell) and confirm the virtual environment exists and has the MCP package:

```powershell
.venv\Scripts\python.exe -c "import mcp; print('mcp OK')"
```

If you get `No such file` or `No module named mcp`, redo the environment setup from the first 15 minutes:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Step 2 — Copy the absolute path of the repo

You need the full path of the repo root (the folder containing `mcp_server`, `app`, `.venv`).

- **From VS Code:** in the Explorer, right-click the top-level repo folder → **Copy Path** (or press `Shift+Alt+C` with the folder selected).
- **From the terminal:** run the following. It prints the path and copies it to the clipboard.

```powershell
(Get-Location).Path | Tee-Object -Variable repo | Set-Clipboard; $repo
```

Example result: `C:\Users\vijay\labs\ci-doctor-lab`

> **Backslashes:** JSON needs every backslash doubled (`\\`). Alternatively, use forward slashes (`C:/Users/vijay/labs/ci-doctor-lab`), which Windows and VS Code also accept. Pick one style and use it throughout.

If the path contains spaces (for example a OneDrive folder such as `Sept 2026 git`), that is fine in `mcp.json` because `command` and each `args` entry are separate JSON strings. Do not add extra quotes inside them.

### Step 3 — Create or open `mcp.json`

Choose **one** of these locations.

**Option A — Workspace config (recommended for this lab).** It applies only to this repo and can be committed.

1. Create the folder `.vscode` in the repo root if it does not exist. (The starter already has `.vscode/settings.json`.)
2. Create the file `.vscode/mcp.json`.

   Or use the Command Palette: `Ctrl+Shift+P` → **MCP: Add Server…** → **Command (stdio)**, which writes the file for you. Then edit it as in Step 4.

**Option B — User config.** It applies to every VS Code workspace on your machine.

1. `Ctrl+Shift+P` → **MCP: Open User Configuration**. This opens `%APPDATA%\Code\User\mcp.json`.

### Step 4 — Paste the server definition

Paste the following into `mcp.json`, replacing `<ABSOLUTE_PATH_TO_REPO>` with the path you copied in Step 2. (The same template is in `lab-assets/mcp.windows.json`.)

```json
{
  "servers": {
    "ci-doctor": {
      "type": "stdio",
      "command": "C:\\Users\\vijay\\labs\\ci-doctor-lab\\.venv\\Scripts\\python.exe",
      "args": [
        "C:\\Users\\vijay\\labs\\ci-doctor-lab\\mcp_server\\server.py"
      ]
    }
  }
}
```

Checklist:

- The top-level key is `servers` (not `mcpServers`, which is the format used by other tools).
- `command` points to the **venv's** `python.exe`, not the system Python. Otherwise the `mcp` package will not be found.
- `args` points to `mcp_server\server.py` under the same repo root.
- Both paths exist. Check them with:

```powershell
Test-Path "C:\Users\vijay\labs\ci-doctor-lab\.venv\Scripts\python.exe"
Test-Path "C:\Users\vijay\labs\ci-doctor-lab\mcp_server\server.py"
```

Both commands must print `True`.

> If you use a workspace `mcp.json`, you may instead use `${workspaceFolder}` and avoid hard-coded paths:
> `"command": "${workspaceFolder}\\.venv\\Scripts\\python.exe"` and `"args": ["${workspaceFolder}\\mcp_server\\server.py"]`.

Save the file (`Ctrl+S`).

### Step 5 — Start the server and trust it

1. In `mcp.json`, a **Start** code lens appears above `"ci-doctor"`. Click it. (Or `Ctrl+Shift+P` → **MCP: List Servers** → `ci-doctor` → **Start Server**.)
2. VS Code asks whether you trust this MCP server. Review the command and click **Trust**.
3. The code lens should change to **Running** with a tool count (for example "3 tools").

### Step 6 — Verify the tools are visible

1. Open Copilot Chat (`Ctrl+Alt+I`) and switch the mode dropdown to **Agent**.
2. Ask the question:
 What tools are available in ci-doctor mcp server?

It should print:
   - `get_ci_run`
   - `lookup_known_fix`
   - `apply_repo_patch`

3. If something is wrong, open the log: `Ctrl+Shift+P` → **MCP: List Servers** → `ci-doctor` → **Show Output**.

### Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| Server shows **Error** / exits immediately | The `command` path is wrong, or the venv is missing. Re-run the `Test-Path` checks and `pip install -r requirements.txt`. |
| `ModuleNotFoundError: No module named 'mcp'` in the output | `command` points to the system Python. Point it at `.venv\Scripts\python.exe`. |
| `Invalid JSON` or red squiggles | Single backslashes in paths. Double them (`\\`) or use `/`. |
| Code lens or server does not appear | The file is not named exactly `mcp.json`, or it is not inside `.vscode/`. |
| Server runs but tools are not in the chat tool list | The chat is not in **Agent** mode, or the tools are unticked in **Configure Tools**. |
| Edits to `mcp.json` have no effect | Use **MCP: List Servers** → `ci-doctor` → **Restart Server**. |

Ask:

> Investigate RUN-1042. Do not edit yet. Retrieve the CI evidence and then look up the approved fix guidance for the detected signature.

Require actual MCP tool calls rather than copying data manually.

## Phase 2 — enable and inspect hooks (20 min)

The starter includes `.vscode/settings.json` with `chat.useHooks=true` and workspace hook files under `.github/hooks/`.

Inspect:

- `PreToolUse` — blocks generic repository edit/write tools for this exercise and blocks destructive/main-bypass commands. The goal is to make `ci-doctor/apply_repo_patch` the allowed write path.
- `PostToolUse` — whenever `apply_repo_patch` succeeds, automatically runs `pytest` and feeds the result back to the agent.
- `Stop` — refuses task completion while pytest is red and permits only one forced continuation before escalation.

The project also includes an optional audit hook (`audit-hooks.json`) that logs real Local tool names/inputs. If your VS Code build names a generic edit tool differently, use the audit log/debug view and adjust the matching rule rather than assuming a name.

## Phase 3 — plan and regression test (25 min)

Produce the smallest backward-compatible plan. The intended behavior is:

1. Read `HPE_JOB_TIMEOUT_SEC` first.
2. Fall back to legacy `JOB_TIMEOUT_SECONDS`.
3. Default to 30 when neither is set.

Create a regression test through the MCP `apply_repo_patch` tool. Do not use the generic editor for repository writes in this exercise.

Immediately after the MCP patch, observe the **PostToolUse** hook run pytest. At this point the new regression test should expose the missing behavior.

## Phase 4 — MCP-driven implementation loop (45 min)

Use the failing test evidence plus `lookup_known_fix` guidance. Apply the smallest production fix through `apply_repo_patch`.

Observe:

1. MCP tool writes the file.
2. `PostToolUse` automatically runs pytest.
3. Failure evidence, if any, returns into Copilot's context.
4. Copilot diagnoses and chooses another MCP patch if needed.

This is the key loop-engineering moment: **the verifier is not merely a prompt instruction; the hook actually runs it at the lifecycle event.**

## Phase 5 — test the PreToolUse policy (15 min)

Ask Copilot to make one harmless repository edit using its normal editor rather than MCP. The hook should deny the generic edit route and tell the model to use `apply_repo_patch`.

Then try a clearly unsafe command only as a demonstration request, such as asking whether it can run `git reset --hard`; do not actually need the command to execute. The hook should deny it.

Discuss the limitation: this is a training guardrail implemented at the VS Code harness layer. Real production authorization must also live in CI/server-side controls.

## Phase 6 — demonstrate the Stop completion gate (15 min)

If tests are red, ask the agent to finish. The `Stop` hook should block completion and return the evidence. Once tests are green, the completion gate permits the task to finish.

## Phase 7 — PR evidence and debrief (30 min)

Inspect `git diff`, commit, push, and create a PR summary containing:

- CI evidence retrieved through MCP
- approved remediation guidance retrieved through MCP
- regression test added
- repository writes performed through the scoped MCP tool
- automatic hook validation evidence
- final test status

Be ready to explain:

1. **MCP tool** = capability/action supplied to the agent.
2. **PreToolUse hook** = deterministic policy before an action.
3. **PostToolUse hook** = deterministic verifier after the MCP write.
4. **Stop hook** = deterministic completion condition.
5. Why these controls are stronger than writing “please remember to run tests” in a prompt.
