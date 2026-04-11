// src/pages/Launcher.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/StorageService';
import FloatingLabelSelect from '../components/FloatingLabelSelect';
import styles from '../styles/pages/Launcher.module.css';

const Launcher = () => {
    const [tournaments, setTournaments] = useState([]);
    const [name, setName] = useState('');
    const [maxTables, setMaxTables] = useState(1);
    const [maxGames, setMaxGames] = useState('フリー');
    const [mode, setMode] = useState('normal');
    const [activeMenu, setActiveMenu] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        setTournaments(StorageService.listTournaments());
    }, []);

    const refreshList = () => {
        const list = StorageService.listTournaments();
        setTournaments(list);
    };

    useEffect(() => {
        refreshList();
    }, []);

    const handleCreate = (e) => {
        e.preventDefault();
        try {
            const filename = StorageService.createTournament(name, Number(maxTables), maxGames, mode);
            navigate(`/t/${filename}/dashboard`);
        } catch (err) {
            alert("大会の作成に失敗しました。");
        }
    };

    const handleDelete = (e, targetName) => {
        e.stopPropagation();
        if (window.confirm(`大会「${targetName}」を削除してもよろしいですか？`)) {
            StorageService.deleteTournament(targetName);
            setActiveMenu(null);
            refreshList();
        }
    };

    const handleJsonImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!data.tournament_info || !data.players) {
                alert("大会データの形式が正しくありません。");
                return;
            }

            const filename = file.name.replace('.json', '') || `import_${Date.now()}`;
            StorageService.saveTournament(filename, data);
            alert(`「${data.tournament_info.name}」をインポートしました。`);
            window.location.reload();

        } catch (err) {
            console.error("Import error:", err);
            alert("ファイルの読み込みに失敗しました。正しいJSONファイルを選択してください。");
        }

        e.target.value = "";
    };

    return (
        <div className={styles.page}>
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
                        label="一人あたりの対局数" name="max_games" value={maxGames}
                        onChange={e => setMaxGames(e.target.value)}
                        options={[
                            { label: 'フリー', value: 'フリー' },
                            { label: '1戦', value: '1' },
                            { label: '2戦', value: '2' },
                            { label: '3戦', value: '3' },
                            { label: '4戦', value: '4' },
                        ]}
                    />
                    <FloatingLabelSelect
                        label="モード選択" name="mode" value={mode}
                        onChange={e => setMode(e.target.value)}
                        options={[
                            { label: '通常モード', value: 'normal' },
                            { label: '紅白戦モード', value: 'kouhaku' },
                        ]}
                    />
                    <button type="submit" className="btn-primary">新しい大会を開始！</button>
                </form>
            </div>

            {tournaments.length > 0 && (
                <>
                    <h3 className="sub-title">過去の大会</h3>
                    <div className="card">
                        {tournaments.map(f => (
                            <div key={f} className={styles.historyItem}>
                                <button className={styles.btnHistory} onClick={() => navigate(`/t/${f}/dashboard`)}>
                                    {f}
                                </button>

                                <div className={styles.menuContainer}>
                                    <button
                                        className={styles.btnMenuTrigger}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenu(activeMenu === f ? null : f);
                                        }}
                                    >
                                        ⋮
                                    </button>

                                    {activeMenu === f && (
                                        <div className={styles.dropdownMenu}>
                                            <button
                                                className={styles.btnDelete}
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

            <div className={styles.importArea}>
                <p className="hint-text">外部から保存したJSONファイルを取り込めます</p>
                <label className={styles.importLabel}>
                    📥 JSONファイルを入力
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleJsonImport}
                        style={{ display: 'none' }}
                    />
                </label>
            </div>
        </div>
    );
};

export default Launcher;
