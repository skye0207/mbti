// 人格测试结果持久化（localStorage）。
// 与 Translator/Guide 共用，作为默认 MBTI 来源。

const KEY = 'renge.quiz.result';

export function saveQuizResult(result) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...result, savedAt: Date.now() }));
    return true;
  } catch (e) {
    console.warn('保存测试结果失败：', e);
    return false;
  }
}

export function loadQuizResult() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearQuizResult() {
  localStorage.removeItem(KEY);
}
