import { useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import Toast from './components/Toast.jsx';
import Home from './pages/Home.jsx';
import Translator from './pages/Translator.jsx';
import Guide from './pages/Guide.jsx';
import Review from './pages/Review.jsx';
import Profile from './pages/Profile.jsx';
import { loadProfile, saveProfile } from './utils/storage.js';

const pages = {
  home: Home,
  translator: Translator,
  guide: Guide,
  review: Review,
  profile: Profile
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [profile, setProfile] = useState(() => loadProfile());
  const [toast, setToast] = useState('');

  const Page = useMemo(() => pages[currentPage] || Home, [currentPage]);

  function showToast(message) {
    setToast(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(''), 2200);
  }

  function handleSaveProfile(nextProfile) {
    const success = saveProfile(nextProfile);
    if (success) {
      setProfile(nextProfile);
      showToast('保存成功，译站更懂你了');
    } else {
      showToast('保存失败，请稍后再试');
    }
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
          onSaveProfile={handleSaveProfile}
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
