// src/pages/ScoreInput.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/StorageService';

const ScoreInput = () => {
    const { filename, roundNum, tableId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [scores, setScores] = useState(['', '', '', '']);

    useEffect(() => {
        const tData = StorageService.getTournament(filename);
        setData(tData);
        const table = tData.rounds[roundNum-1].tables.find(t => t.table_id == tableId);
        if (table.is_recorded) setScores(table.scores.map(s => s/100));
    }, [filename, roundNum, tableId]);

    if (!data) return <div>読み込み中...</div>;
    const round = data.rounds[roundNum - 1];
    const table = round.tables.find(t => t.table_id == tableId);
    const playerIds = table.player_ids;

    // ★ IDから名前を引くためのマップを作成
    const playerMap = Object.fromEntries(data.players.map(p => [p.id, p]));

    const settings = data.tournament_info.settings;
    const targetTotal = (settings.start_pts * 4);

    const handleInput = (idx, val) => {
        const newScores = [...scores];
        newScores[idx] = val;
        const filled = newScores.filter((s, i) => i !== 3 && s !== '');
        if (filled.length === 3) {
            const sum = filled.reduce((acc, s) => acc + Number(s), 0);
            newScores[3] = targetTotal - sum;
        }
        setScores(newScores);
    };

    const handleSave = () => {
        StorageService.submitScore(filename, parseInt(roundNum), parseInt(tableId), scores.map(s => Number(s)*100));
        navigate(`/t/${filename}/round/${roundNum}`);
    };

    const currentTotal = scores.reduce((a, b) => a + (Number(b) || 0), 0);

    return (
        <div className="score-input-page">
            <h1 className="page-title">点数入力 ({tableId}卓)</h1>
            <div className="card">
                <p className="alert-text">※100点単位で入力（例：30,000点 → 300）</p>
                {scores.map((s, i) => (
                    <div key={i} className="input-row">
                        {/* ★ 風の右側に名前を表示するように変更 */}
                        <label>
                            <span className="wind">{['東','南','西','北'][i]}</span>
                            <span className="player-name-label">
                                {playerMap[playerIds[i]]?.name || "不明"}
                            </span>
                        </label>
                        <input 
                            type="number" 
                            value={s} 
                            onChange={e => handleInput(i, e.target.value)} 
                            className="large-score-input" 
                        />
                    </div>
                ))}
                <div className="total-display">合計: {currentTotal} / {targetTotal}</div>
                <button onClick={handleSave} disabled={currentTotal !== targetTotal} className="btn-primary">保存する</button>
            </div>
        </div>
    );
};
export default ScoreInput;