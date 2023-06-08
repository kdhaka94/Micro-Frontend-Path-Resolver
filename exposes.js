#!/usr/bin/env node

import generator from '@babel/generator';
import parser from '@babel/parser';
import fs from 'fs';
import { glob } from 'glob';

let folderName;
let outputFileName;
let shouldChangeFiles = false;

process.argv.slice(2).forEach((value, index, array) => {
    if (value === '--folder') {
        folderName = array[index + 1];
    } else if (value === '--outfilename') {
        outputFileName = array[index + 1];
    } else if (value === 'change') {
        shouldChangeFiles = true;
    }
});

(async () => {
    const files = await glob(`./${folderName}/**/*.js`, {
        ignore: ['node_modules/**', '**/*test.js'],
    });

    const exposes = await getExposes(folderName);

    const matchingFiles = files.filter((file) => file.endsWith(outputFileName));

    if (shouldChangeFiles && matchingFiles.length > 0) {
        const outputFile = matchingFiles[0];
        const code = fs.readFileSync(outputFile, 'utf8');
        const ast = parser.parse(code, { sourceType: 'module' });

        replaceExposesInAst(ast, exposes);

        const newCode = generator.default(ast).code;
        fs.writeFileSync(outputFile, newCode);
        console.log(`Replaced exposes in ${outputFile}`);
    } else {
        console.log(`Would replace exposes in ${outputFileName}:`, exposes);
    }
})();


function replaceExposesInAst(ast, exposes) {
    console.log('Replacing exposes in AST');

    const code = generator.default(ast).code;

    // Find the opening and closing curly braces
    const openingBraceIndex = code.indexOf('{');
    const closingBraceIndex = code.indexOf('}');

    if (openingBraceIndex !== -1 && closingBraceIndex !== -1 && openingBraceIndex < closingBraceIndex) {
        // Replace the content between the curly braces
        const contentBetweenBraces = code.substring(openingBraceIndex + 1, closingBraceIndex).trim();
        const newContent = Object.entries(exposes)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');

        const newCode = code.substring(0, openingBraceIndex + 1) + newContent + code.substring(closingBraceIndex);
        const newAst = parser.parse(newCode, { sourceType: 'module' });

        return newAst;
    }

    console.log('Unable to find the opening and closing curly braces');
    return ast;
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