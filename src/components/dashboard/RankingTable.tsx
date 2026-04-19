// src/components/dashboard/RankingTable.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/components/dashboard/RankingTable.module.css';
import type { Player, Round, TournamentMode } from '../../types';

/** RankingTable のprops */
interface RankingTableProps {
    players: Player[];
    rounds: Round[];
    mode: TournamentMode;
    filename: string;
    onToggleTeam: (playerId: number) => void;
    onShuffle: () => void;
}

/**
 * ランキングテーブル。紅白戦UIも含む。
 */
const RankingTable = ({ players, rounds, mode, filename, onToggleTeam, onShuffle }: RankingTableProps) => {

    // プレイヤーごとの消化局数を計算
    const getPlayerGameStats = (playerId: number): { completed: number; total: number } => {
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
                        紅: {players
                            .filter(p => p.team === 'red')
                            .reduce((a, b) => a + (b.total_score ?? 0), 0)
                            .toFixed(1)}
                    </span>
                    <button onClick={onShuffle} className={styles.btnShuffle}>
                        チームをシャッフル
                    </button>
                    <span className={`${styles.teamScore} ${styles.teamScoreWhite}`}>
                        白: {players
                            .filter(p => p.team === 'white')
                            .reduce((a, b) => a + (b.total_score ?? 0), 0)
                            .toFixed(1)}
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
