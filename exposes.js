#!/usr/bin/env node

import generator from '@babel/generator';
import fs from 'fs';
import { glob } from 'glob';
import _traverse from "@babel/traverse";
const traverse = _traverse.default;
import chalk from 'chalk';
import * as parser from '@babel/parser';
import * as t from '@babel/types';

let folderName;
let outputFileName;

if (process.argv.length <= 2) {
    console.log(chalk.red('No arguments provided'));
}

process.argv.slice(2).forEach((value, index, array) => {
    if (value === '--folder') {
        folderName = array[index + 1];
    } else if (value === '--outfilename') {
        outputFileName = array[index + 1];
    }
});

(async () => {
    const files = await glob(`./${folderName}/**/*.js`, {
        ignore: ['node_modules/**', '**/*test.js'],
    });

    const exposes = await getExposes(folderName);

    const matchingFiles = files.filter((file) => file.endsWith(outputFileName));
    if (outputFileName && matchingFiles.length > 0) {
        const outputFile = matchingFiles[0];
        const code = fs.readFileSync(outputFile, 'utf8');
        const ast = parser.parse(code, { sourceType: 'module' });

        replaceExposesInAst(ast, exposes);

        const newCode = generator.default(ast).code;
        fs.writeFileSync(outputFile, newCode);
        console.log(`Replaced exposes in ${outputFile}`);
    } else {
        console.log(chalk.cyanBright(`Here are the exposes (if you want it to replace the exposes object pass the file name with --outfilename webpack.dev.js):\n`), exposes);
    }
})();


function replaceExposesInAst(ast, exposes) {
    traverse(ast, {
        ObjectExpression(path) {
            path.node.properties.forEach((property) => {
                if (
                    t.isObjectProperty(property) &&
                    t.isIdentifier(property.key) &&
                    property.key.name === 'exposes'
                ) {
                    const newProperties = Object.entries(exposes).map(([key, value]) =>
                        t.objectProperty(t.stringLiteral(key), t.stringLiteral(value))
                    );
                    property.value = t.objectExpression(newProperties);
                }
            });
        },
    });
}

async function getExposes(folderName) {
    const indexFiles = await glob(`./${folderName}/**/index.js`, { ignore: ['node_modules/**', '**/*test.js'] });
    const rootLevelFiles = await glob(`./${folderName}/app/*.{js,ts}`, { ignore: ['node_modules/**', '**/*test.js'] });

    const exposes = Array.from(new Set([...indexFiles.map(file => {
        const [_, ...rest] = file.split('\\')
        return rest.join('/')
    }), ...rootLevelFiles.map(file => {
        const [_, ...rest] = file.split('\\')
        return rest.join('/')
    })]));
    const exposesObj = new Map();
    exposes.map(path => {
        const [_, ...rest] = path.split('/');
        const key = './' + rest.join('/').replaceAll('/index.js', '').replaceAll('.js', '');
        exposesObj.set(key, './' + path.replaceAll('/index.js', '').replaceAll('.js', ''))
    });
    return Object.fromEntries(exposesObj);
}