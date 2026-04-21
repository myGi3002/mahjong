// src/components/dashboard/PlayerRegisterForm.tsx
import React, { useState } from 'react';
import type { MaxGames } from '../../types';

/** PlayerRegisterForm のprops */
interface PlayerRegisterFormProps {
    maxGames: MaxGames;
    roundCount: number;
    onRegister: (playerName: string) => void;
}

/**
 * 参加者登録フォーム。
 * 大会開始後（roundCount > 0 かつ フリーでない）はロックされる。
 */
const PlayerRegisterForm = ({ maxGames, roundCount, onRegister }: PlayerRegisterFormProps) => {
    const [newName, setNewName] = useState<string>('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                placeholder="名前"
                required
            />
            <button type="submit" className="btn-primary add-btn">追加</button>
        </form>
    );
};

export default PlayerRegisterForm;
