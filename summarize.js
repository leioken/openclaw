#!/usr/bin/env node

/**
 * 📝 Summarize - 文档/网页/音视频摘要神器
 * 功能：自动总结文档、网页、音视频内容，打工人学生党刚需
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class Summarize {
  constructor() {
    this.supportedFormats = {
      documents: ['.txt', '.md', '.pdf', '.docx', '.json', '.js', '.ts', '.py'],
      web: ['.html', '.htm'],
      audio: ['.mp3', '.wav', '.m4a'],
      video: ['.mp4', '.mov', '.avi']
    };
  }

  /**
   * 智能摘要 - 自动识别类型并总结
   */
  async summarize(source, options = {}) {
    const result = {
      source,
      type: this.detectType(source),
      summary: '',
      keyPoints: [],
      metadata: {},
      timestamp: new Date().toISOString()
    };

    try {
      // 1. 检测来源类型
      const type = this.detectType(source);
      result.type = type;

      // 2. 根据类型调用不同摘要方法
      switch (type) {
        case 'document':
          result.summary = await this.summarizeDocument(source, options);
          break;
        case 'web':
          result.summary = await this.summarizeWeb(source, options);
          break;
        case 'audio':
          result.summary = await this.summarizeAudio(source, options);
          break;
        case 'video':
          result.summary = await this.summarizeVideo(source, options);
          break;
        case 'url':
          result.summary = await this.summarizeURL(source, options);
          break;
        default:
          result.summary = '⚠️ 不支持的文件类型或格式';
      }

      // 3. 提取关键点
      result.keyPoints = this.extractKeyPoints(result.summary);

      return result;

    } catch (error) {
      return {
        error: error.message,
        source,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 检测内容类型
   */
  detectType(source) {
    // URL 检测
    if (source.startsWith('http://') || source.startsWith('https://')) {
      return 'url';
    }

    // 文件路径检测
    if (fs.existsSync(source)) {
      const ext = path.extname(source).toLowerCase();
      
      if (this.supportedFormats.documents.includes(ext)) {
        return 'document';
      }
      if (this.supportedFormats.web.includes(ext)) {
        return 'web';
      }
      if (this.supportedFormats.audio.includes(ext)) {
        return 'audio';
      }
      if (this.supportedFormats.video.includes(ext)) {
        return 'video';
      }
    }

    return 'unknown';
  }

  /**
   * 文档摘要
   */
  async summarizeDocument(filePath, options = {}) {
    const ext = path.extname(filePath).toLowerCase();
    const content = this.readDocument(filePath);
    
    const maxLength = options.maxLength || 500;
    const summary = this.generateTextSummary(content, maxLength);
    
    return `📄 **文档摘要**: ${path.basename(filePath)}\n\n${summary}`;
  }

  /**
   * 网页摘要
   */
  async summarizeWeb(filePath, options = {}) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 提取 HTML 中的文本内容
    const text = this.extractTextFromHTML(content);
    const summary = this.generateTextSummary(text, 500);
    
    return `🌐 **网页摘要**\n\n${summary}`;
  }

  /**
   * URL 摘要 (使用 web_fetch)
   */
  async summarizeURL(url, options = {}) {
    // 这里会调用 OpenClaw 的 web_fetch 工具
    // 实际使用时通过 agent 调用
    return `🔗 **URL 摘要**: ${url}\n\n正在获取网页内容... (使用 web_fetch 工具)`;
  }

  /**
   * 音频摘要 (需要语音识别)
   */
  async summarizeAudio(filePath, options = {}) {
    const fileSize = fs.statSync(filePath).size / (1024 * 1024);
    
    return `🎵 **音频摘要**: ${path.basename(filePath)}\n` +
           `大小：${fileSize.toFixed(2)} MB\n` +
           `⚠️  需要语音识别服务 (Whisper/Google Speech-to-Text)\n` +
           `建议：使用在线转录服务后，再对文本进行摘要`;
  }

  /**
   * 视频摘要 (需要语音识别 + 关键帧提取)
   */
  async summarizeVideo(filePath, options = {}) {
    const fileSize = fs.statSync(filePath).size / (1024 * 1024);
    
    return `🎬 **视频摘要**: ${path.basename(filePath)}\n` +
           `大小：${fileSize.toFixed(2)} MB\n` +
           `⚠️  需要视频处理服务 (语音识别 + 关键帧提取)\n` +
           `建议：使用在线转录服务后，再对文本进行摘要`;
  }

  /**
   * 读取文档内容
   */
  readDocument(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.pdf') {
      return this.readPDF(filePath);
    }
    if (ext === '.docx') {
      return this.readDOCX(filePath);
    }
    
    return fs.readFileSync(filePath, 'utf8');
  }

  /**
   * 读取 PDF
   */
  readPDF(filePath) {
    try {
      const { execSync } = require('child_process');
      return execSync(`pdftotext "${filePath}" -`, { encoding: 'utf8' });
    } catch (error) {
      return `[PDF 文件：${filePath}] (需要安装 pdftotext)`;
    }
  }

  /**
   * 读取 DOCX
   */
  readDOCX(filePath) {
    try {
      const mammoth = require('mammoth');
      const result = mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      return `[DOCX 文件：${filePath}] (需要安装 mammoth)`;
    }
  }

  /**
   * 从 HTML 提取文本
   */
  extractTextFromHTML(html) {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 生成文本摘要
   */
  generateTextSummary(text, maxLength = 500) {
    // 简单实现：提取关键句子
    const sentences = text.split(/[.!?。！？]/).filter(s => s.trim().length > 20);
    
    if (sentences.length === 0) {
      return '内容过短，无法生成摘要';
    }

    // 取前几句作为摘要
    let summary = '';
    for (const sentence of sentences) {
      if (summary.length + sentence.length > maxLength) {
        break;
      }
      summary += sentence.trim() + '. ';
    }

    return summary || text.substring(0, maxLength) + '...';
  }

  /**
   * 提取关键点
   */
  extractKeyPoints(summary) {
    // 简单实现：提取包含关键词的句子
    const keywords = ['重要', '关键', '主要', '首先', '其次', '最后', '总结', '因此', '但是', '然而'];
    const sentences = summary.split(/[.!?。！？]/);
    
    const keyPoints = sentences.filter(s => {
      const trimmed = s.trim();
      return trimmed.length > 10 && keywords.some(kw => trimmed.includes(kw));
    }).slice(0, 5);

    return keyPoints.map(s => s.trim());
  }

  /**
   * 批量摘要
   */
  async summarizeBatch(files, options = {}) {
    const results = [];
    
    for (const file of files) {
      try {
        const result = await this.summarize(file, options);
        results.push(result);
      } catch (error) {
        results.push({
          source: file,
          error: error.message
        });
      }
    }

    return results;
  }
}

// CLI 支持
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📝 Summarize - 文档/网页/音视频摘要神器');
    console.log('');
    console.log('用法:');
    console.log('  node summarize.js <文件路径|URL>');
    console.log('  node summarize.js --batch <文件1> <文件2> ...');
    console.log('');
    console.log('支持的格式:');
    console.log('  文档：txt, md, pdf, docx, json, js, ts, py');
    console.log('  网页：html, htm, URL');
    console.log('  音频：mp3, wav, m4a (需要语音识别)');
    console.log('  视频：mp4, mov, avi (需要视频处理)');
    process.exit(0);
  }

  const summarizer = new Summarize();
  
  if (args[0] === '--batch') {
    const files = args.slice(1);
    summarizer.summarizeBatch(files).then(results => {
      console.log(JSON.stringify(results, null, 2));
    });
  } else {
    summarizer.summarize(args[0]).then(result => {
      console.log(JSON.stringify(result, null, 2));
    });
  }
}

module.exports = Summarize;
