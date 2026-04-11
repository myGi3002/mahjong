// frontend/src/components/FloatingLabelSelect.jsx
import React from 'react';
import styles from '../styles/components/FloatingLabelSelect.module.css';

const FloatingLabelSelect = ({ label, name, options, value, onChange }) => {
    return (
        <div className={styles.wrapper}>
            <select className={styles.select} name={name} value={value} onChange={onChange} required>
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