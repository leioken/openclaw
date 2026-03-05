/**
 * Hello World 模块
 * 
 * 提供基础的问候功能，支持多语言和自定义消息
 */

/**
 * 生成问候消息
 * @param {Object} options - 配置选项
 * @param {string} [options.name='World'] - 问候对象名称
 * @param {string} [options.language='zh'] - 语言 (zh/en)
 * @param {string} [options.customMessage] - 自定义消息
 * @returns {string} 问候消息
 */
function hello(options = {}) {
  const {
    name = 'World',
    language = 'zh',
    customMessage
  } = options;

  // 自定义消息优先
  if (customMessage) {
    return customMessage;
  }

  // 多语言支持
  const messages = {
    zh: `你好，${name}！👋`,
    en: `Hello, ${name}! 👋`,
    jp: `こんにちは、${name}！👋`,
    es: `¡Hola, ${name}! 👋`
  };

  return messages[language] || messages.zh;
}

/**
 * 生成带时间的问候
 * @param {Object} options - 配置选项
 * @param {string} [options.name] - 问候对象名称
 * @param {string} [options.language='zh'] - 语言
 * @returns {string} 带时间的问候消息
 */
function helloWithTime(options = {}) {
  const { name, language = 'zh' } = options;
  
  const hour = new Date().getHours();
  let timeGreeting;

  if (hour >= 5 && hour < 12) {
    timeGreeting = language === 'zh' ? '早上好' : 'Good morning';
  } else if (hour >= 12 && hour < 18) {
    timeGreeting = language === 'zh' ? '下午好' : 'Good afternoon';
  } else {
    timeGreeting = language === 'zh' ? '晚上好' : 'Good evening';
  }

  const baseMessage = name ? `${timeGreeting}，${name}！` : `${timeGreeting}！`;
  return `${baseMessage} 👋`;
}

/**
 * 批量生成问候
 * @param {string[]} names - 名称列表
 * @param {Object} [options] - 配置选项
 * @returns {string[]} 问候消息列表
 */
function helloBatch(names, options = {}) {
  return names.map(name => hello({ ...options, name }));
}

module.exports = {
  hello,
  helloWithTime,
  helloBatch
};
