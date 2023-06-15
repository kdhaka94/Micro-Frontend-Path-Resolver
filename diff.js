import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv)).argv;

function compareDirectories(dir1, dir2) {
  const files1 = fs.readdirSync(dir1);
  const files2 = fs.readdirSync(dir2);

  // Compare files in dir1 that are not in dir2
  const uniqueFiles1 = files1.filter(file => !files2.includes(file));
  for (const file of uniqueFiles1) {
    const filePath = path.join(dir1, file);
    console.log(`${filePath} is unique to ${dir1}`);
  }

  // Compare files in dir2 that are not in dir1
  const uniqueFiles2 = files2.filter(file => !files1.includes(file));
  for (const file of uniqueFiles2) {
    const filePath = path.join(dir2, file);
    console.log(`${filePath} is unique to ${dir2}`);
  }

  // Compare files that are in both directories
  const commonFiles = files1.filter(file => files2.includes(file));
  for (const file of commonFiles) {
    const filePath1 = path.join(dir1, file);
    const filePath2 = path.join(dir2, file);
    const stats1 = fs.statSync(filePath1);
    const stats2 = fs.statSync(filePath2);

    if (stats1.isDirectory() && stats2.isDirectory()) {
      // Recursively compare subdirectories
      compareDirectories(filePath1, filePath2);
    } else if (stats1.isFile() && stats2.isFile()) {
      // Compare file contents
      const contents1 = fs.readFileSync(filePath1, 'utf8');
      const contents2 = fs.readFileSync(filePath2, 'utf8');
      if (contents1 !== contents2) {
        console.log(`${filePath1} and ${filePath2} have different contents`);
      }
    } else {
      console.log(`${filePath1} and ${filePath2} are not the same type of file`);
    }
  }
}

if (!argv.dir1 || !argv.dir2) {
  console.error("Please provide two directory paths with --dir1 and --dir2");
  process.exit(1);
}

compareDirectories(argv.dir1, argv.dir2)
  .then(([differingFiles, identicalFiles, filesOnlyInDir1, filesOnlyInDir2]) => {
    console.log('Files that differ between the two directories:', differingFiles);
    console.log('Files that are identical:', identicalFiles);
    console.log('Files that are only in the first directory:', filesOnlyInDir1);
    console.log('Files that are only in the second directory:', filesOnlyInDir2);
  });
