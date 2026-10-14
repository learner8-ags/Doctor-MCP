let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  const event = JSON.parse(input || '{}');
  const tool = String(event.tool_name || '').toLowerCase();
  const args = event.tool_input || {};
  const serialized = JSON.stringify(args).toLowerCase();

  // Lab rule: repository writes must be performed through ci-doctor/apply_repo_patch.
  // Exact tool names vary by harness; use the audit/debug view if your local name differs.
  const looksLikeGenericEdit =
    (tool.includes('edit') || tool.includes('write') || tool.includes('replace')) &&
    !tool.includes('apply_repo_patch') &&
    !tool.includes('ci-doctor');

  const dangerousCommand = [
    'git reset --hard',
    'git clean -fd',
    'rm -rf',
    'git push --force',
    'git push origin main'
  ].some(x => serialized.includes(x));

  if (looksLikeGenericEdit) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: 'MP3 requires repository modifications through the ci-doctor MCP apply_repo_patch tool. Use that scoped tool instead of a generic editor.'
      }
    }));
    return;
  }

  if (dangerousCommand) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: 'Destructive or main-branch-bypass commands are blocked in this lab.'
      }
    }));
    return;
  }

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow'
    }
  }));
});
