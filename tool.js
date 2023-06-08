#!/usr/bin/env node

import fs from 'fs';
import parser from '@babel/parser';
import traverse from '@babel/traverse';
import generator from '@babel/generator';
import path from 'path';
import { glob } from 'glob';
import { absoluteImports, mergedPaths } from './paths.js';
import chalk from 'chalk';

let folderName;
let outputFileName;
let shouldChangeFiles = false;

process.argv.slice(2).forEach((value, index, array) => {
    if (value === '--folder') {
        folderName = array[index + 1];
    } else if (value === 'change') {
        shouldChangeFiles = true;
    }
});

if (!folderName || !outputFileName) {
    console.error('You must provide both --folder and --outfilename arguments.');
    process.exit(1);
}

// 1. Discover paths
(async () => {
    const files = await glob("./project/**/*.js", { ignore: ['node_modules/**', '**/*test.js'] });
    files.forEach((file) => {
        // Skip test files
        if (file.endsWith('test.js')) {
            return;
        }

        // 2. Parse files
        const code = fs.readFileSync(file, 'utf8');
        const ast = parser.parse(code, { sourceType: 'module' });

        // 3. Replace paths
        replacePathsInAst(ast, file, shouldChangeFiles);

        if (shouldChangeFiles) {
            const newCode = generator.default(ast).code;
            fs.writeFileSync(file, newCode);
        }
    });
});


function replacePathsInAst(ast, currentFile, shouldChangeFiles) {
    traverse.default(ast, {
        enter(path) {
            if (path.isImportDeclaration()) {
                const oldPath = path.node.source.value;
                const newPath = replacePath(oldPath, currentFile);
                if (newPath !== oldPath) {
                    if (shouldChangeFiles) {
                        path.node.source.value = newPath;
                    } else {
                        console.log(`Would change ${chalk.red(oldPath)} to ${chalk.green(newPath)} in file ${chalk.blue(currentFile)}`);
                    }
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
        if (`${oldPath}`.startsWith('.')) {
            // If the file doesn't exist, iterate over the pathMapping object
            for (let [newPath, mappedOldPath] of Object.entries(mergedPaths)) {
                // Normalize paths
                const normalizedOldPath = oldPath.split('./').pop().replace(/\\/g, '/');
                const normalizedMappedOldPath = mappedOldPath.replace(/\\/g, '/');

                // If the mappedOldPath includes the oldPath, replace it with the newPath
                if (normalizedMappedOldPath.includes(normalizedOldPath)) {
                    return newPath;
                }
            }
        } else if (!`${oldPath}`.startsWith('.') && isFirstLetterCapitalized(oldPath)) {
            const absolutePath = absoluteImports[oldPath];
            if (absolutePath) {
                for (let [newPath, mappedOldPath] of Object.entries(mergedPaths)) {
                    // Normalize paths
                    const normalizedOldPath = absolutePath.split('./').pop().replace(/\\/g, '/');
                    const normalizedMappedOldPath = mappedOldPath.replace(/\\/g, '/');

                    // If the mappedOldPath includes the oldPath, replace it with the newPath
                    if (normalizedMappedOldPath.includes(normalizedOldPath)) {
                        return newPath;
                    }
                }
            }
        }
    }

    // If no matching old path was found in the mapping object, return the old path
    return oldPath;
}

function isFirstLetterCapitalized(str) {
    return str.charAt(0) === str.charAt(0).toUpperCase();
}
