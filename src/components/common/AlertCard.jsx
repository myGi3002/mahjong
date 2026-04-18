// src/components/common/AlertCard.jsx
import React from 'react';
import styles from '../../styles/components/common/AlertCard.module.css';

/**
 * 警告・注意事項を表示する汎用カード。
 * RoundPrepare の重複警告などで使用する。
 *
 * props:
 *   title    - カードのタイトル（例: "⚠️ スケジュールの重複・偏り"）
 *   messages - 警告メッセージの配列
 *   footer   - カード下部に表示する補足テキスト（省略可）
 */
const AlertCard = ({ title, messages, footer }) => {
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
