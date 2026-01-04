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
        const element = exportRef.current;
        // 画像生成時のみ一時的に表示させる
        element.style.display = 'block';

        const canvas = await html2canvas(element, {
            scale: 2, // 高解像度で出力
            backgroundColor: "#ffffff",
        });

        element.style.display = 'none'; // 生成後はまた隠す

        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        const link = document.createElement('a');
        link.download = `${tournament.tournament_info.name}_対戦表.jpg`;
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
            <div className="multi-round-list">
                {roundsPreview?.map(round => (
                    <div key={round.round_number} className="round-card">
                        <h3 className="round-number-title">第 {round.round_number} 回戦</h3>
                        <div className="preview-tables-grid">
                            {round.tables.map(table => (
                                <div key={table.table_id} className="table-mini-card">
                                    <div className="table-mini-header">{table.table_id}卓</div>
                                    <div className="player-names-list">
                                        {/* ★ 修正：インデックス i を使って風を表示 */}
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
                        {round.resting_player_ids?.length > 0 && (
                            <div className="resting-info">
                                <span>抜け番: </span>
                                {round.resting_player_ids.map(pid => playerMap[pid]?.name).join(', ')}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="card">
                <button onClick={handleExportImage} className="btn-primary">
                    📸 共有用画像を生成して保存
                </button>
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
            

            {/* ★ 画像出力専用の隠しレイアウトエリア */}
            <div ref={exportRef} className="image-export-ui" style={{ display: 'none' }}>
                <div className="export-header">
                    <h1>{tournament.tournament_info.name} - 対戦表</h1>
                    <p>全 {roundsPreview.length} 回戦 / 参加者 {tournament.players.length} 名</p>
                </div>

                {roundsPreview.map(round => (
                    <div key={round.round_number} className="export-round-section">
                        <h2 className="export-round-title">第 {round.round_number} 回戦</h2>
                        <table className="export-table">
                            <thead>
                                <tr>
                                    <th>卓</th>
                                    <th>東家</th>
                                    <th>南家</th>
                                    <th>西家</th>
                                    <th>北家</th>
                                </tr>
                            </thead>
                            <tbody>
                                {round.tables.map(table => (
                                    <tr key={table.table_id}>
                                        <td className="table-num">{table.table_id}</td>
                                        {table.player_ids.map(pid => (
                                            <td key={pid} className="player-name">
                                                {playerMap[pid]?.name || "-"}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {round.resting_player_ids?.length > 0 && (
                            <div className="export-resting">
                                抜け番：{round.resting_player_ids.map(pid => playerMap[pid]?.name).join(', ')}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
export default RoundPrepare;