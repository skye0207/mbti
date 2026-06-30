import { useState } from 'react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import SelectField from '../components/SelectField.jsx';
import TextareaField from '../components/TextareaField.jsx';
import ResultCard from '../components/ResultCard.jsx';
import { MBTI_TYPES, RELATIONS, EMOTIONS, TONES } from '../data/options.js';
import { generateTranslateResult, generateTranslateResultAgentic } from '../utils/generator.js';
import { isLLMAvailable } from '../utils/llmClient.js';

const sample = {
  myMbti: 'ENFP',
  targetMbti: 'INTJ',
  relation: '暧昧对象',
  emotion: '委屈',
  originalText: '你怎么又不回我消息？',
  tone: '温柔一点'
};

const AGENT_LABEL = {
  MemoryAgent: '🧠 记忆 Agent',
  TranslatorAgent: '✍️ 翻译 Agent',
  OpponentAgent: '🎭 对方扮演 Agent',
  MediatorAgent: '⚖️ 调解 Agent',
  system: 'ℹ️ 系统'
};

export default function Translator({ profile, showToast }) {
  const [form, setForm] = useState({
    myMbti: profile.mbti || 'ENFP',
    targetMbti: 'INTJ',
    relation: '暧昧对象',
    emotion: '委屈',
    originalText: '',
    tone: '温柔一点'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [trace, setTrace] = useState([]); // Agent 协作过程

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleGenerate() {
    if (!form.originalText.trim()) {
      showToast('先写一句想中译中的话吧');
      return;
    }
    setLoading(true);
    setResult(null);
    setTrace([]);

    if (!isLLMAvailable()) {
      // 走规则版，保留原有交互延迟
      setTimeout(() => {
        setResult(generateTranslateResult(form));
        setLoading(false);
      }, 520);
      return;
    }

    try {
      const r = await generateTranslateResultAgentic(form, {
        onStep: (step) => {
          setTrace((prev) => [...prev, { ...step, at: Date.now() }]);
        }
      });
      setResult(r);
    } catch (e) {
      showToast('Agent 执行失败，已回退规则版');
      setResult(generateTranslateResult(form));
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setForm((prev) => ({ ...prev, originalText: '' }));
    setResult(null);
    setTrace([]);
  }

  function fillSample() {
    setForm(sample);
    setResult(null);
    setTrace([]);
    showToast('已填入 ENFP × INTJ 示例');
  }

  return (
    <div className="page translator-page">
      <section className="page-heading">
        <span className="page-icon">💬</span>
        <div>
          <h1>消息翻译器</h1>
          <p>
            把嘴硬、委屈、上头发言，翻成对方更容易接住的话。
            {isLLMAvailable() ? ' （Agent 模式已启用）' : ' （规则模式，配置 LLM 后启用 Agent 协作）'}
          </p>
        </div>
      </section>

      <div className="workspace two-pane">
        <Card className="form-card" badge="输入一句想说的话">
          <div className="form-grid">
            <SelectField label="我的 MBTI" value={form.myMbti} onChange={(v) => update('myMbti', v)} options={MBTI_TYPES} />
            <SelectField label="对方 MBTI" value={form.targetMbti} onChange={(v) => update('targetMbti', v)} options={MBTI_TYPES} />
            <SelectField label="关系类型" value={form.relation} onChange={(v) => update('relation', v)} options={RELATIONS} />
            <SelectField label="当前情绪" value={form.emotion} onChange={(v) => update('emotion', v)} options={EMOTIONS} />
            <SelectField label="期望语气" value={form.tone} onChange={(v) => update('tone', v)} options={TONES} />
            <div className="mbti-pair">
              <span>{form.myMbti}</span>
              <b>→</b>
              <span>{form.targetMbti}</span>
            </div>
            <TextareaField
              label="我想说的话"
              value={form.originalText}
              onChange={(v) => update('originalText', v)}
              placeholder="比如：你怎么又不回我消息？"
            />
          </div>
          <div className="button-row">
            <Button loading={loading} onClick={handleGenerate}>开始中译中</Button>
            <Button variant="secondary" onClick={fillSample}>填入示例</Button>
            <Button variant="ghost" onClick={handleClear}>清空</Button>
          </div>
        </Card>

        <div className="result-column">
          {trace.length > 0 && (
            <Card className="agent-trace" badge="Agent 协作过程">
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, lineHeight: 1.7 }}>
                {trace.map((step, i) => (
                  <li key={i}>
                    <strong>{AGENT_LABEL[step.agent] || step.agent}</strong>
                    {' '}
                    {step.status === 'start' && <span>· 思考中…</span>}
                    {step.status === 'done' && <span>· 完成</span>}
                    {step.status === 'error' && <span style={{ color: '#c44' }}>· 失败：{step.error}</span>}
                    {step.status === 'done' && step.data?.likelyReply && (
                      <div style={{ opacity: 0.75, marginLeft: 16 }}>
                        对方可能回："{step.data.likelyReply}"（{step.data.emotionalTone}）
                      </div>
                    )}
                    {step.status === 'done' && step.data?.verdict && (
                      <div style={{ opacity: 0.75, marginLeft: 16 }}>判断：{step.data.verdict}</div>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {!result ? (
            <Card className="empty-result">
              <div className="empty-illustration">💌</div>
              <h2>等你输入一句话</h2>
              <p>生成后会展示推荐表达、温柔版本、直接版本和避雷说法。</p>
            </Card>
          ) : (
            <>
              <ResultCard title="推荐表达" copyValue={result.recommended} showToast={showToast}>{result.recommended}</ResultCard>
              <ResultCard title="更温柔版本" tone="pink" copyValue={result.gentle} showToast={showToast}>{result.gentle}</ResultCard>
              <ResultCard title="更直接版本" tone="blue" copyValue={result.direct} showToast={showToast}>{result.direct}</ResultCard>
              <ResultCard title="不建议这样说" tone="yellow" copyValue={result.avoid} showToast={showToast}>{result.avoid}</ResultCard>
              <ResultCard title="为什么这样翻译" tone="plain" showToast={showToast}>{result.reason}</ResultCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
