// src/logic/matching.js

export const generateOptimizedMultiRounds = (players, maxTables, targetGamesPerPerson) => {
    let bestResult = null;
    let minPenalty = Infinity;
    const targetGames = Number(targetGamesPerPerson) || 1;

    if (!players || players.length < 4) return [];

    // 100回シミュレーションして最適な組み合わせを探す
    for (let i = 0; i < 1000; i++) {
        const result = simulateFixedSeating(players, maxTables, targetGames);
        if (result && result.totalPenalty < minPenalty) {
            minPenalty = result.totalPenalty;
            bestResult = result.rounds;
        }
    }
    return bestResult || [];
};

const simulateFixedSeating = (players, maxTables, targetGames) => {
    const totalSeatsNeeded = players.length * targetGames;
    const totalTablesNeeded = totalSeatsNeeded / 4;
    
    // 1. 各回戦の卓数を決定 (例: 13人4局なら [3, 3, 3, 3, 1])
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

    // 2. チケット配布 (各プレイヤーに重複しないように回戦を割り振る)
    for (let g = 0; g < targetGames; g++) {
        const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
        shuffledPlayers.forEach(p => {
            // まだ余裕があり、かつ自分がまだ選ばれていない回戦を探す
            const availableRound = roundCapacities.findIndex((cap, rIdx) => 
                cap > 0 && !playerPlayMap[p.id].includes(rIdx)
            );
            if (availableRound !== -1) {
                playerPlayMap[p.id].push(availableRound);
                roundCapacities[availableRound]--;
            }
        });
    }

    // 全員にtargetGames分行き渡らなかったら失敗
    if (!players.every(p => playerPlayMap[p.id].length === targetGames)) return null;

    const rounds = [];
    const playerStats = players.reduce((acc, p) => {
        acc[p.id] = { opponents: [], seats: [0, 0, 0, 0] };
        return acc;
    }, {});

    let totalPenalty = 0;

    // 3. 各回戦のテーブルを構成
    for (let r = 0; r < roundsCount; r++) {
        const roundMembers = players.filter(p => playerPlayMap[p.id].includes(r));
        const sessionPlayers = [...roundMembers].sort(() => Math.random() - 0.5);
        const roundTables = [];

        for (let t = 0; t < tableCountsPerRound[r]; t++) {
            const members = sessionPlayers.slice(t * 4, t * 4 + 4);
            if (members.length < 4) return null; 

            members.forEach((p, seatIdx) => {
                const stats = playerStats[p.id];
                const others = members.filter(m => m.id !== p.id);
                others.forEach(o => {
                    if (stats.opponents.includes(o.id)) totalPenalty += 500;
                    stats.opponents.push(o.id);
                });
                stats.seats[seatIdx]++;
                totalPenalty += stats.seats[seatIdx] * 100;
            });

            roundTables.push({
                table_id: t + 1,
                player_ids: members.map(m => m.id),
                scores: [0,0,0,0], points: [0,0,0,0], is_recorded: false
            });
        }

        rounds.push({
            round_number: r + 1,
            tables: roundTables,
            resting_player_ids: players.filter(p => !roundMembers.find(m => m.id === p.id)).map(p => p.id)
        });
    }

    return { rounds, totalPenalty };
};