const fs = require('fs');
const linesToRemove = JSON.parse(fs.readFileSync('lines-to-remove.json', 'utf8'));

// Sort linesToRemove in reverse order based on line and column
linesToRemove.sort((a, b) => {
  if (a.filePath !== b.filePath) {
    return a.filePath.localeCompare(b.filePath);
  }
  if (a.line !== b.line) {
    return b.line - a.line;
  }
  return b.column - a.column;
});

let hits = 0;


module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Debugging: Log the file being processed
  console.log(`Processing file: ${fileInfo.path}`);

  // Find and remove the unused 'event' variables in reverse order
  linesToRemove.forEach(({ filePath, line, column }) => {
    // Debugging: Log the file path, line, and column being checked
    // console.log(`Checking: ${filePath} at line ${line}, column ${column}`);


    // remove identifiers matching the line and column from the esLint list of items to remove
    // root.find(j.Identifier, { name: 'event' })
    //   .filter(path => {
    //     const start = path.node.loc.start;
    //     // Debugging: Log the position of the identifier
    //     if (start.line === line) {console.log(`Found 'event' at line ${start.line}, column ${start.column}`)}
    //     return start.line === line && start.column === column - 1;
    //   })
    //   .remove();

    // transform identifiers matching the line and column from the esLint list of items to transform
    root.find(j.Identifier, { name: 'path' })
    .forEach(path => {
      const start = path?.node?.loc?.start;
      if(start) {
        console.log(start)
        if(start.line === line && start.column === column - 1) {
          hits = hits + 1;
          j(path).replaceWith(j.memberExpression(j.identifier('window'), j.identifier('path')));
        }
      }
      
    });
  });

  console.log(`Total hits for path: ${hits}`);
  return root.toSource();
};