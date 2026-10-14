const { execSync } = require('node:child_process');
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  const event = JSON.parse(input || '{}');
  const tool = String(event.tool_name || '').toLowerCase();

  // Only validate immediately after the scoped MCP write tool. Tool names differ
  // slightly by harness, so match on the stable MCP tool function name.
  if (!tool.includes('apply_repo_patch')) {
    process.stdout.write('{}');
    return;
  }

  try {
    const output = execSync('python -m pytest -q', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: `Automatic post-patch validation passed.\n${output}`
      }
    }));
  } catch (error) {
    const evidence = (error.stdout && error.stdout.toString()) ||
                     (error.stderr && error.stderr.toString()) ||
                     error.message;
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: 'Automatic validation failed after the MCP repository patch.',
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: `pytest failed immediately after apply_repo_patch:\n\n${evidence}\n\nUse this evidence to diagnose the next change. Continue using the MCP patch tool for repository writes.`
      }
    }));
  }
});
