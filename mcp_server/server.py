import json
from pathlib import Path
from mcp.server import MCPServer
mcp=MCPServer('ci-doctor'); DATA=Path(__file__).parent/'data'
RUNS=json.loads((DATA/'ci_runs.json').read_text()); FIXES=json.loads((DATA/'known_fixes.json').read_text())

from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[1]
ALLOWED_PREFIXES = ('app/', 'tests/', '.github/workflows/')

def safe_path(relative_path: str) -> Path:
    candidate = (REPO_ROOT / relative_path).resolve()
    if REPO_ROOT not in candidate.parents:
        raise ValueError('Path escapes repository')
    normalized = candidate.relative_to(REPO_ROOT).as_posix()
    if not any(normalized.startswith(p) for p in ALLOWED_PREFIXES):
        raise ValueError(f'Path {normalized} is outside the training allowlist')
    return candidate

def replace_repo_text(path: str, old_text: str, new_text: str) -> dict:
    target = safe_path(path)
    text = target.read_text(encoding='utf-8')
    count = text.count(old_text)
    if count != 1:
        return {'ok': False, 'reason': f'Expected one exact match, found {count}'}
    target.write_text(text.replace(old_text, new_text, 1), encoding='utf-8')
    return {'ok': True, 'path': path}

@mcp.tool()
def get_ci_run(run_id:str)->dict: return RUNS.get(run_id,{'error':'unknown run'})
@mcp.tool()
def lookup_known_fix(signature:str)->dict: return FIXES.get(signature,{'error':'unknown signature'})
@mcp.tool()
def apply_repo_patch(path:str,old_text:str,new_text:str)->dict: return replace_repo_text(path,old_text,new_text)
if __name__=='__main__': mcp.run()
