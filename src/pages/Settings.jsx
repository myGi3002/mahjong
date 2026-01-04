// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/StorageService';
import FloatingLabelSelect from '../components/FloatingLabelSelect';

const Settings = () => {
    const { filename } = useParams();
    const navigate = useNavigate();
    const [settings, setSettings] = useState({ uma_type: '10-30', start_pts: 250, return_pts: 300 });

    useEffect(() => {
        const tData = StorageService.getTournament(filename);
        if (tData) setSettings(tData.tournament_info.settings);
    }, [filename]);

    const handleSave = () => {
        StorageService.updateSettings(filename, settings);
        navigate(`/t/${filename}/dashboard`);
    };
    const handleShizumiChange = (count, rankIdx, val) => {
        const newShizumi = { ...settings.shizumi_uma };
        if (!newShizumi[count]) newShizumi[count] = [0, 0, 0, 0];
        newShizumi[count][rankIdx] = Number(val);
        setSettings({ ...settings, shizumi_uma: newShizumi });
    };

    return (
        <div className="settings-page">
            <h1 className="page-title">詳細設定</h1>
            <div className="card">
                {/* ウマ設定 (FloatingLabelSelect) */}
                <FloatingLabelSelect 
                    label="ウマ設定" 
                    value={settings.uma_type} 
                    onChange={e => setSettings({...settings, uma_type: e.target.value})}
                    options={[
                        {label:'5-10',value:'5-10'},
                        {label:'10-20',value:'10-20'},
                        {label:'10-30',value:'10-30'},
                        {label:'20-30',value:'20-30'},
                        {label:'沈みウマ',value:'shizumi'},
                    ]} 
                />

                {settings.uma_type === "shizumi" && (
                    <div className="shizumi-container">
                        <h3 className="sub-title">沈みウマ詳細設定</h3>
                        {/* ... (沈みウマの入力グリッド) */}
                    </div>
                )}

                {/* 持ち点・返し点の設定エリア */}
                <div className="settings-extra-fields">
                    <div className="input-group">
                        <label className="simple-label">持ち点</label>
                        <input 
                            type="number" 
                            value={settings.start_pts} 
                            onChange={e => setSettings({...settings, start_pts: Number(e.target.value)})} 
                        />
                    </div>

                    <div className="input-group">
                        <label className="simple-label">返し点</label>
                        <input 
                            type="number" 
                            value={settings.return_pts} 
                            onChange={e => setSettings({...settings, return_pts: Number(e.target.value)})} 
                        />
                    </div>
                </div>

                {/* 保存ボタン */}
                <div className="settings-action-area">
                    <button onClick={handleSave} className="btn-primary">
                        設定を保存して再計算
                    </button>
                </div>
            </div>
        </div>
    );
};
export default Settings;
