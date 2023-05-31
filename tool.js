const glob = require("glob");
const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;
const path = require("path");

// 1. Discover paths
glob("./project/**/*.js", function (err, files) {
  files.forEach((file) => {
    // 2. Parse files
    const code = fs.readFileSync(file, "utf8");
    const ast = parser.parse(code, { sourceType: "module" });

    // 3. Replace paths
    replacePathsInAst(ast, file);

    // 4. Write files
    const newCode = generator(ast).code;
    fs.writeFileSync(file, newCode);
  });
});

function replacePathsInAst(ast, currentFile) {
  traverse(ast, {
    enter(path) {
      if (path.isImportDeclaration()) {
        const oldPath = path.node.source.value;
        const newPath = replacePath(oldPath, currentFile);
        if (newPath !== oldPath) {
          path.node.source.value = newPath;
        }
      }
    }
  });
}

function replacePath(oldPath, currentFile) {
  // Resolve the old path relative to the current file
  const absoluteOldPath = path.resolve(path.dirname(currentFile), oldPath);

  // Check if the file at the old path exists
  if (!fs.existsSync(absoluteOldPath + ".js")) {
    // If the file doesn't exist, replace the path
    return oldPath.replace("../", "./");
  } else {
    // If the file exists, don't replace the path
    return oldPath;
  }
}
