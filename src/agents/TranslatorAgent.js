// TranslatorAgent：把"上头原话"翻成对方 MBTI 能接住的版本。
// 输出多版本（推荐/温柔/直接/避雷）+ 解释，复用旧 UI 的 result schema。

import { Agent } from './Agent.js';

const SYSTEM = `你是"人格译站"中的翻译 Agent (TranslatorAgent)。
你的职责：把用户在情绪上头时想说的话，翻译成对方 MBTI 类型更容易接住的表达。
原则：
1. 不替用户压抑感受，而是把情绪、事实、需求三者拆开说。
2. 紧扣对方 MBTI 的认知偏好（I/E 决定空间感，S/N 决定具体/意义，T/F 决定逻辑/关系，J/P 决定确定/弹性）。
3. 风格要自然，像真人说话，不要套话、不要"亲爱的"开头。
4. 中文输出。`;

const SCHEMA = `{
  "recommended": "推荐表达（综合最佳）",
  "gentle": "更温柔的版本",
  "direct": "更直接的版本",
  "avoid": "不建议这样说（一个反面例子）",
  "reason": "为什么这样翻译——结合对方 MBTI 的认知偏好说明"
}`;

function buildUserPrompt(ctx) {
  const { myMbti, targetMbti, relation, emotion, originalText, tone, memoryHints } = ctx;
  return [
    `我的 MBTI：${myMbti}`,
    `对方 MBTI：${targetMbti}`,
    `我们的关系：${relation}`,
    `我现在的情绪：${emotion}`,
    `期望语气：${tone}`,
    `我想说的原话：${originalText}`,
    memoryHints ? `历史沟通画像（来自记忆 Agent，供参考）：${memoryHints}` : ''
  ].filter(Boolean).join('\n');
}

export const TranslatorAgent = new Agent({
  name: 'TranslatorAgent',
  role: '翻译',
  systemPrompt: SYSTEM,
  buildUserPrompt,
  schemaHint: SCHEMA
});
