/**
 * Hello World 模块测试
 */

const { hello, helloWithTime, helloBatch } = require('./hello-world');

console.log('🧪 运行 Hello World 测试...\n');

// 测试 1: 基础问候
console.log('测试 1: 基础问候');
const test1 = hello();
console.log(`  结果：${test1}`);
console.log(`  预期：包含 "你好" 和 "World"`);
console.log(`  状态：${test1.includes('你好') && test1.includes('World') ? '✅ 通过' : '❌ 失败'}\n`);

// 测试 2: 自定义名称
console.log('测试 2: 自定义名称');
const test2 = hello({ name: '老板' });
console.log(`  结果：${test2}`);
console.log(`  预期：包含 "老板"`);
console.log(`  状态：${test2.includes('老板') ? '✅ 通过' : '❌ 失败'}\n`);

// 测试 3: 英文问候
console.log('测试 3: 英文问候');
const test3 = hello({ name: 'World', language: 'en' });
console.log(`  结果：${test3}`);
console.log(`  预期：包含 "Hello"`);
console.log(`  状态：${test3.includes('Hello') ? '✅ 通过' : '❌ 失败'}\n`);

// 测试 4: 自定义消息
console.log('测试 4: 自定义消息');
const test4 = hello({ customMessage: '自定义问候' });
console.log(`  结果：${test4}`);
console.log(`  预期：等于 "自定义问候"`);
console.log(`  状态：${test4 === '自定义问候' ? '✅ 通过' : '❌ 失败'}\n`);

// 测试 5: 带时间的问候
console.log('测试 5: 带时间的问候');
const test5 = helloWithTime({ name: '老板' });
console.log(`  结果：${test5}`);
console.log(`  预期：包含时间问候词和 "老板"`);
console.log(`  状态：${test5.includes('老板') ? '✅ 通过' : '❌ 失败'}\n`);

// 测试 6: 批量问候
console.log('测试 6: 批量问候');
const test6 = helloBatch(['张三', '李四', '王五']);
console.log(`  结果：${JSON.stringify(test6)}`);
console.log(`  预期：3 条问候消息`);
console.log(`  状态：${test6.length === 3 ? '✅ 通过' : '❌ 失败'}\n`);

console.log('✅ 所有测试完成！');
