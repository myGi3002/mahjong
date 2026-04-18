// src/pages/ScoreInput.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/StorageService';
import styles from '../styles/pages/ScoreInput.module.css';
import type { Tournament } from '../types';

const ScoreInput = () => {
    const { filename, roundNum, tableId } = useParams<{
        filename: string;
        roundNum: string;
        tableId: string;
    }>();
    const navigate = useNavigate();
    const [data, setData] = useState<Tournament | null>(null);
    const [scores, setScores] = useState<(number | string)[]>(['', '', '', '']);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        const tData = StorageService.getTournament(filename!);
        setData(tData);
        if (!tData) return;
        const table = tData.rounds[Number(roundNum) - 1].tables.find(t => t.table_id === Number(tableId));
        if (table?.is_recorded) setScores(table.scores.map(s => s / 100));
    }, [filename, roundNum, tableId]);

    if (!data) return <div>読み込み中...</div>;

    const round = data.rounds[Number(roundNum) - 1];
    const table = round.tables.find(t => t.table_id === Number(tableId));
    if (!table) return <div>卓データが見つかりません</div>;

    const playerIds = table.player_ids;
    const playerMap = Object.fromEntries(data.players.map(p => [p.id, p]));
    const settings = data.tournament_info.settings;
    const targetTotal = settings.start_pts * 4;

    const handleInput = (idx: number, val: string) => {
        const newScores = [...scores];
        newScores[idx] = val;
        const filled = newScores.filter((s, i) => i !== 3 && s !== '');
        if (filled.length === 3) {
            const sum = filled.reduce((acc, s) => acc + Number(s), 0);
            newScores[3] = targetTotal - sum;
        }
        setScores(newScores);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (i < 3) {
                inputRefs.current[i + 1]?.focus();
            } else {
                inputRefs.current[i]?.blur();
            }
        }
    };

    const handleSave = () => {
        StorageService.submitScore(
            filename!,
            parseInt(roundNum!),
            parseInt(tableId!),
            scores.map(s => Number(s) * 100)
        );
        navigate(`/t/${filename}/round/${roundNum}`);
    };

    const handleToggleSign = (i: number) => {
        const currentVal = scores[i];
        let newVal: string;
        if (currentVal === '' || currentVal === '-') {
            newVal = '-';
        } else {
            newVal = (Number(currentVal) * -1).toString();
        }
        handleInput(i, newVal);
        inputRefs.current[i]?.focus();
    };

    const currentTotal = scores.reduce((a, b) => a + (Number(b) || 0), 0);

    return (
        <div>
            <h1 className="page-title">点数入力 ({tableId}卓)</h1>
            <div className="card">
                <p className={styles.alertText}>※100点単位で入力（例：30,000点 → 300）</p>
                {scores.map((s, i) => (
                    <div key={i} className={styles.inputRow}>
                        <label>
                            <span className={styles.wind}>{['東', '南', '西', '北'][i]}</span>
                            <span className={styles.playerNameLabel}>
                                {playerMap[playerIds[i]]?.name || '不明'}
                            </span>
                        </label>
                        <div className={styles.scoreInputWrapper}>
                            <input
                                type="number"
                                ref={el => { inputRefs.current[i] = el; }}
                                value={s}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInput(i, e.target.value)}
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(e, i)}
                                className={styles.largeScoreInput}
                                placeholder="0"
                                enterKeyHint={i < 3 ? 'next' : 'done'}
                                inputMode="decimal"
                            />
                            <button
                                type="button"
                                className={styles.btnToggleSign}
                                onClick={() => handleToggleSign(i)}
                            >
                                ±
                            </button>
                        </div>
                    </div>
                ))}
                <div className={styles.totalDisplay}>合計: {currentTotal} / {targetTotal}</div>
                <button onClick={handleSave} disabled={currentTotal !== targetTotal} className="btn-primary">
                    保存する
                </button>
            </div>
        </div>
    );
};

export default ScoreInput;
