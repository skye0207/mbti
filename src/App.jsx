import { useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import Toast from './components/Toast.jsx';
import Home from './pages/Home.jsx';
import Translator from './pages/Translator.jsx';
import Guide from './pages/Guide.jsx';
import Quiz from './pages/Quiz.jsx';
import { loadQuizResult } from './utils/quizStorage.js';

const pages = {
  home: Home,
  translator: Translator,
  guide: Guide,
  quiz: Quiz
};

const FALLBACK_PROFILE = { mbti: 'ENFP', nickname: '小译友' };

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [toast, setToast] = useState('');
  // 每次切页时重新读取测试结果，保证测试完后其他页面能立刻拿到新 MBTI
  const profile = useMemo(() => {
    const quiz = loadQuizResult();
    return quiz?.mbti ? { ...FALLBACK_PROFILE, mbti: quiz.mbti } : FALLBACK_PROFILE;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const Page = useMemo(() => pages[currentPage] || Home, [currentPage]);

  function showToast(message) {
    setToast(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(''), 2200);
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <Header currentPage={currentPage} onChangePage={setCurrentPage} />
      <main className="main-container">
        <Page
          profile={profile}
          onChangePage={setCurrentPage}
          showToast={showToast}
        />
      </main>
      <footer className="footer-note">
        MBTI 仅作为沟通风格参考，不代表真实人格的全部。重要关系问题仍建议真诚沟通。
      </footer>
      <Toast message={toast} />
    </div>
  );
}
