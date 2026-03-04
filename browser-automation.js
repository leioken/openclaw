#!/usr/bin/env node

/**
 * 🌐 浏览器自动化工具 (Playwright)
 * 功能：网页导航、表单填写、数据抓取、截图
 */

const { chromium } = require('playwright');

/**
 * 浏览器会话管理
 */
class BrowserSession {
  constructor(options = {}) {
    this.browser = null;
    this.page = null;
    this.options = {
      headless: options.headless !== false,
      viewport: { width: 1280, height: 720 },
      ...options
    };
  }
  
  /**
   * 启动浏览器
   */
  async launch() {
    this.browser = await chromium.launch(this.options);
    this.page = await this.browser.newPage();
    console.log('🌐 浏览器已启动');
    return this;
  }
  
  /**
   * 关闭浏览器
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🌐 浏览器已关闭');
    }
  }
  
  /**
   * 导航到 URL
   */
  async navigate(url, options = {}) {
    console.log(`🔗 导航到：${url}`);
    await this.page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
      ...options
    });
    return this;
  }
  
  /**
   * 填写表单
   */
  async fillForm(selector, value) {
    console.log(`✏️  填写表单：${selector}`);
    await this.page.fill(selector, value);
    return this;
  }
  
  /**
   * 点击元素
   */
  async click(selector) {
    console.log(`👆 点击：${selector}`);
    await this.page.click(selector);
    return this;
  }
  
  /**
   * 截取屏幕
   */
  async screenshot(path) {
    const filePath = path || `screenshot-${Date.now()}.png`;
    console.log(`📸 截图：${filePath}`);
    await this.page.screenshot({ path: filePath, fullPage: true });
    return filePath;
  }
  
  /**
   * 获取页面内容
   */
  async getContent() {
    return await this.page.content();
  }
  
  /**
   * 获取页面文本
   */
  async getText() {
    return await this.page.evaluate(() => document.body.innerText);
  }
  
  /**
   * 提取数据 (CSS 选择器)
   */
  async extractData(selector, options = {}) {
    const elements = await this.page.$$(selector);
    const results = [];
    
    for (const element of elements) {
      const data = {};
      
      if (options.text !== false) {
        data.text = await element.textContent();
      }
      
      if (options.href) {
        data.href = await element.getAttribute('href');
      }
      
      if (options.src) {
        data.src = await element.getAttribute('src');
      }
      
      if (options.attributes) {
        for (const attr of options.attributes) {
          data[attr] = await element.getAttribute(attr);
        }
      }
      
      results.push(data);
    }
    
    return results;
  }
  
  /**
   * 等待元素出现
   */
  async waitFor(selector, options = {}) {
    console.log(`⏳ 等待：${selector}`);
    await this.page.waitForSelector(selector, {
      timeout: 10000,
      ...options
    });
    return this;
  }
  
  /**
   * 执行 JavaScript
   */
  async evaluate(fn, ...args) {
    return await this.page.evaluate(fn, ...args);
  }
  
  /**
   * 下载文件
   */
  async downloadFile(url, savePath) {
    console.log(`⬇️  下载：${url}`);
    
    const download = await this.page.waitForEvent('download', {
      predicate: (download) => {
        const suggestedFilename = download.suggestedFilename();
        return suggestedFilename;
      }
    });
    
    await download.saveAs(savePath);
    console.log(`✅ 已保存到：${savePath}`);
    
    return savePath;
  }
}

/**
 * 网页抓取工具
 */
class WebScraper {
  constructor() {
    this.session = new BrowserSession();
  }
  
  /**
   * 抓取网页数据
   */
  async scrape(url, selectors) {
    await this.session.launch();
    
    try {
      await this.session.navigate(url);
      
      const results = {};
      
      for (const [key, selector] of Object.entries(selectors)) {
        results[key] = await this.session.extractData(selector, {
          text: true,
          href: true
        });
      }
      
      return results;
    } finally {
      await this.session.close();
    }
  }
  
  /**
   * 监控价格变化
   */
  async monitorPrice(url, selector) {
    await this.session.launch();
    
    try {
      await this.session.navigate(url);
      const priceElements = await this.session.extractData(selector, { text: true });
      
      return {
        url,
        timestamp: new Date().toISOString(),
        prices: priceElements.map(e => e.text)
      };
    } finally {
      await this.session.close();
    }
  }
  
  /**
   * 自动填写并提交表单
   */
  async submitForm(url, formData, submitSelector = 'button[type="submit"]') {
    await this.session.launch();
    
    try {
      await this.session.navigate(url);
      
      // 填写表单
      for (const [selector, value] of Object.entries(formData)) {
        await this.session.fillForm(selector, value);
      }
      
      // 提交
      await this.session.click(submitSelector);
      
      // 等待跳转
      await this.session.waitFor('body');
      
      // 获取结果
      const resultUrl = this.session.page.url();
      const content = await this.session.getText();
      
      return {
        success: true,
        url: resultUrl,
        content: content.substring(0, 500)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    } finally {
      await this.session.close();
    }
  }
}

/**
 * 命令行使用
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🌐 浏览器自动化工具 (Playwright)');
    console.log('\n用法:');
    console.log('  node browser-automation.js screenshot <url> [output.png]  # 截图');
    console.log('  node browser-automation.js extract <url> <selector>       # 提取数据');
    console.log('  node browser-automation.js scrape <url>                   # 抓取内容');
    console.log('\n示例:');
    console.log('  node browser-automation.js screenshot https://example.com');
    console.log('  node browser-automation.js extract https://example.com "h1"');
    console.log('\n安装:');
    console.log('  npm install playwright');
    console.log('  npx playwright install chromium');
    process.exit(1);
  }
  
  const command = args[0];
  
  (async () => {
    const scraper = new WebScraper();
    
    switch (command) {
      case 'screenshot':
        if (!args[1]) {
          console.error('用法：screenshot <url> [output.png]');
          process.exit(1);
        }
        const session1 = new BrowserSession();
        await session1.launch();
        await session1.navigate(args[1]);
        const path = await session1.screenshot(args[2]);
        console.log(`✅ 截图已保存：${path}`);
        await session1.close();
        break;
        
      case 'extract':
        if (!args[1] || !args[2]) {
          console.error('用法：extract <url> <selector>');
          process.exit(1);
        }
        const session2 = new BrowserSession();
        await session2.launch();
        await session2.navigate(args[1]);
        const data = await session2.extractData(args[2], { text: true });
        console.log('📊 提取结果:');
        data.forEach((item, i) => {
          console.log(`${i + 1}. ${item.text?.trim()}`);
        });
        await session2.close();
        break;
        
      case 'scrape':
        if (!args[1]) {
          console.error('用法：scrape <url>');
          process.exit(1);
        }
        const session3 = new BrowserSession();
        await session3.launch();
        await session3.navigate(args[1]);
        const content = await session3.getText();
        console.log('📄 页面内容:\n');
        console.log(content.substring(0, 2000));
        await session3.close();
        break;
        
      default:
        console.error(`未知命令：${command}`);
        process.exit(1);
    }
  })().catch(console.error);
}

module.exports = { BrowserSession, WebScraper };
