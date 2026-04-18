// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StorageService } from '../services/StorageService';
import RoundProgressGrid from '../components/dashboard/RoundProgressGrid';
import PlayerRegisterForm from '../components/dashboard/PlayerRegisterForm';
import RankingTable from '../components/dashboard/RankingTable';

/**
 * 大会ダッシュボード。
 * データ取得・更新のロジックを担当し、表示は各コンポーネントに委譲する。
 */
const Dashboard = () => {
    const { filename } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);

    useEffect(() => {
        setData(null);
        setData(StorageService.getTournament(filename));
    }, [filename]);

    const handleRegister = (playerName) => {
        const updated = StorageService.addPlayer(filename, playerName);
        setData({ ...updated });
    };

    const handleToggleTeam = (playerId) => {
        const updated = StorageService.togglePlayerTeam(filename, playerId);
        setData({ ...updated });
    };

    const handleShuffle = () => {
        const updated = StorageService.shuffleTeams(filename);
        setData({ ...updated });
    };

    if (!data) return <div className="container"><h3>読み込み中...</h3></div>;

    const { tournament_info, players, rounds } = data;
    const roundCount = rounds.length;

    return (
        <div>
            <h1 className="page-title">{tournament_info.name}</h1>

            {/* 進行状況・スコア入力ショートカット */}
            {roundCount > 0 && (
                <div className="card">
                    <h2>対局進行 / スコア入力</h2>
                    <p className="hint-text">卓番号をタップして点数を入力してください</p>
                    <RoundProgressGrid rounds={rounds} filename={filename} />
                </div>
            )}

            {/* 参加者登録 */}
            <div className="card">
                <h2>参加者登録</h2>
                <PlayerRegisterForm
                    maxGames={tournament_info.max_games}
                    roundCount={roundCount}
                    onRegister={handleRegister}
                />
            </div>

            {/* ランキング */}
            <div className="card">
                <h2>現在のランキング</h2>
                <RankingTable
                    players={players}
                    rounds={rounds}
                    mode={tournament_info.mode}
                    filename={filename}
                    onToggleTeam={handleToggleTeam}
                    onShuffle={handleShuffle}
                />
            </div>

            {/* フッター */}
            <div className="footer-controls">
                {roundCount === 0 ? (
                    <button className="btn-primary" onClick={() => navigate(`/t/${filename}/round/prepare`)}>
                        卓組みを一括生成する
                    </button>
                ) : (
                    <Link to={`/t/${filename}/round/prepare`} className="btn-outline" style={{ textAlign: 'center', textDecoration: 'none' }}>
                        卓組みを確認
                    </Link>
                )}
                <div className="action-row">
                    <Link to={`/t/${filename}/settings`} className="btn-secondary">⚙️ 詳細設定</Link>
                    <button className="btn-secondary" onClick={() => StorageService.exportJSON(filename)}>JSON出力</button>
                    <Link to="/" className="btn-secondary">大会一覧へ</Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;