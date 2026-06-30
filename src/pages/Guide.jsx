import { useState } from 'react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import SelectField from '../components/SelectField.jsx';
import ResultCard from '../components/ResultCard.jsx';
import { MBTI_TYPES, RELATIONS, CONFUSIONS } from '../data/options.js';
import { generateGuideResult } from '../utils/generator.js';

export default function Guide({ profile, showToast }) {
  const [form, setForm] = useState({
    myMbti: profile.mbti || 'ENFP',
    targetMbti: 'INTJ',
    relation: '暧昧对象',
    confusion: '对方太冷淡'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(() => generateGuideResult({ myMbti: profile.mbti || 'ENFP', targetMbti: 'INTJ', relation: '暧昧对象', confusion: '对方太冷淡' }));

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleGenerate() {
    setLoading(true);
    setTimeout(() => {
      setResult(generateGuideResult(form));
      setLoading(false);
    }, 520);
  }

  return (
    <div className="page guide-page">
      <section className="page-heading">
        <span className="page-icon">🧭</span>
        <div>
          <h1>MBTI 相处指南</h1>
          <p>不是给关系下结论，而是帮你找到更舒服的相处方式。</p>
        </div>
      </section>

      <div className="workspace two-pane compact-left">
        <Card className="form-card" badge="关系设定">
          <div className="form-grid single">
            <SelectField label="我的 MBTI" value={form.myMbti} onChange={(v) => update('myMbti', v)} options={MBTI_TYPES} />
            <SelectField label="对方 MBTI" value={form.targetMbti} onChange={(v) => update('targetMbti', v)} options={MBTI_TYPES} />
            <SelectField label="关系类型" value={form.relation} onChange={(v) => update('relation', v)} options={RELATIONS} />
            <SelectField label="当前困惑" value={form.confusion} onChange={(v) => update('confusion', v)} options={CONFUSIONS} />
          </div>
          <div className="pair-orbit">
            <span>{form.myMbti}</span>
            <div className="orbit-line">关系天气</div>
            <span>{form.targetMbti}</span>
          </div>
          <Button loading={loading} onClick={handleGenerate}>生成相处指南</Button>
        </Card>

        <Card className="guide-result-card" badge={result.weather}>
          <div className="guide-title-row">
            <h2>{result.title}</h2>
            <span className="weather-badge">🌤️ {result.weather}</span>
          </div>

          <div className="guide-section">
            <h3>关系优势</h3>
            <ul>{result.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="guide-section">
            <h3>容易误会</h3>
            <ul>{result.misunderstandings.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="guide-section">
            <h3>沟通建议</h3>
            <ul>{result.suggestions.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>

          <div className="grid two-col mini-gap">
            <ResultCard title="适合说的话" tone="pink" copyValue={result.goodPhrases.join('\n')} showToast={showToast}>
              <ul>{result.goodPhrases.map((item) => <li key={item}>{item}</li>)}</ul>
            </ResultCard>
            <ResultCard title="不适合说的话" tone="yellow" copyValue={result.badPhrases.join('\n')} showToast={showToast}>
              <ul>{result.badPhrases.map((item) => <li key={item}>{item}</li>)}</ul>
            </ResultCard>
          </div>
        </Card>
      </div>
    </div>
  );
}
