import { useState } from 'react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import LLMConfigModal from '../components/LLMConfigModal.jsx';
import LikertSlider from '../components/LikertSlider.jsx';
import PurpleSage from '../components/PurpleSage.jsx';
import {
  SEED_QUESTIONS, SCALE_OPTIONS, calculateMBTI, MBTI_DESCRIPTIONS,
  QUESTIONS_PER_ROUND, TOTAL_ROUNDS, TOTAL_QUESTIONS
} from '../data/quiz.js';
import { QuizAgent } from '../agents/QuizAgent.js';
import { isLLMAvailable } from '../utils/llmClient.js';
import { saveQuizResult, loadQuizResult, clearQuizResult } from '../utils/quizStorage.js';

/**
 * Agent 驱动的人格测试：6 轮 × 10 题 = 60 题。
 * - 第 1 轮：种子题
 * - 第 2-6 轮：QuizAgent 根据已答题动态生成 + 阶段性分析
 */
export default function Quiz({ onChangePage, showToast }) {
  const [stored] = useState(() => loadQuizResult());
  const [phase, setPhase] = useState(stored ? 'result' : 'intro'); // intro | quiz | analyzing | result
  const [showConfigModal, setShowConfigModal] = useState(false);

  const [roundIdx, setRoundIdx] = useState(0);
  // 所有轮次的题目（拍平），按出现顺序
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  // 每轮结束时 QuizAgent 给出的分析（用户可见）
  const [analyses, setAnalyses] = useState([]); // [{ roundIdx, text, mbti, percents }]
  const [agentError, setAgentError] = useState('');

  const [result, setResult] = useState(stored);

  // 当前轮次的题目
  const currentRoundQuestions = questions.slice(
    roundIdx * QUESTIONS_PER_ROUND,
    (roundIdx + 1) * QUESTIONS_PER_ROUND
  );
  const answeredInRound = currentRoundQuestions.filter((q) => typeof answers[q.id] === 'number').length;
  const totalAnswered = Object.keys(answers).length;
  const progress = Math.round((totalAnswered / TOTAL_QUESTIONS) * 100);

  function start() {
    if (!isLLMAvailable()) {
      setShowConfigModal(true);
      return;
    }
    setAnswers({});
    setAnalyses([]);
    setRoundIdx(0);
    setQuestions([...SEED_QUESTIONS]);
    setResult(null);
    setAgentError('');
    setPhase('quiz');
  }

  function pick(qid, value) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  }

  async function submitRound() {
    if (answeredInRound < QUESTIONS_PER_ROUND) {
      showToast('本轮还有题目未作答');
      return;
    }

    // 算当前累计 MBTI 倾向
    const interim = calculateMBTI(questions.slice(0, (roundIdx + 1) * QUESTIONS_PER_ROUND), answers);

    // 最后一轮：直接出结果
    if (roundIdx >= TOTAL_ROUNDS - 1) {
      finish(interim);
      return;
    }

    // 中间轮：调 QuizAgent 拿分析 + 下一轮题
    setPhase('analyzing');
    setAgentError('');
    try {
      const prevQAs = questions.slice(0, (roundIdx + 1) * QUESTIONS_PER_ROUND).map((q) => {
        const v = answers[q.id];
        const scaleLabel = SCALE_OPTIONS.find((s) => s.value === v)?.label || '未作答';
        return {
          dim: q.dim,
          direction: q.direction,
          text: q.text,
          scaleLabel,
          signedScore: q.direction === 'A' ? v : -v
        };
      });

      const agentResp = await QuizAgent.run({
        roundIndex: roundIdx + 1, // 下一轮 index
        totalRounds: TOTAL_ROUNDS,
        previousQAs: prevQAs,
        currentMBTI: interim.mbti,
        percents: interim.percents,
        counts: interim.counts
      }, { temperature: 0.5 });

      // 校验返回结构
      const newQuestions = (agentResp.questions || []).filter(
        (q) => q?.id && q?.dim && q?.direction && q?.text
      ).slice(0, QUESTIONS_PER_ROUND);

      if (newQuestions.length < QUESTIONS_PER_ROUND) {
        throw new Error(`Agent 返回题数不足：${newQuestions.length}`);
      }

      setAnalyses((prev) => [
        ...prev,
        { roundIdx, text: agentResp.analysis || '', mbti: interim.mbti, percents: interim.percents }
      ]);
      setQuestions((prev) => [...prev, ...newQuestions]);
      setRoundIdx(roundIdx + 1);
      setPhase('quiz');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setAgentError(String(e.message || e));
      setPhase('quiz');
      showToast('AI 出题失败，可重试或直接结束');
    }
  }

  function finish(interim) {
    const finalResult = interim || calculateMBTI(questions, answers);
    setResult(finalResult);
    saveQuizResult(finalResult);
    setPhase('result');
    showToast(`你的 MBTI：${finalResult.mbti}`);
  }

  function retake() {
    clearQuizResult();
    start();
  }

  function finishEarly() {
    if (totalAnswered < QUESTIONS_PER_ROUND) {
      showToast('至少完成一轮才能提前结束');
      return;
    }
    finish(calculateMBTI(questions.slice(0, totalAnswered), answers));
  }

  // ========== intro ==========
  if (phase === 'intro') {
    return (
      <div className="page quiz-page">
        <PageHeading title="AI 驱动的人格测试" subtitle={`${TOTAL_ROUNDS} 轮 × ${QUESTIONS_PER_ROUND} 题，每轮 AI 分析你的人格倾向，并出下一轮题。`} />
        <Card badge="开始之前">
          <ul style={{ lineHeight: 1.9, paddingLeft: 18 }}>
            <li>共 <strong>{TOTAL_QUESTIONS} 题</strong>，每 10 题为一轮。</li>
            <li>每轮结束，AI 会给出阶段性人格分析，并针对不确定的维度出下一轮题。</li>
            <li>每题用 7 点量表选择"符合程度"，凭第一感觉作答。</li>
            <li>结果保存在本地浏览器，下次打开仍然有效。</li>
            <li>需要先在首页或这里配置 LLM 才能使用 AI 出题功能。</li>
          </ul>
          <div className="button-row" style={{ marginTop: 20 }}>
            <Button onClick={start}>开始测试</Button>
            <Button variant="ghost" onClick={() => onChangePage('home')}>返回首页</Button>
          </div>
        </Card>
        <LLMConfigModal
          open={showConfigModal}
          forceSetup
          onClose={() => setShowConfigModal(false)}
          onSaved={() => { setShowConfigModal(false); start(); }}
        />
      </div>
    );
  }

  // ========== analyzing ==========
  if (phase === 'analyzing') {
    return (
      <div className="page quiz-page">
        <PageHeading title="AI 正在分析中..." subtitle={`已完成第 ${roundIdx + 1} 轮，正在生成阶段性分析与下一轮题目`} />
        <Card>
          <div style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.7 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🧠</div>
            <p>QuizAgent 正在基于你前面 {(roundIdx + 1) * QUESTIONS_PER_ROUND} 题的回答，分析你的人格倾向...</p>
          </div>
        </Card>
      </div>
    );
  }

  // ========== quiz ==========
  if (phase === 'quiz') {
    const latestAnalysis = analyses[analyses.length - 1];
    return (
      <div className="page quiz-page">
        <PageHeading
          title="AI 驱动的人格测试"
          subtitle={`第 ${roundIdx + 1} / ${TOTAL_ROUNDS} 轮 · 已完成 ${totalAnswered} / ${TOTAL_QUESTIONS} 题`}
        />

        <div style={{
          height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.08)',
          overflow: 'hidden', margin: '0 0 20px'
        }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: 'linear-gradient(90deg,#c8a8ff,#ffb1e0)',
            transition: 'width .3s'
          }} />
        </div>

        {agentError && (
          <Card badge="AI 出题失败">
            <p style={{ color: '#c44', margin: 0 }}>{agentError}</p>
            <div className="button-row" style={{ marginTop: 12 }}>
              <Button onClick={submitRound}>重试</Button>
              <Button variant="secondary" onClick={finishEarly}>用已答内容直接出结果</Button>
            </div>
          </Card>
        )}

        {/* 题目（左）+ 小紫分析（右） */}
        <div className="quiz-layout" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: 20,
          alignItems: 'start'
        }}>
          <Card>
            <ol style={{ paddingLeft: 0, margin: 0, listStyle: 'none' }}>
              {currentRoundQuestions.map((q, idx) => (
                <li key={q.id} style={{ marginBottom: 28 }}>
                  <div style={{ marginBottom: 12, fontWeight: 500 }}>
                    <span style={{
                      display: 'inline-block',
                      minWidth: 28,
                      marginRight: 8,
                      color: '#7b4ad6',
                      fontWeight: 600
                    }}>
                      {roundIdx * QUESTIONS_PER_ROUND + idx + 1}.
                    </span>
                    {q.text}
                  </div>
                  <LikertSlider
                    options={SCALE_OPTIONS}
                    value={answers[q.id]}
                    onChange={(v) => pick(q.id, v)}
                  />
                </li>
              ))}
            </ol>
          </Card>

          {/* 右侧：小紫 + 分析气泡（sticky） */}
          <aside style={{ position: 'sticky', top: 20 }}>
            <div style={{
              background: 'linear-gradient(160deg, rgba(200,168,255,0.12), rgba(255,177,224,0.12))',
              borderRadius: 20,
              padding: 16,
              border: '1px solid rgba(168,123,255,0.18)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <PurpleSage mood={latestAnalysis ? 'happy' : 'wave'} size={140} />
              </div>
              <div style={{ textAlign: 'center', fontWeight: 600, color: '#7b4ad6', marginBottom: 10 }}>
                小紫 · 你的人格观察者
              </div>

              <div style={{
                background: '#fff',
                borderRadius: 14,
                padding: '12px 14px',
                fontSize: 13,
                lineHeight: 1.75,
                boxShadow: '0 2px 10px rgba(123,74,214,0.08)',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: -8,
                  left: '50%',
                  transform: 'translateX(-50%) rotate(45deg)',
                  width: 14,
                  height: 14,
                  background: '#fff',
                  borderTopLeftRadius: 3
                }} />

                {latestAnalysis ? (
                  <>
                    <div style={{ fontSize: 12, color: '#7b4ad6', marginBottom: 6, fontWeight: 600 }}>
                      第 {latestAnalysis.roundIdx + 1} 轮分析 · 推断 {latestAnalysis.mbti}
                    </div>
                    <div style={{ color: '#333' }}>{latestAnalysis.text}</div>
                    <div style={{ marginTop: 8, fontSize: 11, color: '#999' }}>
                      E {latestAnalysis.percents.E}% · S {latestAnalysis.percents.S}% · T {latestAnalysis.percents.T}% · J {latestAnalysis.percents.J}%
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#666' }}>
                    你好，我是小紫。先把这 10 题做完，我会在每轮结束时告诉你我观察到的人格倾向。
                  </div>
                )}
              </div>

              {analyses.length > 1 && (
                <details style={{ marginTop: 12, fontSize: 12 }}>
                  <summary style={{ cursor: 'pointer', color: '#7b4ad6' }}>
                    查看前 {analyses.length - 1} 轮分析
                  </summary>
                  <div style={{ marginTop: 8 }}>
                    {analyses.slice(0, -1).map((a, i) => (
                      <div key={i} style={{
                        background: 'rgba(255,255,255,0.6)',
                        padding: 10,
                        borderRadius: 10,
                        marginBottom: 6
                      }}>
                        <div style={{ fontWeight: 600, color: '#7b4ad6' }}>
                          第 {a.roundIdx + 1} 轮 · {a.mbti}
                        </div>
                        <div style={{ marginTop: 4, opacity: 0.8 }}>{a.text}</div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </aside>
        </div>

        <div className="button-row" style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'space-between' }}>
          <Button variant="ghost" onClick={finishEarly}>提前结束</Button>
          <Button onClick={submitRound}>
            {roundIdx < TOTAL_ROUNDS - 1 ? '提交本轮，AI 出下一轮' : '提交并查看最终结果'}
          </Button>
        </div>
      </div>
    );
  }

  // ========== result ==========
  const desc = MBTI_DESCRIPTIONS[result.mbti] || { nickname: '', summary: '', advice: '' };
  const dimensions = [
    { left: 'E 外向', right: 'I 内向', leftPct: result.percents.E },
    { left: 'S 感觉', right: 'N 直觉', leftPct: result.percents.S },
    { left: 'T 思维', right: 'F 情感', leftPct: result.percents.T },
    { left: 'J 判断', right: 'P 知觉', leftPct: result.percents.J }
  ];

  return (
    <div className="page quiz-page">
      <PageHeading title="你的人格类型" subtitle="结果已保存到本地，翻译器与相处指南会自动使用这个 MBTI。" icon="🎉" />

      <Card badge="测试结果">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{
            fontSize: 56, fontWeight: 700,
            background: 'linear-gradient(135deg,#a87bff,#ff7ec1)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            {result.mbti}
          </div>
          <div>
            <h2 style={{ margin: 0 }}>{desc.nickname}</h2>
            <p style={{ margin: '6px 0 0', opacity: 0.75 }}>{desc.summary}</p>
          </div>
        </div>
      </Card>

      <Card badge="四个维度">
        {dimensions.map((d, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span>{d.left} · {d.leftPct}%</span>
              <span>{100 - d.leftPct}% · {d.right}</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ width: `${d.leftPct}%`, height: '100%', background: 'linear-gradient(90deg,#a87bff,#ff9ecf)' }} />
            </div>
          </div>
        ))}
      </Card>

      {analyses.length > 0 && (
        <Card badge="AI 各轮分析回顾">
          {analyses.map((a, i) => (
            <details key={i} style={{ marginBottom: 10 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 500 }}>
                第 {a.roundIdx + 1} 轮 · 当时推断：{a.mbti}
              </summary>
              <p style={{ margin: '6px 0 0', lineHeight: 1.7, opacity: 0.85 }}>{a.text}</p>
            </details>
          ))}
        </Card>
      )}

      <Card badge="沟通建议">
        <p style={{ lineHeight: 1.8, margin: 0 }}>{desc.advice}</p>
      </Card>

      <div className="button-row" style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Button onClick={() => onChangePage('translator')}>用这个人格去翻译</Button>
        <Button variant="secondary" onClick={() => onChangePage('guide')}>查看相处指南</Button>
        <Button variant="ghost" onClick={retake}>重新测试</Button>
      </div>
    </div>
  );
}

function PageHeading({ title, subtitle, icon = '🪞' }) {
  return (
    <section className="page-heading">
      <span className="page-icon">{icon}</span>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </section>
  );
}
