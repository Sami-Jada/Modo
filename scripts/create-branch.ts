import { Octokit } from '@octokit/rest';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

async function main() {
  const branchName = process.argv[2] || 'feature/marketing-site';
  
  console.log('Connecting to GitHub...');
  const octokit = await getUncachableGitHubClient();
  
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);
  
  const owner = user.login;
  const repo = 'kahraba';
  
  console.log(`Getting main branch reference...`);
  const { data: mainRef } = await octokit.git.getRef({
    owner,
    repo,
    ref: 'heads/main',
  });
  
  const mainSha = mainRef.object.sha;
  console.log(`Main branch SHA: ${mainSha}`);
  
  console.log(`Creating branch: ${branchName}...`);
  try {
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: mainSha,
    });
    console.log(`Branch created: ${branchName}`);
    console.log(`\nBranch URL: https://github.com/${owner}/${repo}/tree/${branchName}`);
  } catch (error: any) {
    if (error.status === 422) {
      console.log(`Branch ${branchName} already exists.`);
    } else {
      throw error;
    }
  }
  
  console.log('\n=== NEXT STEPS ===');
  console.log(`To push changes to this branch, run:`);
  console.log(`  git push github HEAD:${branchName}`);
}

main().catch(console.error);
