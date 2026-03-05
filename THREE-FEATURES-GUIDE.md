# 🎯 三大核心功能使用指南

_打工人、学生党刚需神器，装了立刻能用_

---

## 1️⃣ Summarize - 文档/网页/音视频摘要神器

**功能**: 自动总结文档、网页、音视频内容

### 使用方法

**Telegram 命令:**
```
/summarize <文件路径|URL>
/summarize https://example.com/article
/summarize ~/Documents/report.pdf
```

**命令行:**
```bash
node summarize.js <文件路径|URL>
node summarize.js --batch file1.md file2.pdf
```

### 支持格式

- 📄 **文档**: txt, md, pdf, docx, json, js, ts, py
- 🌐 **网页**: html, htm, URL 链接
- 🎵 **音频**: mp3, wav, m4a (需要语音识别服务)
- 🎬 **视频**: mp4, mov, avi (需要视频处理服务)

### 输出示例

```
📄 文档摘要：report.pdf

本报告主要分析了 2026 年 Q1 的市场趋势。首先，AI 行业增长迅速...

关键点:
• 重要：AI 行业增长率达到 45%
• 关键：市场需求持续上升
• 总结：建议加大投资力度
```

---

## 2️⃣ Find Skills - 懒人专属技能导航仪

**功能**: 一句话搜索技能、安装技能，不用自己翻市场

### 使用方法

**Telegram 命令:**
```
/find <搜索关键词>
/find 天气
/find 安全检查
/install weather
/uninstall weather
```

**命令行:**
```bash
node find-skills.js <搜索关键词>
node find-skills.js --install weather
node find-skills.js --list
```

### 功能特点

- 🔍 **智能搜索**: 支持自然语言，自动匹配技能名称、描述、关键词
- 📦 **一键安装**: 找到技能后直接安装
- 🛡️ **安全检查**: 安装前自动调用 Skill Vetter 审查
- 💡 **智能推荐**: 根据搜索词推荐相关技能

### 输出示例

```
🔍 搜索：天气

✅ 已安装 1 个相关技能:
• weather (builtin) - 天气查询

💡 未找到匹配技能，试试这些热门技能:
• weather - 天气查询
• healthcheck - 安全检查
• skill-creator - 技能创建
```

---

## 3️⃣ Skill Vetter - 安全防护神器

**功能**: 装任何新技能前，自动扫描风险，帮小白避开 90% 的恶意技能坑

### 使用方法

**Telegram 命令:**
```
/vet <技能文件路径>
/vet ~/skills/my-skill.js
```

**命令行:**
```bash
node skill-vetter.js <技能文件>
node skill-vetter.js --dir ~/skills/
```

### 检查项目

- ⚠️ **危险操作**: eval(), exec(), child_process 等
- 🔐 **权限请求**: 摄像头、麦克风、位置、文件系统等
- 📦 **外部依赖**: npm 依赖安全性检查
- 🌐 **网络访问**: fetch, axios, WebSocket 等
- 💾 **文件操作**: 读写删除文件权限

### 风险等级

- ✅ **LOW**: 安全，可以使用
- ⚠️ **MEDIUM**: 中等风险，注意权限
- 🔴 **HIGH**: 高风险，谨慎使用
- ☠️ **CRITICAL**: 严重风险，强烈建议不要使用

### 输出示例

```
🛡️  技能审查报告

📁 文件：~/skills/my-skill.js
⏰ 时间：2026-03-05T09:00:00.000Z
⚠️  风险等级：LOW

━━━━━━━━━━━━━━━━━━━━

💡 建议:
✅ 技能看起来安全，可以使用
```

---

## 🎯 集成使用流程

### 场景 1: 发现并安装新技能

```
1. /find 翻译        # 搜索翻译相关技能
2. /vet <技能文件>   # 审查技能安全性
3. /install <技能名> # 安装技能
```

### 场景 2: 快速摘要文档

```
1. 发送文件给机器人
2. /summarize          # 自动摘要
3. 获取关键信息
```

### 场景 3: 安全学习新技能

```
1. 在 clawhub.com 发现技能
2. /vet <技能文件>   # 先审查
3. 查看风险报告
4. 决定是否安装
```

---

## 📊 功能对比

| 功能 | 用途 | 安全性 | 推荐度 |
|------|------|--------|--------|
| Summarize | 内容摘要 | ✅ 安全 | ⭐⭐⭐⭐⭐ |
| Find Skills | 技能搜索 | ✅ 安全 | ⭐⭐⭐⭐⭐ |
| Skill Vetter | 安全审查 | ✅ 安全 | ⭐⭐⭐⭐⭐ |

---

## 🛠️ 技术细节

### Summarize
- 文本摘要：句子提取 + 关键词匹配
- PDF 处理：pdftotext (需安装)
- DOCX 处理：mammoth 库
- 音视频：需要外部语音识别服务

### Find Skills
- 本地搜索：扫描 ~/.openclaw/skills
- 在线搜索：web_search API
- 智能匹配：分词 + 关键词匹配

### Skill Vetter
- 静态分析：正则匹配危险模式
- 依赖审查：npm audit
- 风险评估：多级风险评分系统

---

_创建时间：2026-03-05_
_版本：1.0.0_
