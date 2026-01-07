/**
 * 素点から順位点を算出 (Python calc.py の移植)
 */
export const calculatePoints = (rawScores, settings) => {
    // 1. オカの計算（修正版）
    const oka = (settings.return_pts - settings.start_pts) * 4 /10;

    // 2. ウマ（順位点）の決定
    let uma = [0, 0, 0, 0];

    let rankingBonuses = [0, 0, 0, 0];
    
    if (settings.uma_type === "shizumi") {
        // 沈みウマ：start_pts以上の人数をカウント
        const floatingCount = rawScores.filter(s => s >= settings.start_pts * 100).length;
        // 浮いている人数（1人, 2人, 3人）に応じた設定を適用
        const patterns = settings.shizumi_uma || { "1": [12,-1,-3,-8], "2": [8,4-4,-8], "3": [8,3,1,-12] };
        
        // 0人や4人の場合は2人浮きを適用する等のガード処理
        const key = String(Math.max(1, Math.min(3, floatingCount)));
        uma = patterns[key];
        rankingBonuses = [uma[0], uma[1], uma[2], uma[3]];
    } else {
        const umaMap = {
            "5-10": [10, 5, -5, -10], "10-20": [20, 10, -10, -20],
            "10-30": [30, 10, -10, -30], "20-30": [30, 20, -20, -30]
        };
        uma = umaMap[settings.uma_type] || [30, 10, -10, -30];
        rankingBonuses = [uma[0] + oka, uma[1], uma[2], uma[3]];
    }
    
    
    const basePoints = rawScores.map(s => (s - (settings.return_pts * 100)) / 1000);
    
    // 順位付け (同点対応)
    const indexed = rawScores.map((s, i) => ({ index: i, score: s }))
                             .sort((a, b) => b.score - a.score);
    
    const results = new Array(4).fill(0);
    let i = 0;
    while (i < 4) {
        let j = i + 1;
        while (j < 4 && indexed[j].score === indexed[i].score) j++;
        
        // 同点の場合、順位点の平均を配分
        const slice = rankingBonuses.slice(i, j);
        const avgBonus = slice.reduce((a, b) => a + b, 0) / slice.length;
        
        for (let k = i; k < j; k++) {
            const playerIdx = indexed[k].index;
            results[playerIdx] = Math.round((basePoints[playerIdx] + avgBonus) * 10) / 10;
        }
        i = j;
    }
    return results;
};

/**
 * 全ラウンドを再集計し、ランキングを洗い替える (Python run_recalculation の移植)
 */
export const runRecalculation = (data) => {
    // プレイヤー集計リセット
    data.players.forEach(p => {
        p.total_score = 0.0;
        p.games_played = 0;
    });

    data.rounds.forEach(round => {
        round.tables.forEach(table => {
            if (table.is_recorded) {
                // 最新の設定で計算
                table.points = calculatePoints(table.scores, data.tournament_info.settings);
                // プレイヤーに加算
                table.player_ids.forEach((pid, idx) => {
                    const p = data.players.find(player => player.id === pid);
                    if (p) {
                        p.total_score = Math.round((p.total_score + table.points[idx]) * 10) / 10;
                        p.games_played += 1;
                    }
                });
            }
        });
    });
    return data;
};