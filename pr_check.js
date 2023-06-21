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
const octokit = new Octokit({ auth: `your_personal_access_token` });

const getPullRequests = async (owner, repo) => {
  let pulls = [];

  // First, get the total number of pull requests
  const response = await octokit.pulls.list({
    owner,
    repo,
    state: 'open',
    per_page: 1,
  });

  const linkHeader = response.headers.link;
  const lastPageMatch = linkHeader.match(/&page=(\d+)>; rel="last"/);
  const totalPulls = lastPageMatch ? parseInt(lastPageMatch[1], 10) : 0;

  // Calculate the page number to start from
  const totalPages = totalPulls / 100;
  if (totalPages * 100 - totalPulls > 0) {
    totalPages += 1;
  }
  let all_ok = true;

  for (let page = 1; page <= totalPages; page++) {
    const { data } = await octokit.pulls.list({
      owner,
      repo,
      state: 'open',
      page,
      per_page: 100, // Fetch up to 100 PRs per page
    });

    pulls = pulls.concat(data);
  }

  const CXMFEBranches = pulls.filter(pr => pr.head.ref.includes('CXMFE'));

  for (let pr of CXMFEBranches) {
    let output = `Open Pull Request: ${chalk.green(pr.html_url)} - Branch: ${chalk.blue(pr.head.ref)} - Owner: ${chalk.yellow(pr.user.login)}`;

    if (pr.mergeable_state === 'dirty') {
      all_ok = false;
      output += ` - ${chalk.red('Has conflicts')}`;
    }

    const { data: comments } = await octokit.pulls.listReviewComments({
      owner,
      repo,
      pull_number: pr.number,
    });

    let unansweredComments = false;
    for (const comment of comments) {
      if (comment.user.login !== pr.user.login) {
        const replies = comments.filter(reply => reply.in_reply_to_id === comment.id);
        if (replies.length === 0 || replies[replies.length - 1].user.login !== pr.user.login) {
          unansweredComments = true;
          break;
        }
      }
    }

    if (unansweredComments) {
      all_ok = false;
      output += ` - ${chalk.magenta('Has unanswered comments')}`;
    }
    // Check the status of the pipelines for the commit associated with the pull request
    const { data: checkRuns } = await octokit.checks.listForRef({
      owner,
      repo,
      ref: pr.head.sha,
    });

    // If any of the check runs have failed, add a note to the output
    const hasFailingPipelines = checkRuns.check_runs.some(checkRun => checkRun.conclusion === 'failure');
    if (hasFailingPipelines) {
      all_ok = false;
      output += ` - ${chalk.red('Pipeline is failing')}`;
    }

    if (all_ok) {
      output += ` - ${chalk.green('All OK')}`
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
