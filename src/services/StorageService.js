// src/services/StorageService.js
import { runRecalculation } from '../logic/calc';

const PREFIX = "mah_tournament_";

export const StorageService = {
    listTournaments: () => Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).map(k => k.replace(PREFIX, "")),
    
    getTournament: (name) => JSON.parse(localStorage.getItem(PREFIX + name)),

    saveTournament: (name, data) => {
        // runRecalculation内で各プレイヤーのtotal_scoreが更新されます
        const updated = runRecalculation(data);
        localStorage.setItem(PREFIX + name, JSON.stringify(updated));
        return updated;
    },

    saveAllRounds: (name, newRounds) => {
        if (!newRounds || !Array.isArray(newRounds)) return null;
        const data = StorageService.getTournament(name);
        if (!data) return null;

        const startNum = data.rounds.length;
        const adjustedRounds = newRounds.map((r, i) => ({
            ...r,
            round_number: startNum + i + 1
        }));
        
        data.rounds = [...data.rounds, ...adjustedRounds];
        return StorageService.saveTournament(name, data);
    },
    createTournament: (name, maxTables, maxGames, mode) => {
       const data = {
            tournament_info: {
                name, max_tables: maxTables, max_games: maxGames, mode,
                settings: {
                    uma_type: "10-30", start_pts: 250, return_pts: 300,
                    shizumi_uma: { "1": [12, -1, -3, -8], "2": [8, 4, -4, -8], "3": [8, 3, 1, -12] }
                }
            },
            players: [], rounds: []
        };
        localStorage.setItem(PREFIX + name, JSON.stringify(data));
        return name;
    },

    addPlayer: (name, playerName) => {
        const data = StorageService.getTournament(name);
        const newId = data.players.length > 0 ? Math.max(...data.players.map(p => p.id)) + 1 : 1;
        // 局数表示はroundsデータから計算するため、ここでは器だけ用意します
        data.players.push({ id: newId, name: playerName, total_score: 0, team: "white" });
        return StorageService.saveTournament(name, data);
    },

    togglePlayerTeam: (name, playerId) => {
        const data = StorageService.getTournament(name);
        data.players = data.players.map(p => p.id === playerId ? { ...p, team: p.team === "red" ? "white" : "red" } : p);
        return StorageService.saveTournament(name, data);
    },

    shuffleTeams: (name) => {
        //const raw = localStorage.getItem(PREFIX + name);
        //if (!raw) return null;
        //const data = JSON.parse(raw);
        const data = StorageService.getTournament(name);
        const shuffled = [...data.players].sort(() => Math.random() - 0.5);
        data.players = data.players.map(p => {
            const index = shuffled.findIndex(s => s.id === p.id);
            return { ...p, team: index % 2 === 0 ? "red" : "white" };
        });
        return StorageService.saveTournament(name, data);
    },

    updatePlayerName: (name, playerId, newName) => {
        const data = StorageService.getTournament(name);
        data.players = data.players.map(p => 
            p.id === playerId ? { ...p, name: newName } : p
        );
        return StorageService.saveTournament(name, data);
    },

    // ★ 対局開始（ラウンド確定）処理
    startRound: (name, tables, restingPlayerIds) => {
        const data = StorageService.getTournament(name);
        const newRound = {
            round_number: data.rounds.length + 1,
            tables: tables,
            resting_player_ids: restingPlayerIds
        };
        data.rounds.push(newRound);
        StorageService.saveTournament(name, data);
        return newRound.round_number;
    },

    submitScore: (name, roundNum, tableId, rawScores) => {
        const data = StorageService.getTournament(name);
        const round = data.rounds[roundNum - 1];
        const table = round.tables.find(t => t.table_id === tableId);
        table.scores = rawScores;
        table.is_recorded = true; // これが「消化」のフラグになります
        return StorageService.saveTournament(name, data);
    },

    updateSettings: (name, newSettings) => {
        const data = StorageService.getTournament(name);
        data.tournament_info.settings = newSettings;
        return StorageService.saveTournament(name, data);
    },

    exportJSON: (name) => {
        const data = localStorage.getItem(PREFIX + name);
        const blob = new Blob([data], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${name}.json`;
        a.click();
    },
    // ★ 追加：大会の削除
    deleteTournament: (name) => {
        localStorage.removeItem(PREFIX + name);
    }
};