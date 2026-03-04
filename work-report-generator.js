#!/usr/bin/env node

/**
 * 📝 工作日志生成器
 * 功能：基于 git commit 生成日报/周报
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 工作日志生成器
 */
class WorkReportGenerator {
  constructor(repoPath = '.') {
    this.repoPath = repoPath;
  }
  
  /**
   * 获取 git commits
   */
  getCommits(options = {}) {
    const since = options.since || '24 hours ago';
    const author = options.author || '';
    
    let command = `cd "${this.repoPath}" && git log --since="${since}" --pretty=format:"%H|%ad|%s|%an" --date=iso`;
    
    if (author) {
      command += ` --author="${author}"`;
    }
    
    try {
      const output = execSync(command, { encoding: 'utf8' });
      
      if (!output.trim()) {
        return [];
      }
      
      return output.split('\n').map(line => {
        const [hash, date, message, author] = line.split('|');
        return { hash, date, message, author };
      });
    } catch (error) {
      console.error('获取 commits 失败:', error.message);
      return [];
    }
  }
  
  /**
   * 获取文件变更统计
   */
  getFileChanges(commitHash) {
    try {
      const output = execSync(
        `cd "${this.repoPath}" && git show --stat ${commitHash}`,
        { encoding: 'utf8' }
      );
      
      const lines = output.split('\n');
      const changes = [];
      
      for (const line of lines) {
        if (line.includes('|')) {
          const parts = line.split('|');
          if (parts.length >= 3) {
            changes.push({
              file: parts[0].trim(),
              insertions: parseInt(parts[1]) || 0,
              deletions: parseInt(parts[2]) || 0
            });
          }
        }
      }
      
      return changes;
    } catch (error) {
      return [];
    }
  }
  
  /**
   * 分类 commits
   */
  categorizeCommits(commits) {
    const categories = {
      feature: [],
      fix: [],
      docs: [],
      refactor: [],
      test: [],
      chore: [],
      other: []
    };
    
    for (const commit of commits) {
      const msg = commit.message.toLowerCase();
      
      if (msg.startsWith('feat') || msg.includes('添加') || msg.includes('新增')) {
        categories.feature.push(commit);
      } else if (msg.startsWith('fix') || msg.includes('修复') || msg.includes('bug')) {
        categories.fix.push(commit);
      } else if (msg.startsWith('docs') || msg.includes('文档')) {
        categories.docs.push(commit);
      } else if (msg.startsWith('refactor')) {
        categories.refactor.push(commit);
      } else if (msg.startsWith('test')) {
        categories.test.push(commit);
      } else if (msg.startsWith('chore')) {
        categories.chore.push(commit);
      } else {
        categories.other.push(commit);
      }
    }
    
    return categories;
  }
  
  /**
   * 生成日报
   */
  generateDailyReport(options = {}) {
    const commits = this.getCommits({ since: '24 hours ago', ...options });
    const categories = this.categorizeCommits(commits);
    
    const report = {
      type: 'daily',
      date: new Date().toLocaleDateString('zh-CN'),
      totalCommits: commits.length,
      categories,
      summary: this.generateSummary(commits, categories)
    };
    
    return report;
  }
  
  /**
   * 生成周报
   */
  generateWeeklyReport(options = {}) {
    const commits = this.getCommits({ since: '7 days ago', ...options });
    const categories = this.categorizeCommits(commits);
    
    const report = {
      type: 'weekly',
      week: this.getWeekNumber(new Date()),
      dateRange: this.getWeekRange(),
      totalCommits: commits.length,
      categories,
      summary: this.generateSummary(commits, categories)
    };
    
    return report;
  }
  
  /**
   * 生成摘要
   */
  generateSummary(commits, categories) {
    const summary = [];
    
    if (categories.feature.length > 0) {
      summary.push(`新增 ${categories.feature.length} 个功能`);
    }
    
    if (categories.fix.length > 0) {
      summary.push(`修复 ${categories.fix.length} 个问题`);
    }
    
    if (categories.docs.length > 0) {
      summary.push(`更新 ${categories.docs.length} 篇文档`);
    }
    
    const totalInsertions = commits.reduce((sum, c) => {
      const changes = this.getFileChanges(c.hash);
      return sum + changes.reduce((s, ch) => s + ch.insertions, 0);
    }, 0);
    
    const totalDeletions = commits.reduce((sum, c) => {
      const changes = this.getFileChanges(c.hash);
      return sum + changes.reduce((s, ch) => s + ch.deletions, 0);
    }, 0);
    
    summary.push(`代码变更：+${totalInsertions} -${totalDeletions}`);
    
    return summary.join(' | ');
  }
  
  /**
   * 格式化报告为文本
   */
  formatAsText(report) {
    let text = `📝 工作${report.type === 'daily' ? '日报' : '周报'}\n\n`;
    
    if (report.type === 'daily') {
      text += `📅 日期：${report.date}\n\n`;
    } else {
      text += `📅 周期：${report.week} (${report.dateRange})\n\n`;
    }
    
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    text += `📊 统计:\n`;
    text += `  总提交：${report.totalCommits} 次\n`;
    text += `  ${report.summary}\n\n`;
    
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // 功能
    if (report.categories.feature.length > 0) {
      text += `✨ 新增功能:\n`;
      report.categories.feature.forEach(c => {
        text += `  • ${c.message} (${c.author})\n`;
      });
      text += `\n`;
    }
    
    // 修复
    if (report.categories.fix.length > 0) {
      text += `🐛 问题修复:\n`;
      report.categories.fix.forEach(c => {
        text += `  • ${c.message} (${c.author})\n`;
      });
      text += `\n`;
    }
    
    // 文档
    if (report.categories.docs.length > 0) {
      text += `📄 文档更新:\n`;
      report.categories.docs.forEach(c => {
        text += `  • ${c.message} (${c.author})\n`;
      });
      text += `\n`;
    }
    
    // 其他
    if (report.categories.other.length > 0) {
      text += `🔧 其他:\n`;
      report.categories.other.forEach(c => {
        text += `  • ${c.message} (${c.author})\n`;
      });
      text += `\n`;
    }
    
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    
    return text;
  }
  
  /**
   * 保存到文件
   */
  saveReport(report, outputPath) {
    const text = this.formatAsText(report);
    fs.writeFileSync(outputPath, text, 'utf8');
    console.log(`✅ 报告已保存：${outputPath}`);
  }
  
  /**
   * 获取周数
   */
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }
  
  /**
   * 获取周范围
   */
  getWeekRange() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    
    const monday = new Date(now.setDate(diff));
    const sunday = new Date(now.setDate(diff + 6));
    
    return `${monday.toLocaleDateString('zh-CN')} - ${sunday.toLocaleDateString('zh-CN')}`;
  }
}

/**
 * 命令行使用
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📝 工作日志生成器');
    console.log('\n用法:');
    console.log('  node work-report.js daily [repo]      # 生成日报');
    console.log('  node work-report.js weekly [repo]     # 生成周报');
    console.log('  node work-report.js save <type> [repo] # 保存到文件');
    console.log('\n示例:');
    console.log('  node work-report.js daily ~/projects/my-app');
    console.log('  node work-report.js weekly');
    console.log('  node work-report.js save daily');
    process.exit(1);
  }
  
  const command = args[0];
  const repoPath = args.find(a => !['daily', 'weekly', 'save'].includes(a)) || '.';
  const generator = new WorkReportGenerator(repoPath);
  
  let report;
  
  if (command === 'daily' || command === 'weekly') {
    report = command === 'daily' 
      ? generator.generateDailyReport() 
      : generator.generateWeeklyReport();
    
    console.log(generator.formatAsText(report));
  } else if (command === 'save') {
    const type = args[1] || 'daily';
    report = type === 'daily'
      ? generator.generateDailyReport()
      : generator.generateWeeklyReport();
    
    const filename = `${type}-report-${new Date().toISOString().split('T')[0]}.md`;
    generator.saveReport(report, filename);
  }
}

module.exports = { WorkReportGenerator };
