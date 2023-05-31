
import fs from 'fs';
import parser from '@babel/parser';
import traverse from '@babel/traverse';
import generator from '@babel/generator';
import path from 'path';
import { glob } from 'glob';
import { mergedPaths } from './paths.js';

// 1. Discover paths


(async () => {
    const files = await glob("./project/**/*.js", { ignore: 'node_modules/**' });
    files.forEach((file) => {
        // 2. Parse files
        const code = fs.readFileSync(file, 'utf8');
        const ast = parser.parse(code, { sourceType: 'module' });

        // 3. Replace paths
        replacePathsInAst(ast, file);

        // 4. Write files
        const newCode = generator.default(ast).code;
        fs.writeFileSync(file, newCode);
    });
})()
function replacePathsInAst(ast, currentFile) {
    traverse.default(ast, {
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
    
    if (fs.existsSync(absoluteOldPath + '.js') || fs.existsSync(absoluteOldPath + '/index.js')) {
        // If the file exists, don't replace the path
        return oldPath;
    } else {
        // If the file doesn't exist, iterate over the pathMapping object
        for (let [newPath, mappedOldPath] of Object.entries(mergedPaths)) {
            // Extract the parent folder and file name from the old path and mapped old path
            const oldPathSegments = oldPath.split('/');
            const mappedOldPathSegments = mappedOldPath.replace(/\\/g, '/').split('/');
            const oldPathEnd = oldPathSegments.slice(-2).join('/');
            const mappedOldPathEnd = mappedOldPathSegments.slice(-2).join('/');

            // If the parent folder and file name of oldPath match those of mappedOldPath, replace it with the newPath
            if (oldPathEnd === mappedOldPathEnd) {
                return newPath;
            }
        }
    }

    // If no matching old path was found in the mapping object, return the old path
    return oldPath;
}