// src/logic/calc.ts
// 素点から順位点を算出する計算ロジック。
// Python の calc.py をJSに移植したものをさらにTS化。

import type { Tournament, TournamentSettings } from '../types';

// ウマのマップ（沈みウマ以外）
// [1位, 2位, 3位, 4位] のボーナス
const UMA_MAP: Record<string, [number, number, number, number]> = {
    '5-10':  [10,  5,  -5, -10],
    '10-20': [20, 10, -10, -20],
    '10-30': [30, 10, -10, -30],
    '20-30': [30, 20, -20, -30],
};

// デフォルトの沈みウマ設定
const DEFAULT_SHIZUMI_UMA: Record<string, [number, number, number, number]> = {
    '1': [12, -1,  -3,  -8],
    '2': [ 8,  4,  -4,  -8],
    '3': [ 8,  3,   1, -12],
};

/**
 * 素点から順位点を算出する。
 *
 * @param rawScores - 4人分の素点配列（例: [35000, 28000, 22000, 15000]）
 * @param settings  - ウマ・持ち点・返し点などの大会設定
 * @returns 4人分の順位点配列（例: [42.3, 12.1, -10.5, -43.9]）
 */
export const calculatePoints = (
    rawScores: number[],
    settings: TournamentSettings
): number[] => {

    // 1. オカの計算
    //    持ち点より返し点が高い場合、その差分が1位のボーナスになる
    const oka = (settings.return_pts - settings.start_pts) * 4 / 10;

    // 2. ウマ（順位ボーナス）の決定
    let rankingBonuses: number[];

    if (settings.uma_type === 'shizumi') {
        // 沈みウマ：持ち点（start_pts * 100）以上の人数で分岐
        const floatingCount = rawScores.filter(s => s >= settings.start_pts * 100).length;

        // 0人・4人の場合は 2人浮き を適用（ガード処理）
        const key = String(Math.max(1, Math.min(3, floatingCount)));
        const patterns = settings.shizumi_uma ?? DEFAULT_SHIZUMI_UMA;
        const uma = patterns[key] ?? DEFAULT_SHIZUMI_UMA['2'];

        // 沈みウマはオカなし
        rankingBonuses = [...uma];
    } else {
        const uma = UMA_MAP[settings.uma_type] ?? UMA_MAP['10-30'];

        // 通常ウマは1位にオカを加算
        rankingBonuses = [uma[0] + oka, uma[1], uma[2], uma[3]];
    }

    // 3. 素点を持ち点基準の増減に変換
    //    (素点 - 返し点 * 100) / 1000
    const basePoints = rawScores.map(s => (s - settings.return_pts * 100) / 1000);

    // 4. 順位付けと得点確定（同点対応）
    //    同点の場合は該当する順位ボーナスの平均を配分する
    const indexed = rawScores
        .map((score, index) => ({ index, score }))
        .sort((a, b) => b.score - a.score);

    const results = new Array<number>(4).fill(0);

    let i = 0;
    while (i < 4) {
        // 同点の範囲を探す（i〜j-1 が同点グループ）
        let j = i + 1;
        while (j < 4 && indexed[j].score === indexed[i].score) j++;

        // 同点グループの順位ボーナスの平均を計算
        const slice = rankingBonuses.slice(i, j);
        const avgBonus = slice.reduce((a, b) => a + b, 0) / slice.length;

        // グループ内の各プレイヤーに得点を確定
        for (let k = i; k < j; k++) {
            const playerIdx = indexed[k].index;
            results[playerIdx] = Math.round((basePoints[playerIdx] + avgBonus) * 10) / 10;
        }

        i = j;
    }

    return results;
};

/**
 * 全ラウンドを再集計し、プレイヤーのスコアを洗い替える。
 * 設定変更後も正確なスコアが得られるよう、毎回ゼロから計算し直す。
 *
 * @param data - 大会データ全体
 * @returns スコアが更新された大会データ
 */
export const runRecalculation = (data: Tournament): Tournament => {
    // 全プレイヤーのスコアをリセット
    data.players.forEach(p => {
        p.total_score = 0.0;
        p.games_played = 0;
    });

    data.rounds.forEach(round => {
        round.tables.forEach(table => {
            if (!table.is_recorded) return;

            // 最新の設定で順位点を再計算
            table.points = calculatePoints(table.scores, data.tournament_info.settings);

            // 各プレイヤーの合計スコアに加算
            table.player_ids.forEach((pid, idx) => {
                const player = data.players.find(p => p.id === pid);
                if (player) {
                    player.total_score = Math.round((player.total_score + table.points[idx]) * 10) / 10;
                    player.games_played += 1;
                }
            });
        });
    });

    return data;
};
