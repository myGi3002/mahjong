// src/pages/PlayerDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StorageService } from '../services/StorageService';
import styles from '../styles/pages/PlayerDetail.module.css';

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

    const playerMap = Object.fromEntries(data.players.map(p => [p.id, p]));

    // 成績集計
    const stats = { ranks: [0, 0, 0, 0], history: [] };
    data.rounds.forEach(round => {
        round.tables.forEach(table => {
            if (table.player_ids.includes(pid) && table.is_recorded) {
                const myIdx = table.player_ids.indexOf(pid);
                const myScore = table.points[myIdx];
                const rank = table.points.filter(s => s > myScore).length + 1;
                stats.ranks[rank - 1]++;
                stats.history.push({
                    round_number: round.round_number,
                    table_id: table.table_id,
                    rank,
                    score: myScore,
                    opponents: table.player_ids.filter(id => id !== pid),
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
        <div>
            <h1 className="page-title">プレイヤー詳細</h1>

            {/* 名前変更 */}
            <div className="card">
                <h3>プレイヤー情報</h3>
                <div className="inline-form">
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} />
                    <button onClick={handleUpdateName} className="btn-primary add-btn">更新</button>
                </div>
            </div>

            {/* 着順分布 */}
            <div className="card">
                <h3>着順分布</h3>
                <div className={styles.rankDist}>
                    {stats.ranks.map((count, i) => (
                        <div key={i} className={styles.rankBox}>
                            <div className={styles.rankLabel}>{i + 1}位</div>
                            <div className={styles.rankValue}>{count}回</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 対戦履歴 */}
            <div className="card">
                <h3>対戦履歴</h3>
                <table className={styles.historyTable}>
                    <thead>
                        <tr>
                            <th>回戦</th>
                            <th>着順</th>
                            <th>スコア</th>
                            <th>同卓プレイヤー</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.history.map((h, i) => (
                            <tr key={i}>
                                <td>{h.round_number}</td>
                                <td>
                                    <span className={`${styles.rankBadge} ${styles[`r${h.rank}`]}`}>
                                        {h.rank}
                                    </span>
                                </td>
                                <td>{h.score > 0 ? `+${h.score}` : h.score}</td>
                                <td>
                                    {h.opponents.map((oid, idx) => (
                                        <span key={oid}>
                                            <Link to={`/t/${filename}/player/${oid}`} className={styles.oppLink}>
                                                {playerMap[oid]?.name}
                                            </Link>
                                            {idx < h.opponents.length - 1 && ', '}
                                        </span>
                                    ))}
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