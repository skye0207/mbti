import { useState } from 'react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import SelectField from '../components/SelectField.jsx';
import TextareaField from '../components/TextareaField.jsx';
import ResultCard from '../components/ResultCard.jsx';
import { MBTI_TYPES, RELATIONS, GOALS } from '../data/options.js';
import { generateReviewResult } from '../utils/generator.js';

const sample = {
  myMbti: 'ENFP',
  targetMbti: 'INTJ',
  relation: '暧昧对象',
  conflictText: '昨天我说想见面，他说最近没空，我有点受伤。',
  goal: '表达委屈'
};

export default function Review({ profile, showToast }) {
  const [form, setForm] = useState({
    myMbti: profile.mbti || 'ENFP',
    targetMbti: 'INTJ',
    relation: '朋友',
    conflictText: '',
    goal: '解释清楚'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleGenerate() {
    if (!form.conflictText.trim()) {
      showToast('先简单描述一下发生了什么吧');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setResult(generateReviewResult(form));
      setLoading(false);
    }, 520);
  }

  function fillSample() {
    setForm(sample);
    setResult(null);
    showToast('已填入冲突复盘示例');
  }

  return (
    <div className="page review-page">
      <section className="page-heading">
        <span className="page-icon">🧩</span>
        <div>
          <h1>冲突复盘</h1>
          <p>把“我不是那个意思”的现场，拆成真正能沟通的问题。</p>
        </div>
      </section>

      <div className="workspace two-pane">
        <Card className="form-card" badge="复盘一场误会">
          <div className="form-grid">
            <SelectField label="我的 MBTI" value={form.myMbti} onChange={(v) => update('myMbti', v)} options={MBTI_TYPES} />
            <SelectField label="对方 MBTI" value={form.targetMbti} onChange={(v) => update('targetMbti', v)} options={MBTI_TYPES} />
            <SelectField label="关系类型" value={form.relation} onChange={(v) => update('relation', v)} options={RELATIONS} />
            <SelectField label="我希望达成" value={form.goal} onChange={(v) => update('goal', v)} options={GOALS} />
            <TextareaField
              label="冲突描述"
              value={form.conflictText}
              onChange={(v) => update('conflictText', v)}
              placeholder="比如：昨天我说想见面，他说最近没空，我有点受伤。"
              rows={8}
            />
          </div>
          <div className="button-row">
            <Button loading={loading} onClick={handleGenerate}>开始复盘</Button>
            <Button variant="secondary" onClick={fillSample}>填入示例</Button>
          </div>
        </Card>

        <div className="result-column">
          {!result ? (
            <Card className="empty-result">
              <div className="empty-illustration">🧸</div>
              <h2>先把事情放在桌面上</h2>
              <p>我会帮你区分表面冲突、真实在意点、表达错位和可发送话术。</p>
            </Card>
          ) : (
            <>
              <ResultCard title="表面冲突" tone="plain" showToast={showToast}>{result.surfaceProblem}</ResultCard>
              <ResultCard title="你可能真正介意" tone="pink" showToast={showToast}>{result.userConcern}</ResultCard>
              <ResultCard title="对方可能真正介意" tone="blue" showToast={showToast}>{result.targetConcern}</ResultCard>
              <ResultCard title="表达错位点" tone="yellow" showToast={showToast}>{result.mismatch}</ResultCard>
              <ResultCard title="建议补救方式" showToast={showToast}>{result.advice}</ResultCard>
              <ResultCard title="可以直接发送的一句话" tone="pink" copyValue={result.messageToSend} showToast={showToast}>{result.messageToSend}</ResultCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
