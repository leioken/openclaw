#!/usr/bin/env node

/**
 * 🛡️ 技能审查工具
 * 功能：安全审查、权限分析、风险评估
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

/**
 * 技能审查器
 */
class SkillVetter {
  constructor() {
    this.riskLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
  }
  
  /**
   * 审查技能文件
   */
  async vetSkill(skillPath) {
    console.log(`🛡️  审查技能：${skillPath}\n`);
    
    const report = {
      file: skillPath,
      timestamp: new Date().toISOString(),
      risks: [],
      permissions: [],
      dependencies: [],
      riskLevel: this.riskLevels.LOW,
      recommendations: []
    };
    
    // 读取技能代码
    const code = fs.readFileSync(skillPath, 'utf8');
    
    // 1. 检查危险操作
    this.checkDangerousOperations(code, report);
    
    // 2. 检查权限请求
    this.checkPermissions(code, report);
    
    // 3. 检查外部依赖
    await this.checkDependencies(skillPath, report);
    
    // 4. 检查网络请求
    this.checkNetworkAccess(code, report);
    
    // 5. 检查文件系统访问
    this.checkFileSystemAccess(code, report);
    
    // 6. 计算风险等级
    report.riskLevel = this.calculateRiskLevel(report);
    
    // 7. 生成建议
    this.generateRecommendations(report);
    
    return report;
  }
  
  /**
   * 检查危险操作
   */
  checkDangerousOperations(code, report) {
    const dangerousPatterns = [
      { pattern: /exec\s*\(/g, name: 'exec()', risk: 'high', desc: '执行系统命令' },
      { pattern: /eval\s*\(/g, name: 'eval()', risk: 'critical', desc: '执行动态代码' },
      { pattern: /Function\s*\(/g, name: 'Function()', risk: 'critical', desc: '动态函数创建' },
      { pattern: /child_process/g, name: 'child_process', risk: 'high', desc: '子进程执行' },
      { pattern: /fs\.unlink/g, name: 'fs.unlink', risk: 'high', desc: '删除文件' },
      { pattern: /fs\.rm/g, name: 'fs.rm', risk: 'high', desc: '删除文件/目录' },
      { pattern: /spawn\s*\(/g, name: 'spawn()', risk: 'high', desc: '生成进程' }
    ];
    
    for (const { pattern, name, risk, desc } of dangerousPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        report.risks.push({
          type: 'dangerous_operation',
          name,
          description: desc,
          risk,
          count: matches.length,
          line: this.findLineNumber(code, pattern)
        });
      }
    }
  }
  
  /**
   * 检查权限请求
   */
  checkPermissions(code, report) {
    const permissionPatterns = [
      { pattern: /camera/gi, name: '摄像头访问' },
      { pattern: /microphone/gi, name: '麦克风访问' },
      { pattern: /location/gi, name: '位置信息' },
      { pattern: /contacts/gi, name: '联系人访问' },
      { pattern: /calendar/gi, name: '日历访问' },
      { pattern: /email|mail/gi, name: '邮件访问' },
      { pattern: /file.*system/gi, name: '文件系统访问' },
      { pattern: /network|http|fetch/gi, name: '网络访问' }
    ];
    
    for (const { pattern, name } of permissionPatterns) {
      if (pattern.test(code)) {
        report.permissions.push({
          type: 'permission',
          name,
          required: true
        });
      }
    }
  }
  
  /**
   * 检查外部依赖
   */
  async checkDependencies(skillPath, report) {
    const dir = path.dirname(skillPath);
    const packageJson = path.join(dir, 'package.json');
    
    try {
      if (fs.existsSync(packageJson)) {
        const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
        
        // 检查依赖
        const deps = {
          ...pkg.dependencies,
          ...pkg.devDependencies
        };
        
        for (const [name, version] of Object.entries(deps)) {
          report.dependencies.push({
            name,
            version,
            audited: false
          });
        }
        
        // 运行 npm audit (可选)
        try {
          const { execSync } = require('child_process');
          const audit = execSync(`npm audit --json`, { 
            cwd: dir, 
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore']
          });
          
          const auditResult = JSON.parse(audit);
          if (auditResult.metadata && auditResult.metadata.vulnerabilities) {
            const vulns = auditResult.metadata.vulnerabilities;
            const total = Object.values(vulns).reduce((a, b) => a + b, 0);
            
            if (total > 0) {
              report.risks.push({
                type: 'vulnerabilities',
                description: `发现 ${total} 个安全漏洞`,
                risk: 'high',
                details: vulns
              });
            }
          }
        } catch (error) {
          // npm audit 可能失败，忽略
        }
      }
    } catch (error) {
      // 忽略错误
    }
  }
  
  /**
   * 检查网络访问
   */
  checkNetworkAccess(code, report) {
    const networkPatterns = [
      { pattern: /fetch\s*\(/g, name: 'fetch API' },
      { pattern: /axios\./g, name: 'axios' },
      { pattern: /http\.get|http\.post/g, name: 'http module' },
      { pattern: /WebSocket/g, name: 'WebSocket' }
    ];
    
    for (const { pattern, name } of networkPatterns) {
      if (pattern.test(code)) {
        report.permissions.push({
          type: 'network',
          name,
          required: true
        });
      }
    }
  }
  
  /**
   * 检查文件系统访问
   */
  checkFileSystemAccess(code, report) {
    const fsPatterns = [
      { pattern: /fs\.readFile/g, name: '读取文件', risk: 'medium' },
      { pattern: /fs\.writeFile/g, name: '写入文件', risk: 'high' },
      { pattern: /fs\.appendFile/g, name: '追加文件', risk: 'medium' },
      { pattern: /fs\.readdir/g, name: '读取目录', risk: 'medium' },
      { pattern: /fs\.stat/g, name: '文件统计', risk: 'low' }
    ];
    
    for (const { pattern, name, risk } of fsPatterns) {
      if (pattern.test(code)) {
        report.permissions.push({
          type: 'filesystem',
          name,
          required: true,
          risk
        });
      }
    }
  }
  
  /**
   * 查找行号
   */
  findLineNumber(code, pattern) {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return i + 1;
      }
    }
    return null;
  }
  
  /**
   * 计算风险等级
   */
  calculateRiskLevel(report) {
    const { risks } = report;
    
    if (risks.some(r => r.risk === 'critical')) {
      return this.riskLevels.CRITICAL;
    }
    
    if (risks.some(r => r.risk === 'high')) {
      return this.riskLevels.HIGH;
    }
    
    if (risks.some(r => r.risk === 'medium')) {
      return this.riskLevels.MEDIUM;
    }
    
    return this.riskLevels.LOW;
  }
  
  /**
   * 生成建议
   */
  generateRecommendations(report) {
    if (report.riskLevel === this.riskLevels.CRITICAL) {
      report.recommendations.push('❌ 强烈建议不要使用此技能');
      report.recommendations.push('🔍 需要人工审查所有危险操作');
    }
    
    if (report.riskLevel === this.riskLevels.HIGH) {
      report.recommendations.push('⚠️  高风险技能，谨慎使用');
      report.recommendations.push('📋 审查所有外部依赖');
    }
    
    if (report.dependencies.length > 10) {
      report.recommendations.push('📦 依赖较多，建议审查每个依赖');
    }
    
    if (report.risks.length === 0 && report.riskLevel === this.riskLevels.LOW) {
      report.recommendations.push('✅ 技能看起来安全，可以使用');
    }
  }
  
  /**
   * 格式化报告
   */
  formatReport(report) {
    let text = `🛡️  技能审查报告\n\n`;
    text += `📁 文件：${report.file}\n`;
    text += `⏰ 时间：${report.timestamp}\n`;
    text += `⚠️  风险等级：${report.riskLevel.toUpperCase()}\n\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (report.risks.length > 0) {
      text += `⚠️  发现的风险:\n`;
      report.risks.forEach((risk, i) => {
        text += `\n${i + 1}. ${risk.name || risk.type}`;
        text += `\n   描述：${risk.description}`;
        text += `\n   风险：${risk.risk}`;
        if (risk.line) text += `\n   位置：第 ${risk.line} 行`;
      });
      text += `\n\n`;
    }
    
    if (report.permissions.length > 0) {
      text += `🔐 请求的权限:\n`;
      report.permissions.forEach(perm => {
        text += `\n• ${perm.name} (${perm.type})`;
      });
      text += `\n\n`;
    }
    
    if (report.dependencies.length > 0) {
      text += `📦 外部依赖 (${report.dependencies.length}个):\n`;
      report.dependencies.slice(0, 10).forEach(dep => {
        text += `\n• ${dep.name}@${dep.version}`;
      });
      if (report.dependencies.length > 10) {
        text += `\n... 还有 ${report.dependencies.length - 10} 个`;
      }
      text += `\n\n`;
    }
    
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `💡 建议:\n`;
    report.recommendations.forEach(rec => {
      text += `\n${rec}`;
    });
    
    return text;
  }
}

/**
 * 命令行使用
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🛡️  技能审查工具');
    console.log('\n用法:');
    console.log('  node skill-vetter.js <skill-file.js>    # 审查技能');
    console.log('  node skill-vetter.js --dir <directory>  # 审查目录');
    console.log('\n示例:');
    console.log('  node skill-vetter.js ~/skills/my-skill.js');
    console.log('  node skill-vetter.js --dir ~/skills/');
    process.exit(1);
  }
  
  const vetter = new SkillVetter();
  
  (async () => {
    if (args.includes('--dir')) {
      const dirIndex = args.indexOf('--dir');
      const dir = args[dirIndex + 1];
      
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const report = await vetter.vetSkill(filePath);
        console.log(vetter.formatReport(report));
        console.log('\n');
      }
    } else {
      const report = await vetter.vetSkill(args[0]);
      console.log(vetter.formatReport(report));
    }
  })().catch(console.error);
}

module.exports = { SkillVetter };
