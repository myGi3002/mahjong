// src/pages/RoundTables.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/StorageService';
import styles from '../styles/pages/RoundTables.module.css';
import type { Tournament } from '../types';

const RoundTables = () => {
    const { filename, roundNum } = useParams<{ filename: string; roundNum: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<Tournament | null>(null);

    const rNum = parseInt(roundNum!);
    const rIdx = rNum - 1;

    useEffect(() => {
        const tournamentData = StorageService.getTournament(filename!);
        setData(tournamentData);
    }, [filename, roundNum]);

    if (!data) return <div className="container">読み込み中...</div>;

    if (!data.rounds[rIdx]) {
        return (
            <div className="container">
                <p>第 {rNum} 回戦のデータが見つかりません。</p>
                <Link to={`/t/${filename}/dashboard`} className="btn-secondary">TOPに戻る</Link>
            </div>
        );
    }

    const round = data.rounds[rIdx];
    const playerMap = Object.fromEntries(data.players.map(p => [p.id, p]));

    return (
        <div>
            {/* 回戦タブ */}
            <div className={styles.selectorTabs}>
                {data.rounds.map(r => (
                    <button
                        key={r.round_number}
                        className={`${styles.tabBtn} ${rNum === r.round_number ? styles.tabBtnActive : ''}`}
                        onClick={() => navigate(`/t/${filename}/round/${r.round_number}`)}
                    >
                        {r.round_number}回戦
                    </button>
                ))}
            </div>

            {/* ナビゲーション */}
            <div className={styles.roundNav}>
                <button
                    onClick={() => navigate(`/t/${filename}/round/${rNum - 1}`)}
                    disabled={rNum <= 1}
                    className={styles.navArrow}
                >◀</button>
                <h1 className={styles.roundTitle}>第 {rNum} 回戦</h1>
                <button
                    onClick={() => navigate(`/t/${filename}/round/${rNum + 1}`)}
                    disabled={rNum >= data.rounds.length}
                    className={styles.navArrow}
                >▶</button>
            </div>

            <p className="hint-text">卓をタップすると点数入力できます</p>

            {/* 卓グリッド */}
            <div className={styles.tablesGrid}>
                {round.tables.map(table => (
                    <Link
                        key={table.table_id}
                        to={`/t/${filename}/round/${rNum}/table/${table.table_id}`}
                        className={styles.tableCardLink}
                    >
                        <div className={`${styles.tableCard} ${table.is_recorded ? styles.tableCardRecorded : ''}`}>
                            <div className={styles.tableHeader}>
                                第 {table.table_id} 卓 {table.is_recorded && '✅'}
                            </div>
                            <div className={styles.seatList}>
                                {table.player_ids.map((pid, i) => (
                                    <div key={pid} className={styles.seatRow}>
                                        <span className={styles.wind}>{['東', '南', '西', '北'][i]}</span>
                                        <span className={styles.playerName}>{playerMap[pid]?.name || '不明'}</span>
                                        {table.is_recorded && (
                                            <span className={styles.playerScore}>{table.points[i]}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* フッター */}
            <div className="footer-controls">
                <Link
                    to={`/t/${filename}/round/prepare`}
                    className="btn-outline"
                    style={{ textAlign: 'center', textDecoration: 'none', marginBottom: '10px' }}
                >
                    卓組みを見る
                </Link>
                <Link to={`/t/${filename}/dashboard`} className="btn-secondary">TOPに戻る</Link>
            </div>
        </div>
    );
};

export default RoundTables;
