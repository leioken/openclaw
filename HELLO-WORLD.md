# Hello World 模块使用指南

## 快速开始

```javascript
const { hello, helloWithTime, helloBatch } = require('./hello-world');
```

## API 参考

### `hello(options)`

生成基础问候消息。

**参数：**
- `options.name` (string, 可选): 问候对象名称，默认 'World'
- `options.language` (string, 可选): 语言代码，支持 'zh', 'en', 'jp', 'es'，默认 'zh'
- `options.customMessage` (string, 可选): 自定义消息内容

**示例：**
```javascript
hello()                              // "你好，World！👋"
hello({ name: '老板' })              // "你好，老板！👋"
hello({ language: 'en' })            // "Hello, World! 👋"
hello({ customMessage: 'Hi!' })      // "Hi!"
```

### `helloWithTime(options)`

生成带时间段的智能问候（早上/下午/晚上）。

**参数：**
- `options.name` (string, 可选): 问候对象名称
- `options.language` (string, 可选): 语言代码，默认 'zh'

**示例：**
```javascript
helloWithTime({ name: '老板' })      // "下午好，老板！👋" (根据当前时间)
```

### `helloBatch(names, options)`

批量生成问候消息。

**参数：**
- `names` (string[]): 名称列表
- `options` (object, 可选): 传递给 hello() 的选项

**示例：**
```javascript
helloBatch(['张三', '李四', '王五'])
// ["你好，张三！👋", "你好，李四！👋", "你好，王五！👋"]
```

## 运行测试

```bash
node test-hello-world.js
```

## 版本

v1.0.0 - 初始版本
