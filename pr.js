import { Octokit } from "@octokit/rest";
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs';

let repos = [];

// Load repos from file
if (fs.existsSync('repos.json')) {
  repos = JSON.parse(fs.readFileSync('repos.json'));
}

// Create a personal access token at https://github.com/settings/tokens
const octokit = new Octokit({ auth: `your_personal_token` });

const getPullRequests = async (owner, repo) => {
  const { data: pulls } = await octokit.pulls.list({
    owner,
    repo,
    state: 'open'
  });

  const CXMFEBranches = pulls.filter(pr => pr.head.ref.includes('CXMFE'));

  for (let pr of CXMFEBranches) {
    let output = `Pull Request: ${chalk.green(pr.number)} - Branch: ${chalk.blue(pr.head.ref)} - Owner: ${chalk.yellow(pr.user.login)}`;

    if (pr.mergeable_state === 'dirty') {
      output += ` - ${chalk.red('Has conflicts')}`;
    }

    const { data: comments } = await octokit.pulls.listReviewComments({
      owner,
      repo,
      pull_number: pr.number,
    });

    if (comments.length > 0) {
      output += ` - ${chalk.magenta('Has comments')}`;
    }

    console.log(output);
  }
}

const main = async () => {
  const { repo } = await inquirer.prompt([
    {
      type: 'list',
      name: 'repo',
      message: 'Which repo do you want to check?',
      choices: [...repos, new inquirer.Separator(), 'Add new repo', 'Check all repos'],
    },
  ]);

  if (repo === 'Add new repo') {
    const { newRepo } = await inquirer.prompt([
      {
        type: 'input',
        name: 'newRepo',
        message: 'Enter the URL of the new repo:',
      },
    ]);

    repos.push(newRepo);
    // Save repos to file
    fs.writeFileSync('repos.json', JSON.stringify(repos));
    const [, , , owner, repoName] = newRepo.split('/'); // Corrected line
    await getPullRequests(owner, repoName);
  } else if (repo === 'Check all repos') {
    for (let repoUrl of repos) {
      const [, , , owner, repoName] = repoUrl.split('/'); // Corrected line
      await getPullRequests(owner, repoName);
    }
  } else {
    const [, , , owner, repoName] = repo.split('/'); // Corrected line
    await getPullRequests(owner, repoName);
  }


  main();  // run again after finishing
}

main();