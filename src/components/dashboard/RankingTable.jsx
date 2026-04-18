// src/components/dashboard/RankingTable.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/components/dashboard/RankingTable.module.css';

/**
 * ランキングテーブル。紅白戦UIも含む。
 *
 * props:
 *   players      - プレイヤー配列
 *   rounds       - 全ラウンドのデータ配列（局数計算に使用）
 *   mode         - 大会モード ('normal' | 'kouhaku')
 *   filename     - URLに使う大会ファイル名
 *   onToggleTeam - チームバッジ押下時のコールバック (playerId) => void
 *   onShuffle    - シャッフルボタン押下時のコールバック () => void
 */
const RankingTable = ({ players, rounds, mode, filename, onToggleTeam, onShuffle }) => {

    // プレイヤーごとの消化局数を計算
    const getPlayerGameStats = (playerId) => {
        let completed = 0;
        let total = 0;
        rounds.forEach(round => {
            round.tables.forEach(table => {
                if (table.player_ids.includes(playerId)) {
                    total++;
                    if (table.is_recorded) completed++;
                }
            });
        });
        return { completed, total };
    };

    const sortedPlayers = [...players].sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0));

    return (
        <>
            {/* 紅白戦スコアバー */}
            {mode === 'kouhaku' && (
                <div className={styles.teamStatusBar}>
                    <span className={`${styles.teamScore} ${styles.teamScoreRed}`}>
                        紅: {players.filter(p => p.team === 'red').reduce((a, b) => a + (b.total_score ?? 0), 0).toFixed(1)}
                    </span>
                    <button onClick={onShuffle} className={styles.btnShuffle}>
                        チームをシャッフル
                    </button>
                    <span className={`${styles.teamScore} ${styles.teamScoreWhite}`}>
                        白: {players.filter(p => p.team === 'white').reduce((a, b) => a + (b.total_score ?? 0), 0).toFixed(1)}
                    </span>
                </div>
            )}

            {/* ランキング表 */}
            <table className={styles.rankingTable}>
                <thead>
                    <tr>
                        <th>位</th>
                        <th>名前</th>
                        <th>得点</th>
                        <th>局数</th>
                        {mode === 'kouhaku' && <th>組</th>}
                    </tr>
                </thead>
                <tbody>
                    {sortedPlayers.map((p, i) => {
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
                                {mode === 'kouhaku' && (
                                    <td>
                                        <button
                                            className={`${styles.teamBadge} ${p.team === 'red' ? styles.teamBadgeRed : styles.teamBadgeWhite}`}
                                            onClick={() => onToggleTeam(p.id)}
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
        </>
    );
};

export default RankingTable;
