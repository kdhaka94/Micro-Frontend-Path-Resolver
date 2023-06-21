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
    let output = `Open Pull Request: ${chalk.green(pr.html_url)} - Branch: ${chalk.blue(pr.head.ref)} - Owner: ${chalk.yellow(pr.user.login)}`;

    if (pr.mergeable_state === 'dirty') {
      output += ` - ${chalk.red('Has conflicts')}`;
    }

    const { data: comments } = await octokit.pulls.listReviewComments({
      owner,
      repo,
      pull_number: pr.number,
    });

    const unansweredComments = comments.some(comment => {
      // Check if the comment is from someone other than the PR owner
      if (comment.user.login !== pr.user.login) {
        // Find all replies to the comment
        const replies = comments.filter(reply => reply.in_reply_to_id === comment.id);

        // If there are no replies, the comment is unanswered
        if (replies.length === 0) {
          return true;
        }

        // If the most recent reply is not from the PR owner, the comment is unanswered
        const mostRecentReply = replies[replies.length - 1];
        if (mostRecentReply.user.login !== pr.user.login) {
          return true;
        }
      }

      // Otherwise, the comment is considered answered
      return false;
    });

    if (unansweredComments) {
      output += ` - ${chalk.magenta('Has unanswered comments')}`;
    }

    if (output.includes('conflicts') || output.includes('unanswered'))
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
    const [, , , owner, repoName] = newRepo.split('/');
    await getPullRequests(owner, repoName);
  } else if (repo === 'Check all repos') {
    for (let repoUrl of repos) {
      const [, , , owner, repoName] = repoUrl.split('/');
      await getPullRequests(owner, repoName);
    }
  } else {
    const [, , , owner, repoName] = repo.split('/');
    await getPullRequests(owner, repoName);
  }

  const { shouldContinue } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldContinue',
      message: 'Do you want to check another repo?',
      default: false,
    },
  ]);

  return shouldContinue;
}

const run = async () => {
  let continueRunning = true;
  while (continueRunning) {
    continueRunning = await main();
  }
}

run();
