import { useState } from 'react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import SelectField from '../components/SelectField.jsx';
import TextareaField from '../components/TextareaField.jsx';
import ResultCard from '../components/ResultCard.jsx';
import LLMConfigModal from '../components/LLMConfigModal.jsx';
import { MBTI_TYPES, RELATIONS, EMOTIONS } from '../data/options.js';
import { generateTranslateResultAgentic } from '../utils/generator.js';
import { isLLMAvailable } from '../utils/llmClient.js';

const sample = {
  myMbti: 'ENFP',
  targetMbti: 'INTJ',
  relation: '暧昧对象',
  emotion: '委屈',
  originalText: '你怎么又不回我消息？'
};

export default function Translator({ profile, showToast }) {
  const [form, setForm] = useState({
    myMbti: profile.mbti || 'ENFP',
    targetMbti: 'INTJ',
    relation: '暧昧对象',
    emotion: '委屈',
    originalText: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleGenerate() {
    if (!form.originalText.trim()) {
      showToast('先写一句想中译中的话吧');
      return;
    }
    if (!isLLMAvailable()) {
      setShowConfigModal(true);
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const r = await generateTranslateResultAgentic(form);
      setResult(r);
    } catch (e) {
      showToast('AI 调用失败：' + (e.message || e));
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setForm((prev) => ({ ...prev, originalText: '' }));
    setResult(null);
  }

  function fillSample() {
    setForm(sample);
    setResult(null);
    showToast('已填入 ENFP × INTJ 示例');
  }

  return (
    <div className="page translator-page">
      <section className="page-heading">
        <span className="page-icon">💬</span>
        <div>
          <h1>中译中</h1>
          <p>把嘴硬、委屈、上头发言，翻成对方更容易接住的一句话。</p>
        </div>
      </section>

      <div className="workspace two-pane">
        <Card className="form-card" badge="输入一句想说的话">
          <div className="form-grid">
            <SelectField label="我的 MBTI" value={form.myMbti} onChange={(v) => update('myMbti', v)} options={MBTI_TYPES} />
            <SelectField label="对方 MBTI" value={form.targetMbti} onChange={(v) => update('targetMbti', v)} options={MBTI_TYPES} />
            <SelectField label="关系类型" value={form.relation} onChange={(v) => update('relation', v)} options={RELATIONS} />
            <SelectField label="当前情绪" value={form.emotion} onChange={(v) => update('emotion', v)} options={EMOTIONS} />
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
          {!result ? (
            <Card className="empty-result">
              <div className="empty-illustration">💌</div>
              <h2>等你输入一句话</h2>
              <p>AI 会基于双方 MBTI，把它翻成更容易被接住的一句话。</p>
            </Card>
          ) : (
            <>
              <ResultCard title="翻译后" copyValue={result.translated} showToast={showToast}>
                {result.translated}
              </ResultCard>
              {result.reason && (
                <ResultCard title="为什么这样翻译" tone="plain" showToast={showToast}>
                  {result.reason}
                </ResultCard>
              )}
            </>
          )}
        </div>
      </div>

      <LLMConfigModal
        open={showConfigModal}
        forceSetup
        onClose={() => setShowConfigModal(false)}
        onSaved={() => { setShowConfigModal(false); handleGenerate(); }}
      />
    </div>
  );
}
