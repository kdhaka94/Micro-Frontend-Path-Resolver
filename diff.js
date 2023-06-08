import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv)).argv;

async function getFileHash(filePath) {
  const hash = createHash('md5');
  const data = fs.readFileSync(filePath);

  hash.update(data);
  return hash.digest('hex');
}

async function compareDirectories(dir1, dir2) {
  const [files1, files2] = await Promise.all([
    fs.promises.readdir(dir1),
    fs.promises.readdir(dir2),
  ]);

  const filesInBoth = files1.filter((file) => files2.includes(file));
  const filesOnlyInDir1 = files1.filter((file) => !files2.includes(file));
  const filesOnlyInDir2 = files2.filter((file) => !files1.includes(file));

  const differingFiles = [];
  const identicalFiles = [];

  for (const file of filesInBoth) {
    const [hash1, hash2] = await Promise.all([
      getFileHash(path.join(dir1, file)),
      getFileHash(path.join(dir2, file)),
    ]);

    if (hash1 !== hash2) {
      differingFiles.push(file);
    } else {
      identicalFiles.push(file);
    }
  }

  return [differingFiles, identicalFiles, filesOnlyInDir1, filesOnlyInDir2];
}

if(!argv.dir1 || !argv.dir2){
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
