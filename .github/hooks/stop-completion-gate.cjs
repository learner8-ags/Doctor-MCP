const { execSync } = require('node:child_process');
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  const event = JSON.parse(input || '{}');
  try {
    const output = execSync('python -m pytest -q', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    process.stdout.write(JSON.stringify({
      systemMessage: `Completion gate passed: pytest is green.\n${output}`
    }));
  } catch (error) {
    const evidence = (error.stdout && error.stdout.toString()) ||
                     (error.stderr && error.stderr.toString()) ||
                     error.message;

    if (event.stop_hook_active) {
      process.stdout.write(JSON.stringify({
        continue: false,
        stopReason: 'Tests remain red after the hook forced one continuation. Escalate rather than loop indefinitely.'
      }));
      return;
    }

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'Stop',
        decision: 'block',
        reason: `The CI Failure Doctor task is not complete because pytest is failing:\n\n${evidence}\n\nDiagnose the failure, use ci-doctor evidence/tools, patch through apply_repo_patch, and verify again.`
      }
    }));
  }
});
