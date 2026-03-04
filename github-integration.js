#!/usr/bin/env node

/**
 * 🐙 GitHub 集成工具
 * 功能：PR review、Issues 管理、仓库分析、测试运行
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// GitHub API 配置（从环境变量读取）
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const API_BASE = 'https://api.github.com';

/**
 * 获取 PR 详情
 */
async function getPullRequest(owner, repo, prNumber) {
  const url = `${API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}`;
  return githubRequest(url);
}

/**
 * 获取 PR 的 files 变更
 */
async function getPullRequestFiles(owner, repo, prNumber) {
  const url = `${API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}/files`;
  return githubRequest(url);
}

/**
 * 获取 Issues 列表
 */
async function getIssues(owner, repo, options = {}) {
  const params = new URLSearchParams({
    state: options.state || 'open',
    per_page: options.per_page || '10'
  });
  
  if (options.labels) {
    params.append('labels', options.labels.join(','));
  }
  
  const url = `${API_BASE}/repos/${owner}/${repo}/issues?${params}`;
  return githubRequest(url);
}

/**
 * 创建 Issue
 */
async function createIssue(owner, repo, title, body = '', labels = []) {
  const url = `${API_BASE}/repos/${owner}/${repo}/issues`;
  return githubRequest(url, 'POST', { title, body, labels });
}

/**
 * 添加 PR 评论
 */
async function createPullRequestReview(owner, repo, prNumber, body, event = 'COMMENT') {
  const url = `${API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}/reviews`;
  return githubRequest(url, 'POST', { body, event });
}

/**
 * 获取仓库信息
 */
async function getRepository(owner, repo) {
  const url = `${API_BASE}/repos/${owner}/${repo}`;
  return githubRequest(url);
}

/**
 * 获取仓库统计信息
 */
async function getRepoStats(owner, repo) {
  const url = `${API_BASE}/repos/${owner}/${repo}/stats/contributors`;
  return githubRequest(url);
}

/**
 * GitHub API 请求
 */
async function githubRequest(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'OpenClaw-GitHub-Integration'
    }
  };
  
  if (GITHUB_TOKEN) {
    options.headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * 运行 GitHub Actions workflow
 */
async function runWorkflow(owner, repo, workflowId, ref = 'main') {
  const url = `${API_BASE}/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`;
  return githubRequest(url, 'POST', { ref });
}

/**
 * 获取 workflow 运行状态
 */
async function getWorkflowRuns(owner, repo, workflowId) {
  const url = `${API_BASE}/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs`;
  return githubRequest(url);
}

/**
 * PR 自动审查
 */
async function reviewPullRequest(owner, repo, prNumber) {
  console.log(`🐙 审查 PR #${prNumber} in ${owner}/${repo}\n`);
  
  // 获取 PR 详情
  const pr = await getPullRequest(owner, repo, prNumber);
  console.log(`📝 标题：${pr.title}`);
  console.log(`👤 作者：${pr.user.login}`);
  console.log(`📊 状态：${pr.state} | 变更文件：${pr.changed_files} | 提交：${pr.commits}\n`);
  
  // 获取文件变更
  const files = await getPullRequestFiles(owner, repo, prNumber);
  console.log(`📁 变更文件列表:\n`);
  
  files.forEach(file => {
    console.log(`  ${file.status === 'added' ? '🟢' : file.status === 'modified' ? '🟡' : '🔴'} ${file.filename}`);
    console.log(`     +${file.additions} -${file.deletions}`);
  });
  
  // 简单分析
  const analysis = analyzeChanges(files);
  console.log(`\n🔍 自动分析:\n`);
  console.log(analysis);
  
  return { pr, files, analysis };
}

/**
 * 分析代码变更
 */
function analyzeChanges(files) {
  let analysis = '';
  
  // 检查文件类型
  const jsFiles = files.filter(f => f.filename.endsWith('.js') || f.filename.endsWith('.ts'));
  const configFiles = files.filter(f => 
    f.filename.includes('package.json') || 
    f.filename.includes('config') ||
    f.filename.endsWith('.yml') ||
    f.filename.endsWith('.yaml')
  );
  const testFiles = files.filter(f => 
    f.filename.includes('.test.') || 
    f.filename.includes('.spec.') ||
    f.filename.includes('test/')
  );
  
  if (jsFiles.length > 0) {
    analysis += `- 📝 代码文件：${jsFiles.length} 个\n`;
  }
  
  if (configFiles.length > 0) {
    analysis += `- ⚙️  配置文件：${configFiles.length} 个\n`;
  }
  
  if (testFiles.length > 0) {
    analysis += `- ✅ 测试文件：${testFiles.length} 个\n`;
  }
  
  // 检查大文件变更
  const largeChanges = files.filter(f => f.changes > 100);
  if (largeChanges.length > 0) {
    analysis += `- ⚠️  大文件变更：${largeChanges.length} 个 (>100 行)\n`;
  }
  
  // 检查敏感文件
  const sensitiveFiles = files.filter(f => 
    f.filename.includes('.env') ||
    f.filename.includes('secret') ||
    f.filename.includes('credential')
  );
  if (sensitiveFiles.length > 0) {
    analysis += `- 🔒 敏感文件：${sensitiveFiles.length} 个 (需要审查)\n`;
  }
  
  // 总体评估
  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);
  
  analysis += `\n📊 总体评估:\n`;
  analysis += `  总变更：+${totalAdditions} -${totalDeletions}\n`;
  
  if (totalAdditions > 500) {
    analysis += `  ⚠️  变更量较大，建议仔细审查\n`;
  }
  
  if (testFiles.length === 0 && jsFiles.length > 0) {
    analysis += `  ⚠️  代码变更但无测试文件，建议添加测试\n`;
  }
  
  return analysis;
}

/**
 * 命令行使用
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🐙 GitHub 集成工具');
    console.log('\n用法:');
    console.log('  node github-integration.js pr <owner>/<repo> <pr-number>  # 审查 PR');
    console.log('  node github-integration.js issues <owner>/<repo>          # 查看 Issues');
    console.log('  node github-integration.js repo <owner>/<repo>            # 仓库信息');
    console.log('  node github-integration.js stats <owner>/<repo>           # 仓库统计');
    console.log('\n示例:');
    console.log('  node github-integration.js pr openclaw/openclaw 123');
    console.log('  node github-integration.js issues openclaw/openclaw');
    console.log('\n配置:');
    console.log('  export GITHUB_TOKEN=your_token  # 设置 GitHub Token');
    process.exit(1);
  }
  
  const command = args[0];
  
  switch (command) {
    case 'pr':
      if (args.length < 3) {
        console.error('用法：node github-integration.js pr <owner>/<repo> <pr-number>');
        process.exit(1);
      }
      const [ownerRepo, prNumber] = args.slice(1);
      const [owner, repo] = ownerRepo.split('/');
      reviewPullRequest(owner, repo, parseInt(prNumber));
      break;
      
    case 'issues':
      const [ownerRepo2] = args.slice(1);
      const [owner2, repo2] = ownerRepo2.split('/');
      getIssues(owner2, repo2).then(issues => {
        console.log(`📋 ${owner2}/${repo2} 的 Issues:\n`);
        issues.forEach(issue => {
          console.log(`#${issue.number} ${issue.title} (${issue.state})`);
        });
      });
      break;
      
    case 'repo':
      const [ownerRepo3] = args.slice(1);
      const [owner3, repo3] = ownerRepo3.split('/');
      getRepository(owner3, repo3).then(repo => {
        console.log(`📦 ${repo.full_name}`);
        console.log(`📝 ${repo.description}`);
        console.log(`⭐ ${repo.stargazers_count} stars | 🍴 ${repo.forks_count} forks`);
        console.log(`📺 ${repo.watchers_count} watchers | 📦 ${repo.size} KB`);
      });
      break;
      
    default:
      console.error(`未知命令：${command}`);
      process.exit(1);
  }
}

module.exports = {
  getPullRequest,
  getPullRequestFiles,
  getIssues,
  createIssue,
  createPullRequestReview,
  getRepository,
  reviewPullRequest,
  runWorkflow,
  getWorkflowRuns
};
