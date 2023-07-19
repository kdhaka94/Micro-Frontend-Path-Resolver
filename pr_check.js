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
const octokit = new Octokit({ auth: `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` });

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

const a = {
  ENABLE_NON_SHOP_ORDER_MODIFICATION: "true",
  FRAMEWORK_ID: "mss",
  FRAMEWORK_LANGUAGE: "en",
  HOST: "localhost",
  PORTAL_URL: "https://cxcp-customer-portal-dev.morpheus-np.cx-shop-nonprod.sysco-go.com",
  REQUEST_TIMEOUT: "50000",
  WS_AUTH_ID: "frontendUser",
  WS_URL: "http://test.com",
  ACCOUNT_MANAGER_MIN_ORDERS_PER_PAGE: "20",
  CDN_HOST: "https://cdn.cx-shop-nonprod.sysco-go.com",
  DOCKER_IMAGE_TAG: "mss-frontend:local:latest",
  INTERCOM_APP_ID: "y93rlcki",
  MSS_FE_CONNECTION_CHECK_INTERVAL: "360000",
  OPTIMIZELY_SDK_KEY_V2: "DYTdoKyRNCc6WwZ6PnExR",
  OPTIMIZELY_DATAFILE_UPDATE_INTERVAL: "10000",
  PORT: "8888",
  SYSCO_PAY_REDIRECT_BASE_URL: "https://syscofull-syscofull.cs77.force.com/v2/s/",
  ACCOUNT_MANAGER_SELECT_ALL_CUSTOMER_LIMIT: "1000",
  COMMISSION_CALCULATOR_BFF: "https://list-bff.sysco.com:9090",
  ENV: "local",
  NODE_ENV: "dev",
  MA_AUTHENTICATION_TYPE: "AD",
  OPTIMIZELY_DATA_FILE_URL: "https://cdn.optimizely.com/datafiles",
  OPTIMIZELY_SNIPPET_URL: "https://cdn.cx-shop-nonprod.sysco-go.com/js/21664070285.js",
  SERVICE_URL: "https://localhost:6060",
  BFF_GATEWAY_URL: "https://cx-gateway-api-dev.morpheus-np.cx-shop-nonprod.us-east-1.aws.sysco.net/graphql",
  SIGNUP_REDIRECT_URL: "https://portal.sysco.com/register",
  UPSCOPE_APP_ID: "cdfwwixJfg",
  WS_REALM: "test",
  ACCOUNT_MANAGER_CUSTOMERS_PAGE_SIZE: "40",
  BECOME_A_CUSTOMER_URL: "https://sysco.com/Contact/Contact/Become-A-Customer",
  ELASTIC_APM_SERVER: "https://apm.cx-shop-nonprod.sysco-go.com",
  ENABLE_PERMISSION_CHECK: "false",
  PRICE_EXCEPTIONS_URL: "https://dds-qa.prcp-rm-np.us-east-1.aws.sysco.net/app/exceptions",
  SYSCO_PAY_URL: "https://myapps.microsoft.com/signin/Sysco%20Pay%20Dev/aed65d7a-5fe3-44bd-b044-7a10f2be9d17?tenantId=b7aa4308-bf33-414f-9971-6e0c972cbe5d",
  SOTF_URL: "https://spogstg.suppliesonthefly.com",
  CA_NUTRITION_FACTS_URL: "https://www.syscoitems.ca",
  INVENTORY_MERCHANDISING_URL: "https://inventory-management.merch-qa.cloud.sysco.net/inventory-management",
  SYSCO_IMAGE_SERVICE_URL: "https://image.sysco.com/image-server/product/image",
  SYSCO_PAY_SSO_URL: "https://secure-q.sysco.com/app/syscoconsumer_syscopaysbx_1/exk1ly81oabezU5MM1d7/sso/saml",
  DASHBOARD_MFE_NAME: "DashboardMfe",
  DASHBOARD_MFE_URL: "http://localhost:8082/",
  BRANDS_MFE_NAME: "BrandsMfe",
  BRANDS_MFE_URL: "http://localhost:8081/",
  CATALOG_MFE_NAME: "CatalogMfe",
  CATALOG_MFE_URL: "http://localhost:8086/",
  COMMON_MFE_NAME: "CommonMfe",
  COMMON_MFE_URL: "http://localhost:8080/",
  SHELL_MFE_NAME: "ShellMfe",
  SHELL_MFE_URL: "http://localhost:8888/",
  PRODUCT_MFE_NAME: "ProductMfe",
  PRODUCT_MFE_URL: "http://localhost:8084/",
  ACCOUNT_MFE_NAME: "AccountManagerMfe",
  ACCOUNT_MFE_URL: "http://localhost:8087/",
  CATALOG_MFE_NAME: "CatalogMfe",
  CATALOG_MFE_URL: "http://localhost:8086/",
  REMOTE_ENTRY: "remoteEntry.js",
  DEALS_MFE_NAME: "DealsMfe",
  DEALS_MFE_URL: "http://localhost:8085/",
  DELIVERY_MFE_NAME: "DeliveryMfe",
  DELIVERY_MFE_URL: "http://localhost:8083/",
}