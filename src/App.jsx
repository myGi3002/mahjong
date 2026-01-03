// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Launcher from './pages/Launcher';
import Dashboard from './pages/Dashboard';
import PlayerDetail from './pages/PlayerDetail';
import RoundPrepare from './pages/RoundPrepare'; // 新しく追加
import RoundTables from './pages/RoundTables';
import ScoreInput from './pages/ScoreInput';
import Settings from './pages/Settings';
import './styles/index.css';

/**
 * 麻雀大会マネージャー メインルーティング設定
 * URL設計案に基づき、大会ファイル名をパスに含めることでリロード耐性を持たせています
 */
function App() {
    return (
        <BrowserRouter>
            {/* 全ページ共通のレイアウトコンテナ */}
            <div className="container">
                <Routes>
                    {/* 1. ホーム / 大会ランチャー */}
                    <Route path="/" element={<Launcher />} />

                    {/* 2. 大会運営ダッシュボード */}
                    <Route path="/t/:filename/dashboard" element={<Dashboard />} />

                    {/* ★ 追加：プレイヤー詳細画面 */}
                    <Route path="/t/:filename/player/:playerId" element={<PlayerDetail />} />

                    {/* 3. 卓組みプレビュー（対局開始前の最終確認） */}
                    <Route path="/t/:filename/round/prepare" element={<RoundPrepare />} />

                    {/* 4. ラウンド卓一覧 */}
                    <Route path="/t/:filename/round/:roundNum" element={<RoundTables />} />

                    {/* 5. 点数入力画面 */}
                    <Route path="/t/:filename/round/:roundNum/table/:tableId" element={<ScoreInput />} />

                    {/* 6. 詳細設定（ウマ・オカ等の再計算） */}
                    <Route path="/t/:filename/settings" element={<Settings />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;