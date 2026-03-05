#!/usr/bin/env node

/**
 * 🧪 测试代码审查委员会
 */

const { CodeReviewBoard } = require('./code-review-board');
const fs = require('fs');
const path = require('path');

// 创建一个测试文件
const testCode = `
// 测试代码 - 包含多种问题
const express = require('express');
const app = express();

// 硬编码密码（安全问题）
const PASSWORD = "admin123";

// SQL 注入风险
app.get('/user', (req, res) => {
  const userId = req.query.id;
  const sql = "SELECT * FROM users WHERE id = " + userId; // ❌ 危险！
  db.query(sql);
});

// 函数过长（代码质量问题）
function processData(data) {
  let result = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].valid) {
      if (data[i].type === 'A') {
        if (data[i].value > 100) {
          result.push(data[i].value * 2);
        }
      } else if (data[i].type === 'B') {
        result.push(data[i].value / 2);
      }
    }
  }
  return result;
}

// 缺少错误处理
app.post('/save', (req, res) => {
  const file = req.body.file;
  const content = req.body.content;
  fs.writeFileSync(file, content); // ❌ 没有 try-catch
  res.send('OK');
});

// 缺少注释和文档
function calc(a, b, c) {
  return (a + b) * c / 100;
}

// 性能问题 - O(n²)
function findDuplicates(arr) {
  const duplicates = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) {
        duplicates.push(arr[i]);
      }
    }
  }
  return duplicates;
}

// 边界条件未处理
function divide(a, b) {
  return a / b; // ❌ 如果 b=0 怎么办？
}

module.exports = { processData, findDuplicates, divide };
`;

// 写入测试文件
const testFilePath = path.join(__dirname, 'test-sample.js');
fs.writeFileSync(testFilePath, testCode, 'utf8');

console.log('🧪 开始测试代码审查委员会...\n');

const board = new CodeReviewBoard();

board.reviewCode(testFilePath)
  .then(report => {
    console.log('\n' + board.formatReport(report));
    
    // 保存报告
    const reportPath = path.join(__dirname, 'test-review-report.md');
    board.saveReport(report, reportPath);
    
    // 清理测试文件
    fs.unlinkSync(testFilePath);
    
    console.log('\n✅ 测试完成！');
    console.log(`📄 报告已保存：${reportPath}`);
  })
  .catch(error => {
    console.error('❌ 测试失败:', error.message);
    fs.unlinkSync(testFilePath);
    process.exit(1);
  });
