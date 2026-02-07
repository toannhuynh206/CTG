import { Routes, Route, useLocation } from 'react-router-dom';
import LockGuard from './components/LockGuard';
import HomePage from './pages/HomePage';
import PlayerInfoPage from './pages/PlayerInfoPage';
import GameHubPage from './pages/GameHubPage';
import ConnectionsPage from './pages/ConnectionsPage';
import CrosswordPage from './pages/CrosswordPage';
import CompletionPage from './pages/CompletionPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminConnectionsPage from './pages/admin/AdminConnectionsPage';
import AdminCrosswordPage from './pages/admin/AdminCrosswordPage';
import AdminArchivePage from './pages/admin/AdminArchivePage';

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      <header className="header">
        <div className="header-stripe" />
        {/* Train tracks background */}
        <div className="header-tracks">
          <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 500 80">
            {/* Top track - two rails with ties */}
            <line x1="0" y1="12" x2="500" y2="12" stroke="currentColor" strokeWidth="2" />
            <line x1="0" y1="20" x2="500" y2="20" stroke="currentColor" strokeWidth="2" />
            {Array.from({ length: 34 }, (_, i) => (
              <line key={`t${i}`} x1={i * 15 + 5} y1="9" x2={i * 15 + 5} y2="23" stroke="currentColor" strokeWidth="1.5" />
            ))}
            {/* Bottom track - two rails with ties */}
            <line x1="0" y1="60" x2="500" y2="60" stroke="currentColor" strokeWidth="2" />
            <line x1="0" y1="68" x2="500" y2="68" stroke="currentColor" strokeWidth="2" />
            {Array.from({ length: 34 }, (_, i) => (
              <line key={`b${i}`} x1={i * 15 + 5} y1="57" x2={i * 15 + 5} y2="71" stroke="currentColor" strokeWidth="1.5" />
            ))}
          </svg>
        </div>
        <div className="header-inner">
          <h1>CTG</h1>
          <div className="subtitle">{isAdmin ? 'Puzzle Admin' : 'Chicago Transit Games'}</div>
        </div>
        <div className="header-stripe" />
      </header>
      <Routes>
        {/* Player routes - all wrapped with LockGuard */}
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<LockGuard><PlayerInfoPage /></LockGuard>} />
        <Route path="/game" element={<LockGuard><GameHubPage /></LockGuard>} />
        <Route path="/game/connections" element={<LockGuard><ConnectionsPage /></LockGuard>} />
        <Route path="/game/crossword" element={<LockGuard><CrosswordPage /></LockGuard>} />
        <Route path="/complete" element={<LockGuard><CompletionPage /></LockGuard>} />
        <Route path="/leaderboard" element={<LockGuard><LeaderboardPage /></LockGuard>} />

        {/* Admin routes — hidden behind secret URL */}
        <Route path="/admin/:secretKey" element={<AdminLoginPage />} />
        <Route path="/admin/:secretKey/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/:secretKey/connections" element={<AdminConnectionsPage />} />
        <Route path="/admin/:secretKey/crossword" element={<AdminCrosswordPage />} />
        <Route path="/admin/:secretKey/archive/:date" element={<AdminArchivePage />} />
      </Routes>
    </>
  );
}
