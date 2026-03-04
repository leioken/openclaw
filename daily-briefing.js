#!/usr/bin/env node

/**
 * 📰 每日简报生成器
 * 功能：天气、日历、新闻、待办事项汇总
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 每日简报生成器
 */
class DailyBriefing {
  constructor(options = {}) {
    this.location = options.location || 'Beijing';
    this.timezone = options.timezone || 'Asia/Shanghai';
  }
  
  /**
   * 生成完整简报
   */
  async generate(options = {}) {
    const briefing = {
      date: new Date().toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      }),
      weather: await this.getWeather(),
      calendar: await this.getCalendar(),
      todos: await this.getTodos(),
      news: options.news !== false ? await this.getNews() : [],
      summary: ''
    };
    
    briefing.summary = this.generateSummary(briefing);
    
    return briefing;
  }
  
  /**
   * 获取天气
   */
  async getWeather() {
    try {
      // 使用 wttr.in (无需 API key)
      const { execSync } = require('child_process');
      const weather = execSync(`curl -s "wttr.in/${this.location}?format=%c+%t+%h+%w"`, { 
        encoding: 'utf8',
        timeout: 5000
      }).trim();
      
      return {
        location: this.location,
        condition: weather,
        fetched: new Date().toISOString()
      };
    } catch (error) {
      return {
        location: this.location,
        condition: '天气数据获取失败',
        error: error.message
      };
    }
  }
  
  /**
   * 获取日历事件 (需要配置)
   */
  async getCalendar() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 示例：从配置文件读取
    const calendarFile = path.join(process.env.HOME, '.openclaw/calendar.json');
    
    try {
      if (fs.existsSync(calendarFile)) {
        const events = JSON.parse(fs.readFileSync(calendarFile, 'utf8'));
        const upcoming = events.filter(e => {
          const eventDate = new Date(e.date);
          return eventDate >= today && eventDate <= tomorrow;
        });
        
        return upcoming.slice(0, 10);
      }
    } catch (error) {
      // 忽略错误
    }
    
    return [];
  }
  
  /**
   * 获取待办事项
   */
  async getTodos() {
    const todoFile = path.join(process.env.HOME, '.openclaw/todos.json');
    
    try {
      if (fs.existsSync(todoFile)) {
        const todos = JSON.parse(fs.readFileSync(todoFile, 'utf8'));
        return todos.filter(t => !t.completed).slice(0, 10);
      }
    } catch (error) {
      // 忽略错误
    }
    
    return [];
  }
  
  /**
   * 获取新闻 (使用 RSS 或 API)
   */
  async getNews() {
    // 简单实现：返回示例新闻
    // 实际使用可以集成新闻 API
    return [
      {
        title: 'AI 技术持续快速发展',
        source: '科技日报',
        summary: '大模型技术在各个领域取得突破性进展...'
      }
    ];
  }
  
  /**
   * 生成摘要
   */
  generateSummary(briefing) {
    const parts = [];
    
    // 天气摘要
    if (briefing.weather.condition) {
      parts.push(`🌤️ 天气：${briefing.weather.condition}`);
    }
    
    // 日历摘要
    if (briefing.calendar.length > 0) {
      parts.push(`📅 今日有 ${briefing.calendar.length} 个日程`);
    }
    
    // 待办摘要
    if (briefing.todos.length > 0) {
      parts.push(`✅ 待办：${briefing.todos.length} 项未完成`);
    }
    
    return parts.join(' | ');
  }
  
  /**
   * 格式化为文本
   */
  formatAsText(briefing) {
    let text = `📰 每日简报\n\n`;
    text += `📅 ${briefing.date}\n\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (briefing.weather) {
      text += `🌤️ 天气\n`;
      text += `${briefing.weather.location}: ${briefing.weather.condition}\n\n`;
    }
    
    if (briefing.calendar.length > 0) {
      text += `📅 今日日程\n`;
      briefing.calendar.forEach(event => {
        text += `• ${event.time || '全天'} ${event.title}\n`;
      });
      text += `\n`;
    }
    
    if (briefing.todos.length > 0) {
      text += `✅ 待办事项\n`;
      briefing.todos.forEach(todo => {
        text += `• [ ] ${todo.title}\n`;
      });
      text += `\n`;
    }
    
    if (briefing.news.length > 0) {
      text += `📰 新闻摘要\n`;
      briefing.news.forEach(news => {
        text += `• ${news.title} (${news.source})\n`;
        text += `  ${news.summary}\n`;
      });
      text += `\n`;
    }
    
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `📊 摘要：${briefing.summary}\n`;
    
    return text;
  }
  
  /**
   * 发送简报到 Telegram
   */
  async sendToTelegram(botToken, chatId) {
    const briefing = await this.generate();
    const text = this.formatAsText(briefing);
    
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown'
        })
      });
      
      return response.json();
    } catch (error) {
      console.error('发送简报失败:', error.message);
      throw error;
    }
  }
}

/**
 * 命令行使用
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📰 每日简报生成器');
    console.log('\n用法:');
    console.log('  node daily-briefing.js [location]    # 生成简报');
    console.log('  node daily-briefing.js --send        # 发送到 Telegram');
    console.log('\n示例:');
    console.log('  node daily-briefing.js Beijing');
    console.log('  node daily-briefing.js --send Shanghai');
    process.exit(1);
  }
  
  const briefing = new DailyBriefing({
    location: args.find(a => !a.startsWith('--')) || 'Beijing'
  });
  
  (async () => {
    if (args.includes('--send')) {
      // 发送到 Telegram
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      
      if (!botToken || !chatId) {
        console.error('❌ 需要设置 TELEGRAM_BOT_TOKEN 和 TELEGRAM_CHAT_ID');
        process.exit(1);
      }
      
      await briefing.sendToTelegram(botToken, chatId);
      console.log('✅ 简报已发送到 Telegram');
    } else {
      // 生成并打印
      const result = await briefing.generate();
      console.log(briefing.formatAsText(result));
    }
  })().catch(console.error);
}

module.exports = { DailyBriefing };
