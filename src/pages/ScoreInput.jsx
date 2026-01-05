// src/pages/ScoreInput.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/StorageService';

const ScoreInput = () => {
    const { filename, roundNum, tableId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [scores, setScores] = useState(['', '', '', '']);
    // ★ 入力ボックスの参照を保持するための配列
    const inputRefs = useRef([]);

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

    // ★ エンターキーが押された時の処理
    const handleKeyDown = (e, i) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // 改行やフォーム送信を防ぐ
            if (i < 3) {
                // 次の入力ボックスにフォーカスを移動
                inputRefs.current[i + 1]?.focus();
            } else {
                // 最後の人の場合はキーボードを閉じる
                inputRefs.current[i]?.blur();
            }
        }
    };
    
    const handleSave = () => {
        StorageService.submitScore(filename, parseInt(roundNum), parseInt(tableId), scores.map(s => Number(s)*100));
        navigate(`/t/${filename}/round/${roundNum}`);
    };
    const handleToggleSign = (i) => {
        const currentVal = scores[i]; // 現在のスコア配列から取得
        let newVal = "";

        if (currentVal === "" || currentVal === "-") {
            newVal = "-"; // 空ならマイナス記号をセット
        } else {
            // 数値を反転させて文字列に戻す
            newVal = (Number(currentVal) * -1).toString();
        }

        // 既存の入力ハンドラを呼び出してStateを更新
        handleInput(i, newVal);

        // ★ 重要：入力欄にフォーカスを戻す
        if (inputRefs.current[i]) {
            inputRefs.current[i].focus();
        }
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
                        <div className="score-input-wrapper">
                            <input 
                                type="number" 
                                ref={el => inputRefs.current[i] = el}
                                value={s} 
                                onChange={e => handleInput(i, e.target.value)} 
                                onKeyDown={e => handleKeyDown(e, i)}
                                className="large-score-input" 
                                placeholder="0"
                                enterKeyHint={i < 3 ? "next" : "done"}
                                inputMode="decimal"
                            />
                            {/* 符号反転ボタンを追加 */}
                            <button 
                                type="button" 
                                className="btn-toggle-sign"
                                onClick={() => handleToggleSign(i)} // イベントを紐付け
                            >
                                ±
                            </button>
                        </div>
                    </div>
                ))}
                <div className="total-display">合計: {currentTotal} / {targetTotal}</div>
                <button onClick={handleSave} disabled={currentTotal !== targetTotal} className="btn-primary">保存する</button>
            </div>
        </div>
    );
};
export default ScoreInput;
