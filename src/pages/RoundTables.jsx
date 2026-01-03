// src/pages/RoundTables.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/StorageService'; // StorageServiceをインポート

const RoundTables = () => {
    const { filename, roundNum } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    
    const rNum = parseInt(roundNum);
    const rIdx = rNum - 1;

    useEffect(() => {
        // Pythonサーバーではなく、ブラウザのストレージからデータを取得
        const tournamentData = StorageService.getTournament(filename);
        setData(tournamentData);
    }, [filename, roundNum]); // 回戦番号が変わるたびに再取得

    if (!data) return <div className="container">読み込み中...</div>;

    // 指定された回戦が存在しない場合のガード
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
        <div className="round-page">
            <div className="round-selector-tabs">
                {data.rounds.map(r => (
                    <button 
                        key={r.round_number}
                        className={`tab-btn ${rNum === r.round_number ? 'active' : ''}`}
                        onClick={() => navigate(`/t/${filename}/round/${r.round_number}`)}
                    >
                        {r.round_number}回戦
                    </button>
                ))}
            </div>
            <div className="round-nav">
                <button 
                    onClick={() => navigate(`/t/${filename}/round/${rNum - 1}`)} 
                    disabled={rNum <= 1} 
                    className="nav-arrow"
                >◀</button>
                
                <h1 className="round-title">第 {rNum} 回戦</h1>
                
                <button 
                    onClick={() => navigate(`/t/${filename}/round/${rNum + 1}`)} 
                    disabled={rNum >= data.rounds.length} 
                    className="nav-arrow"
                >▶</button>
            </div>

            <p className="hint-text">卓をタップすると点数入力できます</p>

            <div className="tables-grid">
                {round.tables.map(table => (
                    <Link key={table.table_id} to={`/t/${filename}/round/${rNum}/table/${table.table_id}`} className="table-card-link">
                        <div className={`table-card ${table.is_recorded ? 'recorded' : ''}`}>
                            <div className="table-header">
                                第 {table.table_id} 卓 {table.is_recorded && '✅'}
                            </div>
                            <div className="seat-list">
                                {table.player_ids.map((pid, i) => (
                                    <div key={pid} className="seat-row">
                                        <span className="wind">{['東','南','西','北'][i]}</span>
                                        <span className="p-name">{playerMap[pid]?.name || "不明"}</span>
                                        {table.is_recorded && <span className="p-score">{table.points[i]}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="footer-controls">
                <Link to={`/t/${filename}/round/prepare`} className="btn-outline" style={{textAlign: 'center', textDecoration: 'none', marginBottom: '10px'}}>
                    卓組みを見る
                </Link>
                <Link to={`/t/${filename}/dashboard`} className="btn-secondary">TOPに戻る</Link>
            </div>
        </div>
    );
};
export default RoundTables;