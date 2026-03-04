#!/usr/bin/env node

/**
 * 🧠 知识图谱系统
 * 构建持久知识库，存储学习模式，跨任务知识复用
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const GRAPH_FILE = path.join(process.env.HOME, '.openclaw/evolution/knowledge-graph.json');
const INDEX_FILE = path.join(process.env.HOME, '.openclaw/evolution/graph-index.json');

class KnowledgeGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.index = this.loadIndex();
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(GRAPH_FILE)) {
        const data = JSON.parse(fs.readFileSync(GRAPH_FILE, 'utf8'));
        data.nodes.forEach(n => this.nodes.set(n.id, n));
        data.edges.forEach(e => {
          const key = `${e.source}-${e.target}`;
          this.edges.set(key, e);
        });
      }
    } catch (error) {
      console.error('加载知识图谱失败:', error.message);
    }
  }

  save() {
    const data = {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(GRAPH_FILE, JSON.stringify(data, null, 2));
    this.saveIndex();
  }

  loadIndex() {
    try {
      if (fs.existsSync(INDEX_FILE)) {
        return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
      }
    } catch (error) {}
    return { nodes: {}, edges: {}, patterns: {} };
  }

  saveIndex() {
    const index = {
      nodes: {},
      edges: {},
      patterns: {},
      lastUpdated: new Date().toISOString()
    };

    // 构建节点索引
    for (const [id, node] of this.nodes) {
      if (!index.nodes[node.type]) index.nodes[node.type] = [];
      index.nodes[node.type].push(id);

      // 关键词索引
      if (node.keywords) {
        for (const keyword of node.keywords) {
          if (!index.nodes[keyword]) index.nodes[keyword] = [];
          index.nodes[keyword].push(id);
        }
      }
    }

    // 构建边索引
    for (const edge of this.edges.values()) {
      if (!index.edges[edge.type]) index.edges[edge.type] = [];
      index.edges[edge.type].push(edge.id);
    }

    fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
  }

  // 添加节点
  addNode(type, data) {
    const id = data.id || crypto.createHash('md5').update(JSON.stringify(data)).digest('hex').substring(0, 16);
    
    const node = {
      id,
      type,
      data,
      createdAt: new Date().toISOString(),
      accessCount: 0,
      lastAccessed: null
    };

    this.nodes.set(id, node);
    this.save();
    
    return id;
  }

  // 查询节点
  query(type, filters = {}) {
    const results = [];
    
    for (const [id, node] of this.nodes) {
      if (node.type !== type) continue;
      
      let match = true;
      for (const [key, value] of Object.entries(filters)) {
        if (node.data[key] !== value) {
          match = false;
          break;
        }
      }
      
      if (match) {
        node.accessCount++;
        node.lastAccessed = new Date().toISOString();
        results.push(node);
      }
    }
    
    this.save();
    return results;
  }

  // 添加边（关系）
  addEdge(sourceId, targetId, type, weight = 1, data = {}) {
    const id = `${sourceId}-${targetId}-${type}`;
    
    const edge = {
      id,
      source: sourceId,
      target: targetId,
      type,
      weight,
      data,
      createdAt: new Date().toISOString()
    };

    this.edges.set(id, edge);
    this.save();
    
    return id;
  }

  // 获取关联节点
  getRelated(nodeId, edgeType, direction = 'outgoing') {
    const related = [];
    
    for (const edge of this.edges.values()) {
      if (edge.type !== edgeType) continue;
      
      if (direction === 'outgoing' && edge.source === nodeId) {
        const node = this.nodes.get(edge.target);
        if (node) related.push(node);
      } else if (direction === 'incoming' && edge.target === nodeId) {
        const node = this.nodes.get(edge.source);
        if (node) related.push(node);
      }
    }
    
    return related;
  }

  // 搜索节点（关键词匹配）
  search(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    for (const [id, node] of this.nodes) {
      const text = JSON.stringify(node.data).toLowerCase();
      
      // 模糊匹配
      if (text.includes(lowerQuery) || this.fuzzyMatch(lowerQuery, text)) {
        node.accessCount++;
        node.lastAccessed = new Date().toISOString();
        results.push({
          node,
          score: this.calculateScore(lowerQuery, text)
        });
      }
    }
    
    // 按分数排序
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, 20).map(r => r.node);
  }

  fuzzyMatch(query, text) {
    const queryChars = query.split('');
    let index = 0;
    
    for (const char of text) {
      if (char === queryChars[index]) {
        index++;
        if (index === queryChars.length) return true;
      }
    }
    
    return false;
  }

  calculateScore(query, text) {
    let score = 0;
    
    // 精确匹配加分
    if (text.includes(query)) score += 10;
    
    // 模糊匹配加分
    if (this.fuzzyMatch(query, text)) score += 5;
    
    // 访问频率加分
    const node = Array.from(this.nodes.values()).find(n => 
      JSON.stringify(n.data).toLowerCase() === text
    );
    if (node) score += node.accessCount * 0.1;
    
    return score;
  }

  // 添加模式
  addPattern(name, pattern, examples = []) {
    const patternId = this.addNode('pattern', {
      name,
      pattern,
      examples,
      usageCount: 0
    });

    return patternId;
  }

  // 匹配模式
  matchPattern(text) {
    const patterns = this.query('pattern', {});
    const matches = [];

    for (const patternNode of patterns) {
      const pattern = patternNode.data.pattern;
      const regex = new RegExp(pattern, 'gi');
      
      const test = regex.test(text);
      if (test) {
        patternNode.data.usageCount++;
        matches.push({
          pattern: patternNode.data.name,
          matches: text.match(regex)
        });
      }
    }

    this.save();
    return matches;
  }

  // 获取统计信息
  getStats() {
    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.size,
      nodeTypes: this.getNodeTypeStats(),
      edgeTypes: this.getEdgeTypeStats(),
      lastUpdated: new Date().toISOString()
    };
  }

  getNodeTypeStats() {
    const stats = {};
    for (const node of this.nodes.values()) {
      stats[node.type] = (stats[node.type] || 0) + 1;
    }
    return stats;
  }

  getEdgeTypeStats() {
    const stats = {};
    for (const edge of this.edges.values()) {
      stats[edge.type] = (stats[edge.type] || 0) + 1;
    }
    return stats;
  }

  // 导出子图
  exportSubGraph(rootNodeId, maxDepth = 2) {
    const visited = new Set();
    const subGraph = { nodes: [], edges: [] };
    
    const traverse = (nodeId, depth) => {
      if (depth > maxDepth || visited.has(nodeId)) return;
      
      visited.add(nodeId);
      const node = this.nodes.get(nodeId);
      if (node) subGraph.nodes.push(node);
      
      for (const edge of this.edges.values()) {
        if (edge.source === nodeId) {
          subGraph.edges.push(edge);
          traverse(edge.target, depth + 1);
        }
      }
    };
    
    traverse(rootNodeId, 0);
    
    return subGraph;
  }

  // 清理旧数据
  cleanup(daysOld = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);
    
    let removed = 0;
    
    for (const [id, node] of this.nodes) {
      const created = new Date(node.createdAt);
      const accessed = node.lastAccessed ? new Date(node.lastAccessed) : created;
      
      if (created < cutoff && accessed < cutoff && node.accessCount === 0) {
        this.nodes.delete(id);
        removed++;
      }
    }
    
    // 清理孤立的边
    for (const [id, edge] of this.edges) {
      if (!this.nodes.has(edge.source) || !this.nodes.has(edge.target)) {
        this.edges.delete(id);
      }
    }
    
    this.save();
    
    return { removed, remaining: this.nodes.size };
  }
}

// 导出
module.exports = { KnowledgeGraph };