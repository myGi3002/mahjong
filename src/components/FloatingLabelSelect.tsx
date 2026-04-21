// src/components/FloatingLabelSelect.tsx
import React from 'react';
import styles from '../styles/components/FloatingLabelSelect.module.css';

/** セレクトボックスの選択肢 */
interface SelectOption {
    label: string;
    value: string;
}

/** FloatingLabelSelect のprops */
interface FloatingLabelSelectProps {
    label: string;
    name?: string;
    value: string;
    options: SelectOption[];
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

/**
 * フローティングラベル付きセレクトボックス。
 * 選択状態になるとラベルが上にアニメーションする。
 */
const FloatingLabelSelect = ({ label, name, options, value, onChange }: FloatingLabelSelectProps) => {
    return (
        <div className={styles.wrapper}>
            <select
                className={styles.select}
                name={name}
                value={value}
                onChange={onChange}
                required
            >
                <option value="" hidden disabled></option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <span className={styles.bar}></span>
            <label className={styles.label}>{label}</label>
        </div>
    );
};

export default FloatingLabelSelect;
