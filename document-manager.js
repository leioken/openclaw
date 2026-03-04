#!/usr/bin/env node

/**
 * 📄 文档管理和搜索工具
 * 功能：文档总结、搜索、提取答案、PDF 处理
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 支持的文档类型
const SUPPORTED_FORMATS = ['.txt', '.md', '.json', '.js', '.ts', '.py', '.pdf', '.docx'];

/**
 * 文档管理器
 */
class DocumentManager {
  constructor(rootDir) {
    this.rootDir = rootDir || process.cwd();
  }
  
  /**
   * 扫描目录中的所有文档
   */
  scanDocuments(dir = this.rootDir, options = {}) {
    const results = [];
    const maxDepth = options.maxDepth || 5;
    const extensions = options.extensions || SUPPORTED_FORMATS;
    
    const scan = (currentDir, depth = 0) => {
      if (depth > maxDepth) return;
      
      const files = fs.readdirSync(currentDir);
      
      for (const file of files) {
        const filePath = path.join(currentDir, file);
        
        try {
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            // 跳过隐藏目录和 node_modules
            if (!file.startsWith('.') && file !== 'node_modules') {
              scan(filePath, depth + 1);
            }
          } else {
            const ext = path.extname(file).toLowerCase();
            if (extensions.includes(ext)) {
              results.push({
                path: filePath,
                name: file,
                ext,
                size: stat.size,
                modified: stat.mtime
              });
            }
          }
        } catch (error) {
          // 跳过无法访问的文件
        }
      }
    };
    
    scan(dir);
    return results;
  }
  
  /**
   * 读取文档内容
   */
  readDocument(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    // PDF 和 DOCX 需要特殊处理
    if (ext === '.pdf') {
      return this.readPDF(filePath);
    }
    
    if (ext === '.docx') {
      return this.readDOCX(filePath);
    }
    
    // 文本文件直接读取
    return fs.readFileSync(filePath, 'utf8');
  }
  
  /**
   * 读取 PDF (需要 pdftotext)
   */
  readPDF(filePath) {
    try {
      const { execSync } = require('child_process');
      const text = execSync(`pdftotext "${filePath}" -`, { encoding: 'utf8' });
      return text;
    } catch (error) {
      console.warn('⚠️  PDF 读取需要安装 pdftotext，返回文件路径');
      return `[PDF 文件：${filePath}]`;
    }
  }
  
  /**
   * 读取 DOCX (需要 mammoth)
   */
  readDOCX(filePath) {
    try {
      const mammoth = require('mammoth');
      const result = mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.warn('⚠️  DOCX 读取需要安装 mammoth，返回文件路径');
      return `[DOCX 文件：${filePath}]`;
    }
  }
  
  /**
   * 搜索文档内容
   */
  searchDocuments(query, options = {}) {
    const results = [];
    const documents = this.scanDocuments();
    
    const searchQuery = query.toLowerCase();
    const contextLines = options.contextLines || 2;
    const maxResults = options.maxResults || 20;
    
    for (const doc of documents) {
      try {
        const content = this.readDocument(doc.path);
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].toLowerCase();
          
          if (line.includes(searchQuery)) {
            // 获取上下文
            const start = Math.max(0, i - contextLines);
            const end = Math.min(lines.length, i + contextLines + 1);
            const context = lines.slice(start, end).join('\n');
            
            results.push({
              file: doc.path,
              line: i + 1,
              match: lines[i].trim(),
              context,
              relevance: this.calculateRelevance(lines[i], searchQuery)
            });
            
            if (results.length >= maxResults) {
              return results;
            }
          }
        }
      } catch (error) {
        // 跳过无法读取的文件
      }
    }
    
    // 按相关性排序
    return results.sort((a, b) => b.relevance - a.relevance);
  }
  
  /**
   * 计算相关性分数
   */
  calculateRelevance(text, query) {
    let score = 0;
    const textLower = text.toLowerCase();
    
    // 完全匹配
    if (textLower.includes(query)) {
      score += 10;
    }
    
    // 关键词匹配
    const keywords = query.split(/\s+/);
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        score += 5;
      }
    }
    
    return score;
  }
  
  /**
   * 总结文档
   */
  summarizeDocument(filePath, options = {}) {
    const content = this.readDocument(filePath);
    const maxLength = options.maxLength || 500;
    
    // 简单总结：提取前 N 个字符 + 关键段落
    const paragraphs = content.split(/\n\s*\n/);
    
    const summary = {
      file: filePath,
      totalLength: content.length,
      paragraphs: paragraphs.length,
      summary: content.substring(0, maxLength) + (content.length > maxLength ? '...' : ''),
      keyPoints: this.extractKeyPoints(content)
    };
    
    return summary;
  }
  
  /**
   * 提取关键点
   */
  extractKeyPoints(content) {
    const points = [];
    const lines = content.split('\n');
    
    // 提取标题行
    const headings = lines.filter(line => 
      line.startsWith('#') || 
      line.startsWith('##') ||
      line.startsWith('**') ||
      line.match(/^\d+\./)
    );
    
    points.push(...headings.slice(0, 10).map(h => h.trim()));
    
    return points;
  }
  
  /**
   * 从文档中提取答案
   */
  extractAnswer(filePath, question) {
    const content = this.readDocument(filePath);
    
    // 简单实现：搜索包含问题关键词的段落
    const keywords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const paragraphs = content.split(/\n\s*\n/);
    
    const scoredParagraphs = paragraphs.map((para, index) => {
      const paraLower = para.toLowerCase();
      let score = 0;
      
      for (const keyword of keywords) {
        if (paraLower.includes(keyword)) {
          score += 1;
        }
      }
      
      return { index, paragraph: para.trim(), score };
    });
    
    // 返回最相关的段落
    const best = scoredParagraphs
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    
    return {
      question,
      answers: best.map(b => ({
        text: b.paragraph,
        relevance: b.score
      }))
    };
  }
}

/**
 * 命令行使用
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📄 文档管理和搜索工具');
    console.log('\n用法:');
    console.log('  node document-manager.js scan [directory]              # 扫描文档');
    console.log('  node document-manager.js search <query> [directory]    # 搜索内容');
    console.log('  node document-manager.js summarize <file>              # 总结文档');
    console.log('  node document-manager.js answer <file> "<question>"    # 提取答案');
    console.log('\n示例:');
    console.log('  node document-manager.js scan ~/projects');
    console.log('  node document-manager.js search "API documentation"');
    console.log('  node document-manager.js summarize README.md');
    console.log('  node document-manager.js answer doc.pdf "如何安装？"');
    process.exit(1);
  }
  
  const manager = new DocumentManager();
  const command = args[0];
  
  switch (command) {
    case 'scan':
      const docs = manager.scanDocuments(args[1]);
      console.log(`📁 找到 ${docs.length} 个文档:\n`);
      docs.forEach(doc => {
        console.log(`📄 ${doc.name} (${(doc.size / 1024).toFixed(1)} KB)`);
        console.log(`   ${doc.path}`);
      });
      break;
      
    case 'search':
      if (!args[1]) {
        console.error('用法：search <query>');
        process.exit(1);
      }
      const query = args[1];
      const dir = args[2];
      if (dir) manager.rootDir = dir;
      
      console.log(`🔍 搜索："${query}"\n`);
      const results = manager.searchDocuments(query);
      
      if (results.length === 0) {
        console.log('❌ 未找到匹配结果');
      } else {
        results.forEach((r, i) => {
          console.log(`${i + 1}. 📍 ${path.basename(r.file)}#${r.line}`);
          console.log(`   ${r.match.substring(0, 100)}...`);
          console.log();
        });
      }
      break;
      
    case 'summarize':
      if (!args[1]) {
        console.error('用法：summarize <file>');
        process.exit(1);
      }
      const summary = manager.summarizeDocument(args[1]);
      console.log(`📄 文档总结: ${path.basename(summary.file)}\n`);
      console.log(`总长度：${summary.totalLength} 字符`);
      console.log(`段落数：${summary.paragraphs}\n`);
      console.log('摘要:');
      console.log(summary.summary);
      console.log('\n关键点:');
      summary.keyPoints.forEach((point, i) => {
        console.log(`  ${i + 1}. ${point}`);
      });
      break;
      
    case 'answer':
      if (!args[1] || !args[2]) {
        console.error('用法：answer <file> "<question>"');
        process.exit(1);
      }
      const answer = manager.extractAnswer(args[1], args.slice(2).join(' '));
      console.log(`❓ 问题：${answer.question}\n`);
      console.log('📝 相关答案:');
      answer.answers.forEach((a, i) => {
        console.log(`\n${i + 1}. (相关性：${a.relevance})`);
        console.log(a.text.substring(0, 300) + '...');
      });
      break;
      
    default:
      console.error(`未知命令：${command}`);
      process.exit(1);
  }
}

module.exports = { DocumentManager };
