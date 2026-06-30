// generator.js —— 从"规则模板"重构为"多 Agent 编排器"。
//
// 对外保持向后兼容（generateTranslateResult / generateGuideResult 同名同形），
// 但行为升级为：
//   1) 调用 TranslatorAgent 生成多版本翻译稿
//   2) 调用 OpponentAgent 模拟对方反应（仅 Translator 流程）
//   3) 调用 MediatorAgent 给出判断与下一步
//   4) MemoryAgent 在每次完整流程后记录事件
//
// LLM 不可用时（未配置 baseUrl/apiKey），自动回退到原规则实现，保证产品可用。
//
// 同时新增 generateTranslateResultAgentic(input, { onStep })，供 UI 流式展示
// Agent 协作过程（推荐 Hackathon Demo 使用）。

import { isLLMAvailable } from './llmClient.js';
import { TranslatorAgent } from '../agents/TranslatorAgent.js';
import { OpponentAgent } from '../agents/OpponentAgent.js';
import { MediatorAgent } from '../agents/MediatorAgent.js';
import { MemoryAgent } from '../agents/MemoryAgent.js';

// ============== 规则版（fallback） ==============

function includesLetter(type, letter) {
  return (type || '').includes(letter);
}

function getTargetStyle(targetMbti) {
  const isIntroverted = includesLetter(targetMbti, 'I');
  const isSensing = includesLetter(targetMbti, 'S');
  const isThinking = includesLetter(targetMbti, 'T');
  const isJudging = includesLetter(targetMbti, 'J');

  const preferences = [];
  if (isIntroverted) preferences.push('给对方一点思考和回复空间');
  else preferences.push('保留一点互动感和情绪温度');

  if (isSensing) preferences.push('把需求说得具体一点');
  else preferences.push('把背后的感受和关系期待说清楚');

  if (isThinking) preferences.push('少用指责，多用事实和边界');
  else preferences.push('先确认关系，再表达感受');

  if (isJudging) preferences.push('给出清晰期待或下一步');
  else preferences.push('保留弹性，不要让对方觉得被安排');

  return { isIntroverted, isSensing, isThinking, isJudging, preferences };
}

function normalizeOriginal(text) {
  return (text || '').trim().replace(/\s+/g, ' ');
}

function relationPrefix(relation) {
  const map = {
    恋人: '我很在意我们之间的感受，所以想认真说一下：',
    暧昧对象: '我不想让气氛变得有压力，只是想更清楚地表达一下：',
    朋友: '作为朋友，我想把这件事说开一点：',
    同事: '为了让协作更顺畅，我想同步一下我的想法：',
    领导: '我想更清楚地说明当前情况和我的判断：',
    下属: '我想和你对齐一下这件事的背景和期待：',
    家人: '我知道我们都在乎彼此，所以我想好好说一下：',
    室友: '为了以后相处更舒服，我想把这件事沟通一下：'
  };
  return map[relation] || '我想认真表达一下：';
}

function emotionNeed(emotion) {
  const map = {
    委屈: '我有点失落，也希望自己的感受能被看见',
    生气: '我现在有情绪，但我更想把问题说清楚，而不是吵起来',
    焦虑: '我有点不安，所以想确认一下真实情况',
    想关心: '我是在关心你，不是想给你压力',
    想拒绝: '我可能没办法答应这件事，但我希望表达得清楚又不伤人',
    想解释: '我想补充一下我的真实想法，避免你误会',
    想道歉: '我意识到刚才的表达可能让你不舒服，想认真道歉',
    想推进事情: '我想把事情继续往前推，同时也尊重你的节奏'
  };
  return map[emotion] || '我想把真实想法表达清楚';
}

function toneEnding(tone, targetMbti) {
  const style = getTargetStyle(targetMbti);
  if (tone === '职场一点') return '我们可以先对齐优先级和时间点，再决定下一步怎么推进。';
  if (tone === '撒娇一点') return '你不用马上给答案，但可以给我一点点明确回应吗？这样我会安心很多。';
  if (tone === '直接一点') return '我希望我们可以把这件事说清楚，并约定一个更舒服的处理方式。';
  if (tone === '体面一点') return '我尊重你的节奏，也希望我们能用更舒服的方式把这件事处理好。';
  if (tone === '高情商一点') return '我不是想责怪你，而是想让我们减少误会，把真实需求说得更清楚。';
  if (style.isIntroverted) return '你可以不用马上回复，等方便的时候告诉我你的想法就好。';
  if (style.isJudging) return '我们可以约一个更明确的沟通方式，彼此都更安心。';
  return '我想听听你的想法，也希望我们可以轻松一点聊开。';
}

function adaptForTarget(targetMbti) {
  const style = getTargetStyle(targetMbti);
  if (style.isThinking && style.isIntroverted) return '我尽量把事实、感受和期待分开说，避免让你有被逼问的感觉。';
  if (!style.isThinking && style.isIntroverted) return '我不是在否定你，只是想让你知道这件事对我的影响。';
  if (style.isThinking && !style.isIntroverted) return '我想直接说重点：这件事影响到了我的感受和判断。';
  return '我想先确认我们之间没有对立，只是这件事我有点在意。';
}

function translateByRule(input) {
  const { targetMbti = 'INTJ', relation = '朋友', emotion = '委屈', originalText = '', tone = '温柔一点' } = input || {};
  const raw = normalizeOriginal(originalText);
  const style = getTargetStyle(targetMbti);
  const prefix = relationPrefix(relation);
  const need = emotionNeed(emotion);
  const bridge = adaptForTarget(targetMbti);
  const ending = toneEnding(tone, targetMbti);

  const recommended = `${prefix}${need}。${bridge}${ending}`;
  const gentle = `我知道你可能也有自己的状态和节奏。只是关于"${raw || '这件事'}"，我确实有一点在意。不是想怪你，是想和你更好地沟通一下。${style.isIntroverted ? '你方便的时候再回复我就好。' : '我们可以轻松一点聊聊。'}`;
  const direct = `我想直接说一下：关于"${raw || '这件事'}"，我真正需要的是更清楚的回应和更稳定的沟通方式。${style.isJudging ? '如果可以，我们约定一下之后怎么处理。' : '方式可以灵活，但希望不要让我一直猜。'}`;
  const avoid = emotion === '生气' ? '你每次都这样，真的很离谱。'
    : emotion === '想拒绝' ? '反正我不想管，你自己看着办。'
    : '你是不是根本不在乎我？';
  const reason = `对方是 ${targetMbti}，表达时更适合${style.preferences.join('、')}。推荐表达把情绪、事实和需求拆开说，能降低对方防御感，也更容易让沟通继续下去。`;

  return { recommended, gentle, direct, avoid, reason };
}

// ============== Agent 编排版 ==============

/**
 * Agent 协作版翻译：TranslatorAgent → OpponentAgent → MediatorAgent。
 * 通过 onStep 回调实时上报每个 Agent 的产出，UI 可以做"对话剧场"展示。
 *
 * @param {object} input - 表单输入
 * @param {object} [opts]
 * @param {(step: {agent: string, status: 'start'|'done'|'error', data?: any, error?: string}) => void} [opts.onStep]
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<{recommended,gentle,direct,avoid,reason, agentTrace: object}>}
 */
export async function generateTranslateResultAgentic(input, { onStep, signal } = {}) {
  const emit = (step) => { try { onStep && onStep(step); } catch { /* noop */ } };

  if (!isLLMAvailable()) {
    emit({ agent: 'system', status: 'done', data: { fallback: true, reason: '未配置 LLM，使用规则版' } });
    const result = translateByRule(input);
    MemoryAgent.record({ ...input, mode: 'rule' });
    return { ...result, agentTrace: { fallback: true } };
  }

  const memoryHints = await MemoryAgent.getHints({ signal }).catch(() => '');
  emit({ agent: 'MemoryAgent', status: 'done', data: { hints: memoryHints || '(无历史)' } });

  // 1) Translator
  emit({ agent: 'TranslatorAgent', status: 'start' });
  let translation;
  try {
    translation = await TranslatorAgent.run({ ...input, memoryHints }, { signal });
    emit({ agent: 'TranslatorAgent', status: 'done', data: translation });
  } catch (e) {
    emit({ agent: 'TranslatorAgent', status: 'error', error: String(e.message || e) });
    const fallback = translateByRule(input);
    return { ...fallback, agentTrace: { translatorError: String(e.message || e) } };
  }

  // 2) Opponent（基于推荐版预演）
  emit({ agent: 'OpponentAgent', status: 'start' });
  let opponentReaction = null;
  try {
    opponentReaction = await OpponentAgent.run({
      targetMbti: input.targetMbti,
      relation: input.relation,
      messageToReact: translation.recommended
    }, { signal, temperature: 0.8 });
    emit({ agent: 'OpponentAgent', status: 'done', data: opponentReaction });
  } catch (e) {
    emit({ agent: 'OpponentAgent', status: 'error', error: String(e.message || e) });
  }

  // 3) Mediator（综合判断）
  emit({ agent: 'MediatorAgent', status: 'start' });
  let mediation = null;
  try {
    mediation = await MediatorAgent.run({
      myMbti: input.myMbti,
      targetMbti: input.targetMbti,
      relation: input.relation,
      translation,
      opponentReaction
    }, { signal, temperature: 0.4 });
    emit({ agent: 'MediatorAgent', status: 'done', data: mediation });
  } catch (e) {
    emit({ agent: 'MediatorAgent', status: 'error', error: String(e.message || e) });
  }

  // 4) Memory 落库
  MemoryAgent.record({
    targetMbti: input.targetMbti,
    relation: input.relation,
    emotion: input.emotion,
    originalText: input.originalText,
    mode: 'agentic',
    verdict: mediation?.verdict
  });

  // 把 Mediator 的 reason 融合进 reason 字段，让旧 UI 也能直接展示
  const reason = mediation
    ? `${translation.reason}\n\n【对方预演】${opponentReaction?.likelyReply || ''}（${opponentReaction?.emotionalTone || ''}）\n【调解判断】${mediation.verdict}\n${mediation.mismatch ? '错位：' + mediation.mismatch : ''}\n${mediation.nextStep ? '若反应不佳：' + mediation.nextStep : ''}`
    : translation.reason;

  return {
    recommended: translation.recommended,
    gentle: translation.gentle,
    direct: translation.direct,
    avoid: translation.avoid,
    reason,
    agentTrace: { memoryHints, translation, opponentReaction, mediation }
  };
}

// ============== 向后兼容的同步 API（旧 UI 直接调用） ==============

/**
 * 旧 API 入口。LLM 不可用时走规则版；可用时也降级为规则版（旧 UI 不支持 await）。
 * 推荐改用 generateTranslateResultAgentic。
 */
export function generateTranslateResult(input) {
  return translateByRule(input);
}

export function generateGuideResult(input) {
  const { myMbti = 'ENFP', targetMbti = 'INTJ', relation = '朋友', confusion = '不知道怎么聊天' } = input || {};
  const mbtiLabel = (type) => {
    const s = getTargetStyle(type);
    return [
      s.isIntroverted ? '需要空间' : '重视互动',
      s.isSensing ? '偏具体实际' : '偏意义和可能性',
      s.isThinking ? '重视逻辑边界' : '重视情绪连接',
      s.isJudging ? '偏确定计划' : '偏弹性自由'
    ];
  };
  const mine = mbtiLabel(myMbti);
  const target = mbtiLabel(targetMbti);
  const targetStyle = getTargetStyle(targetMbti);

  const mismatchCount = [...myMbti].filter((letter, index) => letter !== targetMbti[index]).length;
  const weather = mismatchCount <= 1 ? '晴' : mismatchCount === 2 ? '晴转多云' : mismatchCount === 3 ? '多云' : '雷阵雨后转晴';

  return {
    title: `${myMbti} × ${targetMbti} 相处指南`,
    weather,
    strengths: [
      `${myMbti} 可能带来 ${mine[0]} 和 ${mine[2]} 的沟通特点。`,
      `${targetMbti} 可能更偏向 ${target[1]} 和 ${target[3]}。`,
      `在${relation}关系里，你们的差异如果被看见，就会从误会变成互补。`
    ],
    misunderstandings: [
      targetStyle.isIntroverted ? '对方回复慢，不一定是冷淡，也可能是在消化信息。' : '对方表达热烈，不一定是施压，也可能是在建立连接。',
      targetStyle.isThinking ? '对方给建议，不一定是否定你，可能是在尝试解决问题。' : '对方强调感受，不一定是不讲理，可能是在确认关系安全感。',
      confusion === '想保持边界' ? '边界如果说得太硬，容易被理解成疏远。' : '需求如果只藏在情绪里，对方可能接收不到重点。'
    ],
    suggestions: [
      targetStyle.isIntroverted ? '给对方一点思考时间，不要连续追问。' : '可以多给即时反馈，让对方知道你有在接住。',
      targetStyle.isThinking ? '先说事实和需求，再补充情绪。' : '先确认感受和关系，再进入问题本身。',
      targetStyle.isJudging ? '把期待说得明确，例如时间、方式、下一步。' : '保留弹性选项，不要让沟通像任务分配。',
      '避免用"你总是""你从来不"开头，改成"我感受到的是……我希望的是……"。'
    ],
    goodPhrases: [
      targetStyle.isIntroverted ? '你不用马上回复，等方便的时候告诉我你的想法就好。' : '我想听听你的真实想法，我们可以直接聊聊。',
      targetStyle.isThinking ? '我想把事实、感受和期待分开说，这样更清楚。' : '我不是在怪你，只是这件事让我有点在意。',
      '我希望我们不是争输赢，而是找到一个彼此都舒服的方式。'
    ],
    badPhrases: [
      '你怎么永远这样？',
      '算了，反正你也不会懂。',
      targetStyle.isIntroverted ? '你现在必须马上给我一个答案。' : '你别说了，我不想听。'
    ]
  };
}

// 已废弃：旧的占位接口。保留导出避免外部 import 报错。
export async function generateWithLLM(prompt) {
  console.warn('generateWithLLM 已废弃，请使用 generateTranslateResultAgentic');
  return '';
}
