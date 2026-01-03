// src/pages/PlayerDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StorageService } from '../services/StorageService';

const PlayerDetail = () => {
    const { filename, playerId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [editName, setEditName] = useState('');
    const pid = parseInt(playerId);

    useEffect(() => {
        const tData = StorageService.getTournament(filename);
        if (tData) {
            setData(tData);
            const p = tData.players.find(p => p.id === pid);
            if (p) setEditName(p.name);
        }
    }, [filename, playerId]);

    if (!data) return <div className="container">読み込み中...</div>;

    const player = data.players.find(p => p.id === pid);
    const playerMap = Object.fromEntries(data.players.map(p => [p.id, p]));

    // --- 成績集計ロジック ---
    const stats = { ranks: [0, 0, 0, 0], history: [] };
    data.rounds.forEach(round => {
        round.tables.forEach(table => {
            if (table.player_ids.includes(pid) && table.is_recorded) {
                const myIdx = table.player_ids.indexOf(pid);
                const myScore = table.points[myIdx];
                
                // 着順計算（同点の場合は起親に近い方が上とする簡易版）
                const rank = table.points.filter(s => s > myScore).length + 1;
                stats.ranks[rank - 1]++;

                stats.history.push({
                    round_number: round.round_number,
                    table_id: table.table_id,
                    rank: rank,
                    score: myScore,
                    opponents: table.player_ids.filter(id => id !== pid)
                });
            }
        });
    });

    const handleUpdateName = () => {
        StorageService.updatePlayerName(filename, pid, editName);
        alert("名前を更新しました");
        navigate(`/t/${filename}/dashboard`);
    };

    return (
        <div className="player-detail-page">
            <h1 className="page-title">プレイヤー詳細</h1>

            {/* 1. 名前変更セクション */}
            <div className="card">
                <h3>プレイヤー情報</h3>
                <div className="inline-form">
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} />
                    <button onClick={handleUpdateName} className="btn-primary add-btn">更新</button>
                </div>
            </div>

            {/* 2. 着順分布セクション */}
            <div className="card">
                <h3>着順分布</h3>
                <div className="rank-dist">
                    {stats.ranks.map((count, i) => (
                        <div key={i} className="rank-box">
                            <div className="rank-label">{i + 1}位</div>
                            <div className="rank-value">{count}回</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. 対戦履歴セクション */}
            <div className="card">
                <h3>対戦履歴</h3>
                <table className="history-table">
                    <thead>
                        <tr><th>回戦</th><th>着順</th><th>スコア</th><th>同卓プレイヤー</th></tr>
                    </thead>
                    <tbody>
                        {stats.history.map((h, i) => (
                            <tr key={i}>
                                <td>{h.round_number}</td>
                                <td><span className={`rank-badge r${h.rank}`}>{h.rank}</span></td>
                                <td>{h.score > 0 ? `+${h.score}` : h.score}</td>
                                <td className="opponents-cell">
                                    {h.opponents.map(oid => (
                                        <Link key={oid} to={`/t/${filename}/player/${oid}`} className="opp-link">
                                            {playerMap[oid]?.name}
                                        </Link>
                                    )).reduce((prev, curr) => [prev, ', ', curr])}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="footer-controls">
                <Link to={`/t/${filename}/dashboard`} className="btn-secondary">戻る</Link>
            </div>
        </div>
    );
};

export default PlayerDetail;