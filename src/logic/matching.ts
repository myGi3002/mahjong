// src/logic/matching.ts
// 山登り法を用いて最適化された卓組みを生成するアルゴリズム。

import type { Player, Round, Table } from '../types';

// =============================================================================
// 内部で使うローカルな型定義（このファイルの中だけで使う）
// =============================================================================

/** ペナルティ計算用のプレイヤー統計 */
interface PlayerStat {
    opponents: number[];    // これまでに同卓した相手のIDリスト
    seats: [number, number, number, number]; // 各席（東南西北）に座った回数
}

/** スワップの情報（undoSwapで元に戻すために使う） */
interface SwapInfo {
    rIdx: number;   // 対象の回戦インデックス
    t1: number;     // 入れ替え元の卓インデックス
    t2: number;     // 入れ替え先の卓インデックス
    s1: number;     // 入れ替え元の座席インデックス
    s2: number;     // 入れ替え先の座席インデックス
}

/** attemptSwapの戻り値 */
interface SwapResult {
    rounds: Round[];
    swapInfo: SwapInfo | null;
}

// =============================================================================
// メイン関数
// =============================================================================

/**
 * 山登り法を用いて最適化された卓組みスケジュールを生成する。
 *
 * @param players             - 参加プレイヤーの配列
 * @param maxTables           - 使用できる最大卓数
 * @param targetGamesPerPerson - 1人あたりの対局数
 * @returns 最適化されたラウンド配列
 */
export const generateOptimizedMultiRounds = (
    players: Player[],
    maxTables: number,
    targetGamesPerPerson: number | string
): Round[] => {
    const targetGames = Number(targetGamesPerPerson) || 1;
    if (!players || players.length < 4) return [];

    // 1. 初期スケジュールの生成（抜け番ルールだけを厳守）
    const initialRounds = createInitialSchedule(players, maxTables, targetGames);
    if (!initialRounds) return [];

    let currentRounds = initialRounds;
    let currentPenalty = calculateTotalPenalty(currentRounds, players);
    let bestRounds: Round[] = JSON.parse(JSON.stringify(currentRounds));
    let minPenalty = currentPenalty;

    // 2. 山登り法による最適化（最大5000回試行）
    const maxIterations = 5000;

    for (let i = 0; i < maxIterations; i++) {
        const { rounds: nextRounds, swapInfo } = attemptSwap(currentRounds);
        const nextPenalty = calculateTotalPenalty(nextRounds, players);

        if (nextPenalty <= currentPenalty) {
            // ペナルティが改善・同等なら採用（同等採用は停滞防止のため）
            currentPenalty = nextPenalty;
            currentRounds = nextRounds;

            if (currentPenalty < minPenalty) {
                minPenalty = currentPenalty;
                bestRounds = JSON.parse(JSON.stringify(currentRounds));
            }
        } else {
            // 改悪なら元に戻す
            undoSwap(currentRounds, swapInfo);
        }

        // 理想的な組み合わせが見つかれば終了
        if (minPenalty === 0) break;
    }

    return bestRounds;
};

// =============================================================================
// ペナルティ計算
// =============================================================================

/**
 * スケジュール全体のペナルティを計算する。
 * 低いほど良いスケジュール。
 *
 * ペナルティの重み：
 *   同じ2人が複数回同卓する → +1000（1回ごと）
 *   同じ座席に複数回座る    → +500（1回ごと）
 */
const calculateTotalPenalty = (rounds: Round[], players: Player[]): number => {
    // プレイヤーごとの統計を初期化
    const stats = players.reduce<Record<number, PlayerStat>>((acc, p) => {
        acc[p.id] = { opponents: [], seats: [0, 0, 0, 0] };
        return acc;
    }, {});

    let penalty = 0;

    rounds.forEach(round => {
        round.tables.forEach(table => {
            table.player_ids.forEach((pid, seatIdx) => {
                const pStat = stats[pid];

                // 1. 同卓者の重複チェック
                table.player_ids.forEach(oid => {
                    if (pid === oid) return;
                    if (pStat.opponents.includes(oid)) {
                        penalty += 1000;
                    }
                    pStat.opponents.push(oid);
                });

                // 2. 座席の重複チェック
                if (pStat.seats[seatIdx] > 0) {
                    penalty += 500;
                }
                pStat.seats[seatIdx]++;
            });
        });
    });

    return penalty;
};

// =============================================================================
// 初期スケジュール生成
// =============================================================================

/**
 * 抜け番を先に確定させてから、ランダムな初期卓組みを生成する。
 * すべてのプレイヤーに targetGames 回分の出場回戦を割り当てられない場合は null を返す。
 */
const createInitialSchedule = (
    players: Player[],
    maxTables: number,
    targetGames: number
): Round[] | null => {
    const totalSeatsNeeded = players.length * targetGames;
    const totalTablesNeeded = Math.ceil(totalSeatsNeeded / 4);

    // 各回戦の卓数を決定
    const tableCountsPerRound: number[] = [];
    let remainingTables = totalTablesNeeded;
    while (remainingTables > 0) {
        const take = Math.min(maxTables, remainingTables);
        tableCountsPerRound.push(take);
        remainingTables -= take;
    }

    // プレイヤーごとの出場回戦インデックスを管理するマップ
    const playerPlayMap = players.reduce<Record<number, number[]>>((acc, p) => {
        acc[p.id] = [];
        return acc;
    }, {});

    // 各回戦の残席数
    const roundCapacities = tableCountsPerRound.map(count => count * 4);

    // 各プレイヤーに出場回戦をランダムに割り振る
    for (let g = 0; g < targetGames; g++) {
        const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
        shuffledPlayers.forEach(p => {
            const availableRound = roundCapacities.findIndex((cap, rIdx) =>
                cap > 0 && !playerPlayMap[p.id].includes(rIdx)
            );
            if (availableRound !== -1) {
                playerPlayMap[p.id].push(availableRound);
                roundCapacities[availableRound]--;
            }
        });
    }

    // 全プレイヤーに targetGames 回分割り当てられていなければ失敗
    if (!players.every(p => playerPlayMap[p.id].length === targetGames)) return null;

    // 割り当てに基づいて卓を構成（最初はランダム順）
    const rounds: Round[] = tableCountsPerRound.map((tableCount, rIdx) => {
        const roundMembers = players
            .filter(p => playerPlayMap[p.id].includes(rIdx))
            .sort(() => Math.random() - 0.5);

        const tables: Table[] = [];
        for (let t = 0; t < tableCount; t++) {
            const members = roundMembers.slice(t * 4, t * 4 + 4);
            tables.push({
                table_id: t + 1,
                player_ids: members.map(m => m.id),
                scores: [0, 0, 0, 0],
                points: [0, 0, 0, 0],
                is_recorded: false,
            });
        }

        return {
            round_number: rIdx + 1,
            tables,
            resting_player_ids: players
                .filter(p => !playerPlayMap[p.id].includes(rIdx))
                .map(p => p.id),
        };
    });

    return rounds;
};

// =============================================================================
// スワップ操作
// =============================================================================

/**
 * 同一回戦内でランダムに2人のプレイヤーを入れ替える。
 * 元に戻せるよう swapInfo を返す。
 */
const attemptSwap = (rounds: Round[]): SwapResult => {
    const rIdx = Math.floor(Math.random() * rounds.length);
    const tables = rounds[rIdx].tables;

    if (tables.length < 1) return { rounds, swapInfo: null };

    const t1 = Math.floor(Math.random() * tables.length);
    const t2 = Math.floor(Math.random() * tables.length);
    const s1 = Math.floor(Math.random() * 4);
    const s2 = Math.floor(Math.random() * 4);

    // 入れ替え実行
    const pid1 = tables[t1].player_ids[s1];
    const pid2 = tables[t2].player_ids[s2];
    tables[t1].player_ids[s1] = pid2;
    tables[t2].player_ids[s2] = pid1;

    return { rounds, swapInfo: { rIdx, t1, t2, s1, s2 } };
};

/**
 * attemptSwap で行った入れ替えを元に戻す。
 */
const undoSwap = (rounds: Round[], swapInfo: SwapInfo | null): void => {
    if (!swapInfo) return;
    const { rIdx, t1, t2, s1, s2 } = swapInfo;
    const tables = rounds[rIdx].tables;

    // 再度入れ替えることで元に戻る
    const pid1 = tables[t1].player_ids[s1];
    const pid2 = tables[t2].player_ids[s2];
    tables[t1].player_ids[s1] = pid2;
    tables[t2].player_ids[s2] = pid1;
};
