// OpponentAgent：扮演对方 MBTI，对推荐表达给出"真实可能的回复"和情绪反应。
// 用来给用户提供"预演"——发送前先看对方大概率会怎么接。

import { Agent } from './Agent.js';

const SYSTEM = `你是"人格译站"中的对方扮演 Agent (OpponentAgent)。
你的职责：根据给定的 MBTI 类型，扮演"对方"，对一段消息做出真实可能的反应。
原则：
1. 不要美化对方，也不要刻意刁难，模拟一个普通该 MBTI 类型的人。
2. 体现该类型的典型反应模式（I 倾向先沉默/简短，T 倾向先分析问题本身，J 倾向追问下一步等）。
3. 给出"心里的真实想法"和"实际可能发出去的回复"，二者可能不同。
4. 中文输出。`;

const SCHEMA = `{
  "innerThought": "对方看到这条消息时心里的真实想法（一两句）",
  "likelyReply": "对方实际可能发出去的文字回复",
  "emotionalTone": "对方的情绪反应（如：被理解 / 防御 / 想回避 / 愿意继续聊 / 不耐烦）",
  "risk": "这条消息可能踩到的雷区（如果没有则填 '无明显风险'）"
}`;

function buildUserPrompt(ctx) {
  const { targetMbti, relation, messageToReact } = ctx;
  return [
    `你现在要扮演的人物 MBTI：${targetMbti}`,
    `你和说话者的关系：${relation}`,
    `你刚刚收到的消息：${messageToReact}`,
    `请以该 MBTI 的视角，给出你心里的想法、实际回复、情绪反应和潜在风险。`
  ].join('\n');
}

export const OpponentAgent = new Agent({
  name: 'OpponentAgent',
  role: '对方扮演',
  systemPrompt: SYSTEM,
  buildUserPrompt,
  schemaHint: SCHEMA
});
