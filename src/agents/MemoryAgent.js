// MemoryAgent：维护用户的长期沟通画像。
// 当前实现：localStorage 存储 + LLM 抽取（如可用）。无 LLM 时退化为简单计数。
//
// 写入时机：每次完整翻译/复盘后调用 record()
// 读取时机：下次翻译开始前调用 getHints()，把画像注入 TranslatorAgent 的 context

import { callLLM, isLLMAvailable } from '../utils/llmClient.js';

const STORAGE_KEY = 'renge.memory.profile';
const MAX_EVENTS = 30;

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { events: [], summary: '' };
  } catch {
    return { events: [], summary: '' };
  }
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export const MemoryAgent = {
  name: 'MemoryAgent',
  role: '记忆',

  /** 记录一次沟通事件 */
  record(event) {
    const store = readStore();
    store.events.unshift({
      ts: Date.now(),
      ...event
    });
    store.events = store.events.slice(0, MAX_EVENTS);
    writeStore(store);
  },

  /** 给 TranslatorAgent 用的 hint 字符串。带 LLM 时会做摘要，否则用最近 3 条原始记录 */
  async getHints({ signal } = {}) {
    const store = readStore();
    if (!store.events.length) return '';

    if (!isLLMAvailable()) {
      const recent = store.events.slice(0, 3).map((e, i) =>
        `${i + 1}. 对${e.targetMbti}(${e.relation})说"${(e.originalText || '').slice(0, 30)}"，情绪：${e.emotion}`
      ).join('；');
      return `最近沟通记录：${recent}`;
    }

    // 有 LLM：让模型抽一个简短的用户沟通画像
    const eventsText = store.events.slice(0, 10).map((e, i) =>
      `${i + 1}. [${new Date(e.ts).toISOString().slice(0, 10)}] 对${e.targetMbti}(${e.relation})表达"${e.emotion}"：${(e.originalText || '').slice(0, 60)}`
    ).join('\n');

    try {
      const summary = await callLLM({
        system: '你是用户沟通模式分析助手。请基于事件列表，用 2-3 句话总结用户的沟通画像（易激点、惯用错位、修复风格），不要给建议，只描述。中文输出。',
        user: eventsText,
        temperature: 0.3,
        signal
      });
      store.summary = summary;
      writeStore(store);
      return summary;
    } catch {
      return store.summary || '';
    }
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  }
};
