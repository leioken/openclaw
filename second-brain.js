#!/usr/bin/env node

/**
 * 🦐 第二大脑 - 记忆捕获和搜索工具
 * 
 * 用法:
 *   node second-brain.js capture "要记住的内容"
 *   node second-brain.js search "搜索关键词"
 *   node second-brain.js list
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(process.env.HOME, '.openclaw/workspace/memory');
const MEMORY_FILE = path.join(process.env.HOME, '.openclaw/workspace/MEMORY.md');

function ensureMemoryDir() {
    if (!fs.existsSync(MEMORY_DIR)) {
        fs.mkdirSync(MEMORY_DIR, { recursive: true });
    }
}

function getTodayFile() {
    const today = new Date().toISOString().split('T')[0];
    return path.join(MEMORY_DIR, `${today}.md`);
}

function capture(text) {
    ensureMemoryDir();
    
    const todayFile = getTodayFile();
    const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    
    let content = '';
    if (fs.existsSync(todayFile)) {
        content = fs.readFileSync(todayFile, 'utf8');
    } else {
        content = `# ${new Date().toISOString().split('T')[0]} - 记忆日志\n\n`;
    }
    
    content += `## ${timestamp}\n\n${text}\n\n`;
    fs.writeFileSync(todayFile, content, 'utf8');
    
    console.log('✅ 已捕获记忆:');
    console.log(`📍 位置：${todayFile}`);
    console.log(`📝 内容：${text.slice(0, 100)}${text.length > 100 ? '...' : ''}`);
}

function search(query) {
    const files = [MEMORY_FILE, ...getAllMemoryFiles()];
    const results = [];
    
    for (const file of files) {
        if (!fs.existsSync(file)) continue;
        
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    file,
                    line: i + 1,
                    content: lines[i].trim(),
                    context: lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join('\n')
                });
            }
        }
    }
    
    if (results.length === 0) {
        console.log('❌ 未找到相关记忆');
        return;
    }
    
    console.log(`🔍 找到 ${results.length} 条相关记忆:\n`);
    results.forEach((r, i) => {
        console.log(`${i + 1}. 📍 ${path.basename(r.file)}#${r.line}`);
        console.log(`   ${r.content}`);
        console.log();
    });
}

function list() {
    ensureMemoryDir();
    
    const files = getAllMemoryFiles();
    console.log('📚 记忆文件列表:\n');
    
    files.forEach(file => {
        const stats = fs.statSync(file);
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').length;
        const date = path.basename(file, '.md');
        
        console.log(`📄 ${date}.md`);
        console.log(`   📏 ${lines} 行 | 📦 ${stats.size} 字节`);
        console.log();
    });
}

function getAllMemoryFiles() {
    if (!fs.existsSync(MEMORY_DIR)) return [];
    
    return fs.readdirSync(MEMORY_DIR)
        .filter(f => f.endsWith('.md'))
        .map(f => path.join(MEMORY_DIR, f))
        .sort();
}

// 主程序
const command = process.argv[2];
const args = process.argv.slice(3).join(' ');

switch (command) {
    case 'capture':
        capture(args);
        break;
    case 'search':
        search(args);
        break;
    case 'list':
        list();
        break;
    default:
        console.log('🦐 第二大脑 - 记忆工具');
        console.log('\n用法:');
        console.log('  node second-brain.js capture "要记住的内容"  - 捕获记忆');
        console.log('  node second-brain.js search "关键词"         - 搜索记忆');
        console.log('  node second-brain.js list                    - 列出所有记忆文件');
}

// Telegram 自动记忆捕获
async function autoCapture(message, userId) {
    const keywords = ['记住', '记一下', '保存', '收藏', 'mark', 'remember'];
    const shouldCapture = keywords.some(k => message.toLowerCase().includes(k));
    
    if (shouldCapture) {
        const content = message.replace(/(记住 | 记一下 | 保存 | 收藏|mark|remember)/gi, '').trim();
        capture(content);
        return true;
    }
    return false;
}

module.exports = { capture, search, list, autoCapture };
