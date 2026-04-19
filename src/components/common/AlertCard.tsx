// src/components/common/AlertCard.tsx
import React from 'react';
import styles from '../../styles/components/common/AlertCard.module.css';

/** AlertCard のprops */
interface AlertCardProps {
    title: string;
    messages: string[];
    footer?: string;    // 省略可能（?をつけるとオプショナルになる）
}

/**
 * 警告・注意事項を表示する汎用カード。
 * messages が空の場合は何も表示しない。
 */
const AlertCard = ({ title, messages, footer }: AlertCardProps) => {
    if (messages.length === 0) return null;

    return (
        <div className={`card ${styles.alertCard}`}>
            <h3 className={styles.alertTitle}>{title}</h3>
            <ul className={styles.alertList}>
                {messages.map((msg, i) => (
                    <li key={i}>{msg}</li>
                ))}
            </ul>
            {footer && <p className="hint-text small">{footer}</p>}
        </div>
    );
};

export default AlertCard;
