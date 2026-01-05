// src/logic/matching.js

/**
 * メイン関数: 山登り法を用いて最適化されたスケジュールを生成する
 */
export const generateOptimizedMultiRounds = (players, maxTables, targetGamesPerPerson) => {
    const targetGames = Number(targetGamesPerPerson) || 1;
    if (!players || players.length < 4) return [];

    // 1. 初期解の生成（抜け番ルールだけを厳守したスケジュール）
    let currentRounds = createInitialSchedule(players, maxTables, targetGames);
    if (!currentRounds) return [];

    let currentPenalty = calculateTotalPenalty(currentRounds, players);
    let bestRounds = JSON.parse(JSON.stringify(currentRounds));
    let minPenalty = currentPenalty;

    // 2. 山登り法による最適化（スワップ試行）
    // 試行回数は多めに設定（局所探索は高速なため5000〜10000回程度でも一瞬です）
    const maxIterations = 5000; 
    
    for (let i = 0; i < maxIterations; i++) {
        // 同一回戦内でランダムに2人を選んで入れ替える
        const { rounds: nextRounds, swapInfo } = attemptSwap(currentRounds);
        const nextPenalty = calculateTotalPenalty(nextRounds, players);

        // ペナルティが改善、または同等なら採用（同等採用は停滞防止のため）
        if (nextPenalty <= currentPenalty) {
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

        if (minPenalty === 0) break; // 理想的な組み合わせが見つかれば終了
    }

    return bestRounds;
};

/**
 * ペナルティ（スコア）計算
 * 低いほど良いスケジュール
 */
const calculateTotalPenalty = (rounds, players) => {
    const stats = players.reduce((acc, p) => {
        // opponents: 遭遇した相手IDのリスト, seats: 各席(0=東, 1=南...)に座った回数
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
                        penalty += 1000; // 重複対戦は非常に重いペナルティ
                    }
                    pStat.opponents.push(oid);
                });

                // 2. 風（席番号）の重複チェック
                // すでにその席に座ったことがある場合、回数に応じてペナルティ
                if (pStat.seats[seatIdx] > 0) {
                    penalty += 500; 
                }
                pStat.seats[seatIdx]++;
            });
        });
    });

    return penalty;
};

/**
 * 初期スケジュールの作成
 * 抜け番（誰がどの回戦で休みか）を先に確定させる
 */
const createInitialSchedule = (players, maxTables, targetGames) => {
    const totalSeatsNeeded = players.length * targetGames;
    const totalTablesNeeded = Math.ceil(totalSeatsNeeded / 4);
    
    const tableCountsPerRound = [];
    let remainingTables = totalTablesNeeded;
    while (remainingTables > 0) {
        const take = Math.min(maxTables, remainingTables);
        tableCountsPerRound.push(take);
        remainingTables -= take;
    }

    const roundsCount = tableCountsPerRound.length;
    const playerPlayMap = players.reduce((acc, p) => { acc[p.id] = []; return acc; }, {});
    const roundCapacities = tableCountsPerRound.map(count => count * 4);

    // 各プレイヤーに「出場する回戦」をランダムに割り振る
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

    if (!players.every(p => playerPlayMap[p.id].length === targetGames)) return null;

    // 割り振られた回戦に基づいて卓を構成（最初はランダム）
    const rounds = tableCountsPerRound.map((tableCount, rIdx) => {
        const roundMembers = players
            .filter(p => playerPlayMap[p.id].includes(rIdx))
            .sort(() => Math.random() - 0.5);

        const tables = [];
        for (let t = 0; t < tableCount; t++) {
            const members = roundMembers.slice(t * 4, t * 4 + 4);
            // 4人に満たない卓はダミー(null等)を入れるか、運用で調整
            // ここでは簡易的にメンバーを詰める
            tables.push({
                table_id: t + 1,
                player_ids: members.map(m => m.id),
                scores: [0,0,0,0], points: [0,0,0,0], is_recorded: false
            });
        }

        return {
            round_number: rIdx + 1,
            tables: tables,
            resting_player_ids: players.filter(p => !playerPlayMap[p.id].includes(rIdx)).map(p => p.id)
        };
    });

    return rounds;
};

/**
 * 同一回戦内で2人のプレイヤーを入れ替える
 */
const attemptSwap = (rounds) => {
    const rIdx = Math.floor(Math.random() * rounds.length);
    const tables = rounds[rIdx].tables;
    if (tables.length < 1) return { rounds, swapInfo: null };

    const t1 = Math.floor(Math.random() * tables.length);
    const t2 = Math.floor(Math.random() * tables.length);
    const s1 = Math.floor(Math.random() * 4);
    const s2 = Math.floor(Math.random() * 4);

    const pid1 = tables[t1].player_ids[s1];
    const pid2 = tables[t2].player_ids[s2];

    // 入れ替え実行
    tables[t1].player_ids[s1] = pid2;
    tables[t2].player_ids[s2] = pid1;

    return {
        rounds,
        swapInfo: { rIdx, t1, t2, s1, s2 }
    };
};

/**
 * 入れ替えを元に戻す
 */
const undoSwap = (rounds, swapInfo) => {
    if (!swapInfo) return;
    const { rIdx, t1, t2, s1, s2 } = swapInfo;
    const tables = rounds[rIdx].tables;
    const pid1 = tables[t1].player_ids[s1];
    const pid2 = tables[t2].player_ids[s2];

    tables[t1].player_ids[s1] = pid2;
    tables[t2].player_ids[s2] = pid1;
};