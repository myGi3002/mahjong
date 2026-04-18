// src/pages/RoundPrepare.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/StorageService';
import { generateOptimizedMultiRounds } from '../logic/matching';
import html2canvas from 'html2canvas';
import AlertCard from '../components/common/AlertCard';
import styles from '../styles/pages/RoundPrepare.module.css';

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

    const handleExportImage = async () => {
        const element = exportRef.current;
        element.style.display = 'block';
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ffffff" });
        element.style.display = 'none';
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

    const getValidationWarnings = () => {
        const seatBiasMap = {};
        const opponentMap = {};
        const warnings = [];
        const windNames = ['東', '南', '西', '北'];

        roundsPreview.forEach(round => {
            round.tables.forEach(table => {
                table.player_ids.forEach((pid, seatIdx) => {
                    if (!seatBiasMap[pid]) seatBiasMap[pid] = [0, 0, 0, 0];
                    seatBiasMap[pid][seatIdx]++;
                    if (!opponentMap[pid]) opponentMap[pid] = [];
                    opponentMap[pid].push(...table.player_ids.filter(id => id !== pid));
                });
            });
        });

        Object.entries(seatBiasMap).forEach(([pid, counts]) => {
            counts.forEach((count, windIdx) => {
                if (count >= 3) {
                    warnings.push(`${playerMap[pid]?.name || "不明"} さんが ${windNames[windIdx]}家 を ${count}回 担当しています`);
                }
            });
        });

        const reportedPairs = new Set();
        Object.entries(opponentMap).forEach(([pid, opponents]) => {
            const counts = {};
            opponents.forEach(oid => { counts[oid] = (counts[oid] || 0) + 1; });
            Object.entries(counts).forEach(([oid, count]) => {
                if (count >= 2) {
                    const pairKey = [pid, oid].sort().join('-');
                    if (!reportedPairs.has(pairKey)) {
                        warnings.push(`${playerMap[pid]?.name || "不明"} さんと ${playerMap[oid]?.name || "不明"} さんが ${count}回 同卓しています`);
                        reportedPairs.add(pairKey);
                    }
                }
            });
        });

        return warnings;
    };

    if (!tournament) return <div className="container">読み込み中...</div>;

    const playerMap = Object.fromEntries(tournament.players.map(p => [p.id, p]));
    const isStarted = tournament.rounds.length > 0;
    const validationWarnings = getValidationWarnings();

    return (
        <div className={styles.page}>
            <h1 className="page-title">卓組み計画</h1>

            {/* 設定セクション */}
            <div className={`card ${styles.configSection}`}>
                <label className="simple-label">一人あたりの対局数：</label>
                <div className={styles.configRow}>
                    <input
                        type="number"
                        value={roundCount}
                        disabled={isStarted}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            setRoundCount(val);
                            createPreview(tournament, val);
                        }}
                    />
                    {!isStarted && (
                        <button className={styles.btnReconfig} onClick={() => createPreview(tournament, roundCount)}>
                            再構成
                        </button>
                    )}
                </div>
                {isStarted && (
                    <p className="hint-text info" style={{ marginTop: '15px' }}>
                        ※大会開始後のため、現在の計画を表示しています
                    </p>
                )}
            </div>

            {/* 警告エリア（AlertCardコンポーネントを使用） */}
            <AlertCard
                title="⚠️ スケジュールの重複・偏り"
                messages={validationWarnings}
                footer={`※人数や対局数の条件により、回避できない場合があります。\n気になる場合は「再構成」を押して、より良い組み合わせを探してください。`}
            />

            {/* プレビューリスト */}
            {roundsPreview?.map(round => (
                <div key={round.round_number} className={styles.roundCard}>
                    <h3 className={styles.roundNumberTitle}>第 {round.round_number} 回戦</h3>
                    <div className={styles.previewTablesGrid}>
                        {round.tables.map(table => (
                            <div key={table.table_id} className={styles.tableMiniCard}>
                                <div className={styles.tableMiniHeader}>{table.table_id}卓</div>
                                <div className={styles.playerNamesList}>
                                    {table.player_ids.map((pid, i) => (
                                        <div key={pid} className={styles.playerTagRow}>
                                            <span className={styles.miniWind}>{['東', '南', '西', '北'][i]}</span>
                                            <span className={styles.miniName}>{playerMap[pid]?.name || "不明"}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    {round.resting_player_ids?.length > 0 && (
                        <div className={styles.restingInfo}>
                            <span>抜け番: </span>
                            {round.resting_player_ids.map(pid => playerMap[pid]?.name).join(', ')}
                        </div>
                    )}
                </div>
            ))}

            {/* 画像出力ボタン */}
            <div className="card">
                <button onClick={handleExportImage} className="btn-primary">
                    📸 共有用画像を生成して保存
                </button>
            </div>

            {/* stickyフッター */}
            <div className={styles.stickyFooter}>
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

            {/* 画像出力専用の隠しレイアウト */}
            <div ref={exportRef} className={styles.imageExportUi} style={{ display: 'none' }}>
                <div className={styles.exportHeader}>
                    <h1>{tournament.tournament_info.name} - 対戦表</h1>
                    <p>全 {roundsPreview.length} 回戦 / 参加者 {tournament.players.length} 名</p>
                </div>
                {roundsPreview.map(round => (
                    <div key={round.round_number} className={styles.exportRoundSection}>
                        <h2 className={styles.exportRoundTitle}>第 {round.round_number} 回戦</h2>
                        <table className={styles.exportTable}>
                            <thead>
                                <tr><th>卓</th><th>東家</th><th>南家</th><th>西家</th><th>北家</th></tr>
                            </thead>
                            <tbody>
                                {round.tables.map(table => (
                                    <tr key={table.table_id}>
                                        <td className={styles.exportTableNum}>{table.table_id}</td>
                                        {table.player_ids.map(pid => (
                                            <td key={pid} className={styles.exportPlayerName}>
                                                {playerMap[pid]?.name || "-"}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {round.resting_player_ids?.length > 0 && (
                            <div className={styles.exportResting}>
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
