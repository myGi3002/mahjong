// src/pages/RoundPrepare.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StorageService } from '../services/StorageService';
import { generateOptimizedMultiRounds } from '../logic/matching';
import html2canvas from 'html2canvas'; // ★ インポート

const RoundPrepare = () => {
    const { filename } = useParams();
    const navigate = useNavigate();
    const exportRef = useRef(null);
    const [tournament, setTournament] = useState(null);
    const [roundsPreview, setRoundsPreview] = useState([]);
    const [roundCount, setRoundCount] = useState(4);

    const createPreview = (tData, count) => {
        const result = generateOptimizedMultiRounds(tData.players, tData.tournament_info.max_tables, count);
        setRoundsPreview(result);
    };
    // ★ 画像出力関数
    const handleExportImage = async () => {
        if (!exportRef.current) return;
        
        const element = exportRef.current;
        // 一時的にスライド設定を解除して全表示にする
        element.classList.add('export-mode');

        const canvas = await html2canvas(element, {
            useCORS: true,
            scale: 2, // 高画質化
            backgroundColor: "#f2f2f2" // index.cssの--bgに合わせる
        });

        element.classList.remove('export-mode');

        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        const link = document.createElement('a');
        link.download = `卓組み_${tournament.tournament_info.name}.jpg`;
        link.href = dataUrl;
        link.click();
    };
    useEffect(() => {
        const tData = StorageService.getTournament(filename);
        if (tData) {
            setTournament(tData);
            const defaultCount = parseInt(tData.tournament_info.max_games) || 4;
            setRoundCount(defaultCount);
            createPreview(tData, defaultCount);
        }
    }, [filename]);
    
    // ★ 追加：座席の偏りをチェックする関数
    const getSeatBiasWarnings = () => {
        const biasMap = {}; // playerId -> [東の回数, 南の回数, 西の回数, 北の回数]
        
        roundsPreview.forEach(round => {
            round.tables.forEach(table => {
                table.player_ids.forEach((pid, seatIdx) => {
                    if (!biasMap[pid]) biasMap[pid] = [0, 0, 0, 0];
                    biasMap[pid][seatIdx]++;
                });
            });
        });

        const warnings = [];
        const windNames = ['東', '南', '西', '北'];

        Object.entries(biasMap).forEach(([pid, counts]) => {
            counts.forEach((count, windIdx) => {
                // 3回以上同じ風が重なった場合に警告
                if (count >= 3) {
                    const playerName = playerMap[pid]?.name || "不明";
                    warnings.push(`${playerName} さんが ${windNames[windIdx]}家 を ${count}回 担当しています`);
                }
            });
        });
        return warnings;
    };

    if (!tournament) return <div className="container">読み込み中...</div>;

    const playerMap = Object.fromEntries(tournament.players.map(p => [p.id, p]));
    // ★ 大会が既に開始されているか（ラウンドデータが存在するか）を判定
    const isStarted = tournament.rounds.length > 0;
    const seatWarnings = getSeatBiasWarnings();
    
    return (
        <div className="round-prepare">
            <h1 className="page-title">卓組み計画</h1>
            <div className="card">
                <button onClick={handleExportImage} className="btn-outline">
                    📸 卓組み一覧を画像(JPG)で保存
                </button>
            </div>
            
            {/* 設定セクション */}
            <div className="card config-section">
                <div className="config-row">
                    <label>一人あたりの対局数：</label>
                    <input 
                        type="number" 
                        value={roundCount} 
                        disabled={isStarted} /* 開始後は変更不可 */
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            setRoundCount(val);
                            createPreview(tournament, val);
                        }} 
                    />
                    {!isStarted && (
                        <button className="btn-outline small" onClick={() => createPreview(tournament, roundCount)}>再構成</button>
                    )}
                </div>
                {isStarted && <p className="hint-text info">※大会開始後のため、現在の計画を表示しています</p>}
            </div>
            
            {/* ★ 追加：警告表示エリア */}
            {seatWarnings.length > 0 && (
                <div className="card alert-card">
                    <h3 className="alert-title">⚠️ 座席の偏り警告</h3>
                    <ul className="alert-list">
                        {seatWarnings.map((msg, i) => (
                            <li key={i}>{msg}</li>
                        ))}
                    </ul>
                    <p className="hint-text small">気になる場合は「再構成」を押してください</p>
                </div>
            )}

            {/* プレビューリスト */}
            {/* ★ exportRefで囲む。ここが画像になる範囲 */}
            <div ref={exportRef} className="export-container">
                <div className="multi-round-list">
                    {roundsPreview?.map(round => (
                        <div key={round.round_number} className="round-card">
                            <h3 className="round-number-title">第 {round.round_number} 回戦</h3>
                            <div className="preview-tables-grid">
                                {round.tables.map(table => (
                                    <div key={table.table_id} className="table-mini-card">
                                        <div className="table-mini-header">{table.table_id}卓</div>
                                        <div className="player-names-list">
                                            {table.player_ids.map((pid, i) => (
                                                <div key={pid} className="player-tag-row">
                                                    <span className="mini-wind">{['東','南','西','北'][i]}</span>
                                                    <span className="mini-name">{playerMap[pid]?.name || "不明"}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="footer-controls sticky">
                {/* ★ 大会が始まっていない場合のみ「確定」ボタンを表示 */}
                {!isStarted ? (
                    <button className="btn-primary" onClick={() => {
                        StorageService.saveAllRounds(filename, roundsPreview);
                        navigate(`/t/${filename}/round/1`);
                    }}>
                        この内容で対局を開始する！
                    </button>
                ) : (
                    <button className="btn-secondary" onClick={() => navigate(`/t/${filename}/dashboard`)}>
                        ダッシュボードに戻る
                    </button>
                )}
            </div>
        </div>
    );
};
export default RoundPrepare;