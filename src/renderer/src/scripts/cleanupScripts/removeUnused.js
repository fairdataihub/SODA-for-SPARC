const fs = require("fs");
const { truncate } = require("fs-extra");
const linesToRemove = JSON.parse(fs.readFileSync("lines-to-remove.json", "utf8"));

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

module.exports = function (fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Debugging: Log the file being processed
  console.log(`Processing file: ${fileInfo.path}`);

  // Find and remove the unused 'event' variables in reverse order
  linesToRemove.forEach(({ filePath, line, column, endLine }) => {
    // remove unused function declarations of type function name() {}
    // root
    //   .find(j.FunctionDeclaration)
    //   .filter((funcPath) => {
    //     const funcStart = funcPath?.node?.loc.start.line;
    //     if (funcStart) {
    //       return funcStart.line === line;
    //     }
    //   })
    //   .remove();
    // remove unused function expressions of type const name = () => {}
    // root
    //   .find(j.VariableDeclaration)
    //   .filter((varPath) => {
    //     const varStart = varPath?.node?.loc.start.line;
    //     // get column
    //     // const varColumn = varPath?.node?.loc.start.column;
    //     if (varStart && varStart === line && varPath.node.kind === "const" && column === 7) {
    //       return true;
    //     } else {
    //       return false;
    //     }
    //   })
    //   .remove();
    // remove all unused vars (should be identifiers)
    let hitAtLine = {};
    root
      .find(j.Identifier)
      .filter((path) => {
        if (!path || !path.node) {
          return false;
        }
        if (hits > 2) {
          // console.log("Failed hit at line ", line);
          return false;
        }
        const start = path.node.loc?.start;
        if (start && start.line === line && start.column === column - 1 && !hitAtLine[start.line]) {
          console.log(`Found 'event' at line ${start.line}, column ${start.column}`);
          hitAtLine[line] = true;
          hits = hits + 1;
          return true;
        }
        return false;
      })
      .remove();
    // Remove empty block statements
    // root.find(j.BlockStatement)
    //   .filter( path => {
    //     const start = path.node.loc.start;
    //     if (start.line === line) {
    //       hits = hits + 1;
    //       return path;
    //     }
    //   }).remove()
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
    // root.find(j.Identifier, { name: 'path' })
    // .forEach(path => {
    //   const start = path?.node?.loc?.start;
    //   if(start) {
    //     console.log(start)
    //     if(start.line === line && start.column === column - 1) {
    //       hits = hits + 1;
    //       j(path).replaceWith(j.memberExpression(j.identifier('window'), j.identifier('path')));
    //     }
    //   }
    // });
    // root.find(j.Identifier).forEach((path) => {
    //   const start = path?.node?.loc?.start;
    //   if (start && start.line === 17747) {
    //     console.log("in like flynn");
    //     if (start.line === line) {
    //       // console.log(start.line, start.column);
    //       hits = hits + 1;
    //       const parent = path.parent.node;
    //       if (
    //         // j.FunctionDeclaration.check(parent) ||
    //         // j.FunctionExpression.check(parent) ||
    //         parent.init.type === "ArrowFunctionExpression"
    //       ) {
    //         console.log("Inside the thing");
    //         // remove the whole function
    //         let functionStart = parent.init.loc.start;
    //         // let functionEnd = parent.init.loc.end;
    //       } else {
    //         // j(path).closest(path.parent.node).remove();
    //         // j(path).remove();
    //       }
    //     }
    //   }
    // });
  });

  // console.log(JSON.stringify(root, null, 2));

  console.log(`Total hits for path: ${hits}`);
  try {
    return root.toSource();
  } catch (e) {
    console.log(e);
  }
};
