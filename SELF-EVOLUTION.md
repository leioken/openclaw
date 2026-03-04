# 🦐 麦克虾 - 自进化系统

_最后更新：2026-03-03_

---

## 🎯 目标

实现**自进化、自完善、自升级**能力，让麦克虾能够：

1. 🧠 **自学习** - 从对话中持续学习和改进
2. 🛠️ **自修复** - 自动检测和修复问题
3. ⚡ **自优化** - 根据性能数据优化自身
4. 🚀 **自升级** - 学习新功能和适配新 API

---

## 📦 组件

### 1. SelfLearning (自学习系统)

**功能：**
- 记录所有对话和决策
- 分析成功和失败案例
- 提取模式和建议
- 预测最佳响应

**文件：** `self-evolution.js` - `SelfLearning` 类

**使用：**
```javascript
const { SelfLearning } = require('./self-evolution');
const learning = new SelfLearning();

// 学习对话
learning.recordConversation('你好', '你好，老板！', 'success');

// 获取统计
const stats = learning.getStats();
console.log(stats);
```

---

### 2. SelfRepair (自修复机制)

**功能：**
- 监控 Telegram Bot 状态
- 检查 Gateway 运行状态
- 自动重启失败的服务
- 记录问题和修复历史

**文件：** `self-evolution.js` - `SelfRepair` 类

**使用：**
```javascript
const { SelfRepair } = require('./self-evolution');
const repair = new SelfRepair();

// 全面检查
const results = await repair.fullCheck();

// 检查 Telegram Bot
const botStatus = await repair.checkTelegramBot();

// 修复 Telegram Bot
await repair.repairTelegramBot();
```

---

### 3. SelfOptimization (自我优化引擎)

**功能：**
- 记录响应时间
- 统计错误类型
- 分析性能指标
- 提供优化建议

**文件：** `self-evolution.js` - `SelfOptimization` 类

**使用：**
```javascript
const { SelfOptimization } = require('./self-evolution');
const optimization = new SelfOptimization();

// 记录响应时间
optimization.recordResponseTime(500); // 500ms

// 记录错误
optimization.recordError('timeout');

// 分析性能
const performance = optimization.analyzePerformance();

// 执行优化
await optimization.optimize();
```

---

### 4. SelfUpgrade (自我升级框架)

**功能：**
- 检查 OpenClaw 更新
- 学习新技能
- 适配新 API
- 创建适配器模板

**文件：** `self-evolution.js` - `SelfUpgrade` 类

**使用：**
```javascript
const { SelfUpgrade } = require('./self-evolution');
const upgrade = new SelfUpgrade();

// 检查更新
const update = await upgrade.checkOpenClawUpdate();

// 学习新技能
await upgrade.learnSkill('weather', 'https://example.com');

// 适配新 API
await upgrade.adaptNewAPI('new-api', 'docs');
```

---

## 🚀 使用方式

### 1. 全面自检

```bash
node self-evolution.js check
```

**输出：**
```
🦐 麦克虾自进化系统 - 全面自检

🧠 自我学习统计：
   总对话数：100
   成功率：95.00%
   识别模式：25 个

🛠️ 自我修复检查：
   Telegram Bot：✅ 运行中
   Gateway：✅ 运行中

⚡ 自我优化分析：
   平均响应时间：450ms
   总请求数：100

   优化建议：
   ✅ 性能表现良好，无需优化

🚀 自我升级状态：
   当前版本：2026.3.1
```

---

### 2. 学习对话

```bash
node self-evolution.js learn "输入内容" "输出内容" [success|failure]
```

**示例：**
```bash
# 成功的对话
node self-evolution.js learn "你好" "你好，老板！" success

# 失败的对话
node self-evolution.js learn "天气" "❌ 错误" failure
```

---

### 3. 执行优化

```bash
node self-evolution.js optimize
```

---

### 4. 自动守护进程

```bash
bash evolution-daemon.sh
```

**功能：**
- 每 10 分钟运行一次自检
- 自动修复问题
- 执行优化
- 记录日志到 `~/.openclaw/evolution/daemon.log`

**后台运行：**
```bash
nohup bash evolution-daemon.sh > /dev/null 2>&1 &
```

---

## 📊 数据存储

所有自进化数据存储在 `~/.openclaw/evolution/` 目录：

```
~/.openclaw/evolution/
├── evolution-memory.json    # 总体记忆
├── learning.json            # 学习数据
├── metrics.json             # 性能指标
├── issues.json              # 问题和修复历史
├── daemon.log              # 守护进程日志
├── skill-*.md              # 技能学习记录
└── adapter-*.js            # API 适配器
```

---

## 🔧 集成到主系统

### 在 Telegram 集成中使用

```javascript
const { SelfEvolution } = require('./self-evolution');

const evolution = new SelfEvolution();

// 处理完消息后学习
async function handleMessage(update) {
  const input = update.message.text;
  const output = await processMessage(input);
  
  // 学习成功的对话
  evolution.learn(input, output, 'success');
}

// 定期自检
setInterval(async () => {
  await evolution.selfCheck();
}, 10 * 60 * 1000); // 10 分钟
```

---

## 📈 性能指标

自进化系统跟踪以下指标：

- 📊 总对话数
- ✅ 成功率
- 🎯 识别模式数
- ⏱️ 平均响应时间
- ❌ 错误类型统计
- 🛠️ 自动修复次数
- ⚡ 优化执行次数
- 🚀 升级检查次数

---

## 🎯 未来计划

- [ ] 集成到 Telegram Bot 自动学习
- [ ] 添加机器学习模型进行模式识别
- [ ] 实现自动化测试和验证
- [ ] 支持 GitHub 自动升级
- [ ] 添加 Web 界面查看统计数据
- [ ] 实现跨平台同步学习数据

---

**🦐 麦克虾 - 持续进化，越来越聪明！**