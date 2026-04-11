// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StorageService } from '../services/StorageService';
import styles from '../styles/pages/Dashboard.module.css';

const Dashboard = () => {
    const { filename } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [newName, setNewName] = useState('');

    const loadData = () => {
        const tournamentData = StorageService.getTournament(filename);
        setData(tournamentData);
    };

    useEffect(() => {
        setData(null);
        loadData();
    }, [filename]);

    const handleRegister = (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        const updated = StorageService.addPlayer(filename, newName);
        setData({...updated});
        setNewName('');
    };

    const handleToggleTeam = (playerId) => {
        const updated = StorageService.togglePlayerTeam(filename, playerId);
        setData({...updated});
    };

    const handleShuffle = () => {
        const updated = StorageService.shuffleTeams(filename);
        setData({...updated});
    };

    const getPlayerGameStats = (playerId) => {
        let completed = 0;
        let total = 0;
        data.rounds.forEach(round => {
            round.tables.forEach(table => {
                if (table.player_ids.includes(playerId)) {
                    total++;
                    if (table.is_recorded) completed++;
                }
            });
        });
        return { completed, total };
    };

    if (!data) return <div className="container"><h3>読み込み中...</h3></div>;

    const roundCount = data.rounds.length;

    return (
        <div>
            <h1 className="page-title">{data.tournament_info.name}</h1>

            {/* 進行状況・スコア入力ショートカット */}
            {data.rounds.length > 0 && (
                <div className="card">
                    <h2>対局進行 / スコア入力</h2>
                    <p className="hint-text">卓番号をタップして点数を入力してください</p>
                    <div className={styles.roundProgressGrid}>
                        {data.rounds.map(round => {
                            const isRoundFinished = round.tables.every(table => table.is_recorded);
                            return (
                                <div
                                    key={round.round_number}
                                    className={`${styles.roundBlock} ${isRoundFinished ? styles.roundBlockFinished : ''}`}
                                >
                                    <Link
                                        to={`/t/${filename}/round/${round.round_number}`}
                                        className={`${styles.roundLinkTitle} ${isRoundFinished ? styles.roundLinkTitleFinished : ''}`}
                                    >
                                        第 {round.round_number} 回戦
                                        {isRoundFinished && <span className={styles.finishedMark}> ✅</span>}
                                    </Link>
                                    <div className={styles.tableBtns}>
                                        {round.tables.map(table => (
                                            <Link
                                                key={table.table_id}
                                                to={`/t/${filename}/round/${round.round_number}/table/${table.table_id}`}
                                                className={`${styles.tableBtn} ${table.is_recorded ? styles.tableBtnRecorded : ''}`}
                                            >
                                                {table.table_id}卓 {table.is_recorded ? '✅' : '📝'}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 参加者登録 */}
            <div className="card">
                <h2>参加者登録</h2>
                {(data.tournament_info.max_games === 'フリー' || roundCount === 0) ? (
                    <form onSubmit={handleRegister} className="inline-form">
                        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="名前" required />
                        <button type="submit" className="btn-primary add-btn">追加</button>
                    </form>
                ) : <p>※対局開始後は追加できません</p>}
            </div>

            {/* ランキング */}
            <div className="card">
                <h2>現在のランキング</h2>
                {data.tournament_info.mode === 'kouhaku' && (
                    <div className={styles.teamStatusBar}>
                        <span className={`${styles.teamScore} ${styles.teamScoreRed}`}>
                            紅: {data.players.filter(p => p.team === 'red').reduce((a, b) => a + (b.total_score ?? 0), 0).toFixed(1)}
                        </span>
                        <button onClick={handleShuffle} className={styles.btnShuffle}>
                            チームをシャッフル
                        </button>
                        <span className={`${styles.teamScore} ${styles.teamScoreWhite}`}>
                            白: {data.players.filter(p => p.team === 'white').reduce((a, b) => a + (b.total_score ?? 0), 0).toFixed(1)}
                        </span>
                    </div>
                )}
                <table className={styles.rankingTable}>
                    <thead>
                        <tr>
                            <th>位</th>
                            <th>名前</th>
                            <th>得点</th>
                            <th>局数</th>
                            {data.tournament_info.mode === 'kouhaku' && <th>組</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {[...data.players]
                            .sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0))
                            .map((p, i) => {
                                const stats = getPlayerGameStats(p.id);
                                return (
                                    <tr key={p.id}>
                                        <td>{i + 1}</td>
                                        <td>
                                            <Link to={`/t/${filename}/player/${p.id}`} className={styles.playerLink}>
                                                {p.name}
                                            </Link>
                                        </td>
                                        <td>{(p.total_score ?? 0).toFixed(1)}</td>
                                        <td>{stats.completed} / {stats.total}</td>
                                        {data.tournament_info.mode === 'kouhaku' && (
                                            <td>
                                                <button
                                                    className={`${styles.teamBadge} ${p.team === 'red' ? styles.teamBadgeRed : styles.teamBadgeWhite}`}
                                                    onClick={() => handleToggleTeam(p.id)}
                                                >
                                                    {p.team === 'red' ? '紅' : '白'}
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
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