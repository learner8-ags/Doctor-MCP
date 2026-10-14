const fs = require('node:fs');
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  const event = JSON.parse(input || '{}');
  fs.appendFileSync('.github/hooks/tool-audit.log', JSON.stringify({
    timestamp: event.timestamp,
    tool_name: event.tool_name,
    tool_input: event.tool_input
  }) + '\n');
});
