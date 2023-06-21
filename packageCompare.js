import fs from 'fs';
import readline from 'readline';
import path from 'path';

// Function to ask the user for input
const askQuestion = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve =>
    rl.question(query, ans => {
      rl.close();
      resolve(ans);
    })
  );
}

// Function to update dependencies
const updateDependencies = (baseDeps, childDeps) => {
  for (let dep in baseDeps) {
    if (childDeps.hasOwnProperty(dep) && childDeps[dep] !== baseDeps[dep]) {
      childDeps[dep] = baseDeps[dep];
    }
  }
}

const main = async () => {
  // Ask the user for the directories
  const baseDir = await askQuestion('Enter the path to the base directory: ');
  const childDir = await askQuestion('Enter the path to the child directory: ');

  // Create the paths to the package.json files
  const basePackagePath = path.join(baseDir, 'package.json');
  const childPackagePath = path.join(childDir, 'package.json');

  // Read the package.json files
  const basePackageJson = JSON.parse(fs.readFileSync(basePackagePath, 'utf-8'));
  const childPackageJson = JSON.parse(fs.readFileSync(childPackagePath, 'utf-8'));

  // Update dependencies and devDependencies
  updateDependencies(basePackageJson.dependencies, childPackageJson.dependencies);
  updateDependencies(basePackageJson.devDependencies, childPackageJson.devDependencies);

  // Write the updated child package.json back to file
  fs.writeFileSync(childPackagePath, JSON.stringify(childPackageJson, null, 2), 'utf-8');
}

// Run the main function
main().catch(console.error);
