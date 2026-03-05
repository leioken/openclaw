#!/usr/bin/env node

/**
 * 🔍 Find Skills - 懒人专属技能导航仪
 * 功能：一句话搜索技能、安装技能，不用自己翻市场
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class FindSkills {
  constructor() {
    this.skillSources = [
      {
        name: 'OpenClaw 官方技能',
        url: 'https://clawhub.com',
        type: 'official'
      },
      {
        name: 'GitHub 技能仓库',
        url: 'https://github.com/topics/openclaw-skill',
        type: 'community'
      },
      {
        name: '社区技能市场',
        url: 'https://docs.openclaw.ai/skills',
        type: 'docs'
      }
    ];
    
    this.localSkillsDir = path.join(process.env.HOME, '.openclaw/skills');
  }

  /**
   * 搜索技能 - 支持自然语言
   */
  async findSkills(query, options = {}) {
    const result = {
      query,
      timestamp: new Date().toISOString(),
      localSkills: [],
      onlineSkills: [],
      recommendations: []
    };

    try {
      // 1. 搜索本地已安装技能
      result.localSkills = this.searchLocalSkills(query);

      // 2. 搜索在线技能 (通过 web_search)
      result.onlineSkills = await this.searchOnlineSkills(query, options);

      // 3. 生成推荐
      result.recommendations = this.generateRecommendations(query, result);

      return result;

    } catch (error) {
      return {
        error: error.message,
        query,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 搜索本地技能
   */
  searchLocalSkills(query) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    // 检查本地技能目录
    if (fs.existsSync(this.localSkillsDir)) {
      const skills = fs.readdirSync(this.localSkillsDir);
      
      for (const skill of skills) {
        const skillPath = path.join(this.localSkillsDir, skill);
        const stat = fs.statSync(skillPath);
        
        if (stat.isDirectory()) {
          const skillInfo = this.getSkillInfo(skillPath);
          
          // 匹配技能名称、描述、关键词
          if (this.matchesQuery(skillInfo, queryLower)) {
            results.push({
              name: skill,
              path: skillPath,
              ...skillInfo,
              installed: true,
              source: 'local'
            });
          }
        }
      }
    }

    // 检查内置技能
    const builtInSkills = this.getBuiltInSkills();
    for (const skill of builtInSkills) {
      if (this.matchesQuery(skill, queryLower)) {
        results.push({
          ...skill,
          installed: true,
          source: 'builtin'
        });
      }
    }

    return results;
  }

  /**
   * 搜索在线技能
   */
  async searchOnlineSkills(query, options = {}) {
    // 这里会调用 OpenClaw 的 web_search 工具
    // 实际使用时通过 agent 调用
    const searchQueries = [
      `openclaw skill ${query}`,
      `openclaw 技能 ${query}`,
      `clawhub ${query}`
    ];

    return {
      message: '正在搜索在线技能...',
      queries: searchQueries,
      note: '使用 web_search 工具搜索 clawhub.com 和 GitHub'
    };
  }

  /**
   * 获取技能信息
   */
  getSkillInfo(skillPath) {
    const info = {
      name: path.basename(skillPath),
      description: '',
      version: '',
      author: '',
      keywords: []
    };

    // 读取 SKILL.md
    const skillMdPath = path.join(skillPath, 'SKILL.md');
    if (fs.existsSync(skillMdPath)) {
      const content = fs.readFileSync(skillMdPath, 'utf8');
      info.description = this.extractDescription(content);
    }

    // 读取 package.json
    const packagePath = path.join(skillPath, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      info.version = pkg.version || '';
      info.author = pkg.author || '';
      info.keywords = pkg.keywords || [];
    }

    return info;
  }

  /**
   * 获取内置技能列表
   */
  getBuiltInSkills() {
    const builtInDir = '/opt/homebrew/lib/node_modules/openclaw/skills';
    const skills = [];

    if (fs.existsSync(builtInDir)) {
      const items = fs.readdirSync(builtInDir);
      
      for (const item of items) {
        const itemPath = path.join(builtInDir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          const skillInfo = this.getSkillInfo(itemPath);
          skills.push({
            name: item,
            path: itemPath,
            ...skillInfo
          });
        }
      }
    }

    return skills;
  }

  /**
   * 从 SKILL.md 提取描述
   */
  extractDescription(content) {
    // 提取 <description> 标签内容
    const descMatch = content.match(/<description>([\s\S]*?)<\/description>/);
    if (descMatch) {
      return descMatch[1].trim();
    }

    // 或者提取第一个段落
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.trim().length > 20 && !line.startsWith('#')) {
        return line.trim();
      }
    }

    return '';
  }

  /**
   * 匹配查询
   */
  matchesQuery(skillInfo, queryLower) {
    const searchText = [
      skillInfo.name,
      skillInfo.description,
      ...(skillInfo.keywords || [])
    ].join(' ').toLowerCase();

    // 分词匹配
    const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 1);
    
    return queryTerms.some(term => searchText.includes(term));
  }

  /**
   * 生成推荐
   */
  generateRecommendations(query, searchResult) {
    const recommendations = [];

    // 如果找到本地技能，推荐相关功能
    if (searchResult.localSkills.length > 0) {
      recommendations.push({
        type: 'installed',
        message: `✅ 已安装 ${searchResult.localSkills.length} 个相关技能`,
        skills: searchResult.localSkills.map(s => s.name)
      });
    }

    // 如果没找到，推荐热门技能
    if (searchResult.localSkills.length === 0) {
      recommendations.push({
        type: 'popular',
        message: '💡 未找到匹配技能，试试这些热门技能:',
        skills: [
          'weather - 天气查询',
          'healthcheck - 安全检查',
          'skill-creator - 技能创建'
        ]
      });
    }

    return recommendations;
  }

  /**
   * 安装技能
   */
  async installSkill(skillName, options = {}) {
    const result = {
      skill: skillName,
      timestamp: new Date().toISOString(),
      steps: [],
      status: 'pending'
    };

    try {
      // 1. 检查是否已安装
      const localSkills = this.searchLocalSkills(skillName);
      if (localSkills.length > 0) {
        result.status = 'already_installed';
        result.message = `✅ 技能 ${skillName} 已安装`;
        return result;
      }

      // 2. 下载技能 (从 clawhub 或 GitHub)
      result.steps.push({ step: 1, action: 'downloading', status: 'running' });
      
      // 实际安装需要通过 openclaw 命令
      result.steps[0].status = 'completed';
      result.steps.push({
        step: 2,
        action: 'install_command',
        command: `openclaw skills install ${skillName}`,
        note: '请使用上述命令安装技能'
      });

      result.status = 'ready_to_install';
      result.message = `📦 准备安装技能：${skillName}`;

      return result;

    } catch (error) {
      result.status = 'error';
      result.error = error.message;
      return result;
    }
  }

  /**
   * 列出所有可用技能
   */
  listAllSkills() {
    const result = {
      timestamp: new Date().toISOString(),
      builtin: [],
      installed: [],
      available: []
    };

    // 内置技能
    result.builtin = this.getBuiltInSkills().map(s => ({
      name: s.name,
      description: s.description,
      source: 'builtin'
    }));

    // 已安装技能
    if (fs.existsSync(this.localSkillsDir)) {
      const skills = fs.readdirSync(this.localSkillsDir);
      result.installed = skills.map(name => ({
        name,
        source: 'installed'
      }));
    }

    return result;
  }

  /**
   * 卸载技能
   */
  async uninstallSkill(skillName) {
    const skillPath = path.join(this.localSkillsDir, skillName);
    
    if (!fs.existsSync(skillPath)) {
      return {
        status: 'not_found',
        message: `❌ 技能 ${skillName} 未安装`
      };
    }

    // 实际卸载需要通过 openclaw 命令
    return {
      status: 'ready_to_uninstall',
      message: `🗑️ 准备卸载技能：${skillName}`,
      command: `openclaw skills uninstall ${skillName}`,
      path: skillPath
    };
  }
}

// CLI 支持
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🔍 Find Skills - 懒人专属技能导航仪');
    console.log('');
    console.log('用法:');
    console.log('  node find-skills.js <搜索关键词>');
    console.log('  node find-skills.js --install <技能名>');
    console.log('  node find-skills.js --uninstall <技能名>');
    console.log('  node find-skills.js --list');
    console.log('');
    console.log('示例:');
    console.log('  node find-skills.js 天气');
    console.log('  node find-skills.js --install weather');
    console.log('  node find-skills.js --list');
    process.exit(0);
  }

  const finder = new FindSkills();

  if (args[0] === '--list') {
    const result = finder.listAllSkills();
    console.log(JSON.stringify(result, null, 2));
  } else if (args[0] === '--install') {
    finder.installSkill(args[1]).then(result => {
      console.log(JSON.stringify(result, null, 2));
    });
  } else if (args[0] === '--uninstall') {
    finder.uninstallSkill(args[1]).then(result => {
      console.log(JSON.stringify(result, null, 2));
    });
  } else {
    finder.findSkills(args.join(' ')).then(result => {
      console.log(JSON.stringify(result, null, 2));
    });
  }
}

module.exports = FindSkills;
