import { Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PlayerInfoPage from './pages/PlayerInfoPage';
import GameHubPage from './pages/GameHubPage';
import ConnectionsPage from './pages/ConnectionsPage';
import CrosswordPage from './pages/CrosswordPage';
import CompletionPage from './pages/CompletionPage';
import LeaderboardPage from './pages/LeaderboardPage';
import NotAvailablePage from './pages/NotAvailablePage';
import PuzzleLockedPage from './pages/PuzzleLockedPage';
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
        <h1>CTG</h1>
        <div className="subtitle">{isAdmin ? 'Puzzle Admin' : 'Monday Morning Games'}</div>
      </header>
      <Routes>
        {/* Player routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<PlayerInfoPage />} />
        <Route path="/game" element={<GameHubPage />} />
        <Route path="/game/connections" element={<ConnectionsPage />} />
        <Route path="/game/crossword" element={<CrosswordPage />} />
        <Route path="/complete" element={<CompletionPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/not-available" element={<NotAvailablePage />} />
        <Route path="/puzzle-locked" element={<PuzzleLockedPage />} />

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
