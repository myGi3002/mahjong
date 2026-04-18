// src/components/dashboard/PlayerRegisterForm.jsx
import React, { useState } from 'react';

/**
 * 参加者登録フォーム。
 * 大会開始後（roundCount > 0 かつ フリーでない）はロックされる。
 *
 * props:
 *   maxGames   - 大会の対局数設定（'フリー' または数値文字列）
 *   roundCount - 現在のラウンド数
 *   onRegister - 登録ボタン押下時のコールバック (playerName: string) => void
 */
const PlayerRegisterForm = ({ maxGames, roundCount, onRegister }) => {
    const [newName, setNewName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        onRegister(newName);
        setNewName('');
    };

    const isLocked = maxGames !== 'フリー' && roundCount > 0;

    if (isLocked) {
        return <p>※対局開始後は追加できません</p>;
    }

    return (
        <form onSubmit={handleSubmit} className="inline-form">
            <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="名前"
                required
            />
            <button type="submit" className="btn-primary add-btn">追加</button>
        </form>
    );
};

export default PlayerRegisterForm;
