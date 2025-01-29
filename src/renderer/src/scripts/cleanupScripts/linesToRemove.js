const fs = require("fs");

// Read the ESLint output file
const eslintOutput = JSON.parse(fs.readFileSync("../formatted-eslint-output.json", "utf8"));

const messages = [
  "'event' is not defined.",
  "'path' is not defined.",
  "'event' is defined but never used.",
  "'path' is defined but never used.",
];

// Filter messages with the specific message
const unusedEventMessages = eslintOutput.filter((result) =>
  result.messages.some((message) => message.message === "'path' is not defined.")
);

// Extract the lines and columns to remove
const targetLine = unusedEventMessages.flatMap((result) =>
  result.messages
    .filter((message) => message.message === "'path' is not defined.")
    .map((message) => ({
      filePath: result.filePath,
      line: message.line,
      column: message.column,
      source: result.source,
    }))
);

// Write the lines to remove to a file
fs.writeFileSync("lines-to-remove.json", JSON.stringify(targetLine, null, 2));
