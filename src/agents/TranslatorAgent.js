// TranslatorAgent：把"上头原话"中译中，翻成对方 MBTI 能接住的版本。
// 简化版：只输出一句最终表达 + 一句简短理由。

import { Agent } from './Agent.js';

const SYSTEM = `你是"人格译站"中的翻译 Agent (TranslatorAgent)。
你的职责：把用户在情绪上头时想说的话，"中译中"翻成对方 MBTI 类型更容易接住的中文表达。
原则：
1. 不替用户压抑感受，把情绪、事实、需求三者拆开说。
2. 紧扣对方 MBTI 的认知偏好（I/E 空间感、S/N 具体/意义、T/F 逻辑/关系、J/P 确定/弹性）。
3. 自然，像真人说话，不套话、不"亲爱的"开头。
4. 只输出一句最终表达，不要多版本，不要列举，不要解释结构。
5. 中文输出。`;

const SCHEMA = `{
  "translated": "最终翻译后的一句话（不要超过 80 字）",
  "reason": "为什么这样翻译——一句话说明，结合对方 MBTI 的认知偏好"
}`;

function buildUserPrompt(ctx) {
  const { myMbti, targetMbti, relation, emotion, originalText, memoryHints } = ctx;
  return [
    `我的 MBTI：${myMbti}`,
    `对方 MBTI：${targetMbti}`,
    `我们的关系：${relation}`,
    `我现在的情绪：${emotion}`,
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
