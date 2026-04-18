// src/components/dashboard/RoundProgressGrid.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/components/dashboard/RoundProgressGrid.module.css';

/**
 * ダッシュボードの対局進行状況グリッド。
 * 各回戦の卓ボタンを横スクロールで表示する。
 *
 * props:
 *   rounds   - 全ラウンドのデータ配列
 *   filename - URLに使う大会ファイル名
 */
const RoundProgressGrid = ({ rounds, filename }) => {
    return (
        <div className={styles.grid}>
            {rounds.map(round => {
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
    );
};

export default RoundProgressGrid;
