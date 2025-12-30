import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

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
    throw new Error('X_REPLIT_TOKEN not found');
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

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

const SKIP_DIRS = new Set(['.git', 'node_modules', '.cache', '.config', 'dist', 'static-build', '.upm', '.replit.nix', 'attached_assets', '.expo', '.local', 'admin-panel/node_modules']);
const SKIP_FILES = new Set(['.replit', 'replit.nix', '.gitattributes', 'package-lock.json']);

function getAllFiles(dir: string, baseDir: string): string[] {
  const files: string[] = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);
      
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name) && !SKIP_DIRS.has(relativePath)) {
          files.push(...getAllFiles(fullPath, baseDir));
        }
      } else {
        if (!SKIP_FILES.has(entry.name) && !entry.name.endsWith('.lock') && !entry.name.startsWith('.agent_state')) {
          const stat = fs.statSync(fullPath);
          if (stat.size < 1000000) {
            files.push(relativePath);
          }
        }
      }
    }
  } catch (e) {}
  
  return files;
}

async function initializeRepo(octokit: Octokit, owner: string, repo: string) {
  console.log('Initializing repository with README...');
  try {
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'README.md',
      message: 'Initial commit',
      content: Buffer.from('# Kahraba\n\nHome Services Marketplace for Jordan\n').toString('base64'),
    });
    console.log('Repository initialized');
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error: any) {
    if (error.status === 422) {
      console.log('README already exists, repo is initialized');
    } else {
      throw error;
    }
  }
}

async function main() {
  const octokit = await getGitHubClient();
  const { data: user } = await octokit.users.getAuthenticated();
  const owner = user.login;
  const repo = 'kahraba';
  const baseDir = process.cwd();
  
  console.log(`Pushing files to ${owner}/${repo}...`);
  
  await initializeRepo(octokit, owner, repo);
  
  const files = getAllFiles(baseDir, baseDir);
  console.log(`Found ${files.length} files to upload`);
  
  console.log('Creating blobs...');
  const treeItems: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];
  
  const batchSize = 5;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (filePath) => {
        try {
          const fullPath = path.join(baseDir, filePath);
          const content = fs.readFileSync(fullPath);
          const base64Content = content.toString('base64');
          
          const { data: blob } = await octokit.git.createBlob({
            owner,
            repo,
            content: base64Content,
            encoding: 'base64',
          });
          
          return { path: filePath, sha: blob.sha };
        } catch (error: any) {
          console.error(`Error uploading ${filePath}: ${error.message}`);
          return null;
        }
      })
    );
    
    for (const result of results) {
      if (result) {
        treeItems.push({
          path: result.path,
          mode: '100644',
          type: 'blob',
          sha: result.sha,
        });
      }
    }
    
    console.log(`Uploaded ${Math.min(i + batchSize, files.length)}/${files.length} files`);
  }
  
  console.log(`Creating tree with ${treeItems.length} items...`);
  
  const { data: mainRef } = await octokit.git.getRef({
    owner,
    repo,
    ref: 'heads/main',
  });
  const parentSha = mainRef.object.sha;
  
  const { data: parentCommit } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: parentSha,
  });
  
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    tree: treeItems,
    base_tree: parentCommit.tree.sha,
  });
  
  console.log('Creating commit...');
  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo,
    message: 'Add Kahraba project files',
    tree: tree.sha,
    parents: [parentSha],
  });
  
  console.log('Updating main branch...');
  await octokit.git.updateRef({
    owner,
    repo,
    ref: 'heads/main',
    sha: commit.sha,
    force: true,
  });
  
  console.log(`\nDone! All files pushed to: https://github.com/${owner}/${repo}`);
}

main().catch(console.error);
