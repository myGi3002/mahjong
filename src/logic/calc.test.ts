// src/logic/calc.test.ts
// calc.ts の calculatePoints が「麻雀の点数計算として当然成り立つこと」を確認するテスト
import { describe, it, expect } from 'vitest';
import { calculatePoints } from './calc';
import type { TournamentSettings } from '../types';

// README のデータ構造例と同じ設定（25000点持ち・30000点返し・ウマ10-30）
const settings = {
  uma_type: '10-30',
  start_pts: 250,
  return_pts: 300,
  shizumi_uma: {
    '1': [12, -1, -3, -8],
    '2': [8, 4, -4, -8],
    '3': [8, 3, 1, -12],
  },
} as TournamentSettings;

describe('calculatePoints', () => {
  it('4人の順位点の合計はゼロになる', () => {
    const points = calculatePoints([35000, 28000, 22000, 15000], settings);
    const total = points.reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(0, 5);   // 小数の誤差を許容して比較
  });

  it('素点が一番高い人が一番高い順位点になる', () => {
    const points = calculatePoints([15000, 35000, 22000, 28000], settings);
    expect(Math.max(...points)).toBe(points[1]);
    expect(Math.min(...points)).toBe(points[0]);
  });

  it('4人の結果が配列で返ってくる', () => {
    const points = calculatePoints([25000, 25000, 25000, 25000], settings);
    expect(points).toHaveLength(4);
  });
});
