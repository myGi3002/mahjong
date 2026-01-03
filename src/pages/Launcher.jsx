// src/pages/Launcher.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/StorageService';
import FloatingLabelSelect from '../components/FloatingLabelSelect';

const Launcher = () => {
    const [tournaments, setTournaments] = useState([]);
    const [name, setName] = useState('');
    const [maxTables, setMaxTables] = useState(1);
    const [maxGames, setMaxGames] = useState('フリー');
    const [mode, setMode] = useState('normal');
    const [activeMenu, setActiveMenu] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // localStorage から大会一覧を取得
        setTournaments(StorageService.listTournaments());
    }, []);

    // ★ 一覧を再取得して画面を更新する関数
    const refreshList = () => {
        const list = StorageService.listTournaments(); // ストレージから最新一覧を取得
        setTournaments(list); // Stateを更新することで再レンダリングを発生させる
    };

    useEffect(() => {
        refreshList(); // 初回読み込み時
    }, []);

    const handleCreate = (e) => {
        e.preventDefault();
        try {
            // ストレージに新規保存
            const filename = StorageService.createTournament(name, Number(maxTables), maxGames, mode);
            navigate(`/t/${filename}/dashboard`);
        } catch (err) {
            alert("大会の作成に失敗しました。");
        }
    };

    // ★ 削除処理
    const handleDelete = (e, targetName) => {
        e.stopPropagation(); // ボタンクリック時のイベント伝播を止める
        
        if (window.confirm(`大会「${targetName}」を削除してもよろしいですか？`)) {
            // 1. 物理削除を実行
            StorageService.deleteTournament(targetName); 
            
            // 2. メニューを閉じる
            setActiveMenu(null); 
            
            // 3. 一覧を最新状態に更新（これが実質的なリロードになります）
            refreshList(); 
        }
    };

    return (
        <div className="launcher-page">
            <h1 className="page-title">大会を開く</h1>
            <div className="card">
                <form onSubmit={handleCreate}>
                    <div className="input-group">
                        <label className="simple-label">大会名</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="例: test01" required />
                    </div>
                    <div className="input-group">
                        <label className="simple-label">使用卓数</label>
                        <input type="number" value={maxTables} onChange={e => setMaxTables(e.target.value)} min="1" />
                    </div>
                    <FloatingLabelSelect 
                        label="対局数設定" name="max_games" value={maxGames} 
                        onChange={e => setMaxGames(e.target.value)}
                        options={[{label:'フリー', value:'フリー'}, {label:'1戦', value:'1'}, {label:'2戦', value:'2'}, {label:'3戦', value:'3'}, {label:'4戦', value:'4'}]}
                    />
                    <FloatingLabelSelect 
                        label="モード選択" name="mode" value={mode} 
                        onChange={e => setMode(e.target.value)}
                        options={[{label:'通常モード', value:'normal'}, {label:'紅白戦モード', value:'kouhaku'}]}
                    />
                    <button type="submit" className="btn-primary">新しい大会を開始！</button>
                </form>
            </div>

            {tournaments.length > 0 && (
                <>
                    <h3 className="sub-title">過去の大会</h3>
                    <div className="card history-list">
                        {tournaments.map(f => (
                            <div key={f} className="history-item-container">
                                <button className="btn-history" onClick={() => navigate(`/t/${f}/dashboard`)}>
                                    {f}
                                </button>
                                
                                {/* ★ メニューボタン（⋮）の追加 */}
                                <div className="menu-container">
                                    <button 
                                        className="btn-menu-trigger" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenu(activeMenu === f ? null : f);
                                        }}
                                    >
                                        ⋮
                                    </button>
                                    
                                    {/* ★ 削除ボタン（メニューが開いている時だけ表示） */}
                                    {activeMenu === f && (
                                        <div className="dropdown-menu">
                                            <button 
                                                className="btn-delete" 
                                                onClick={(e) => handleDelete(e, f)}
                                            >
                                                削除
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
export default Launcher;