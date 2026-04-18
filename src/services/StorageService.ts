// src/services/StorageService.ts
// localStorageへのデータ操作をまとめたサービス層。
// 保存は必ず saveTournament() を経由するため、常にスコアが最新の状態で保存される。

import { runRecalculation } from '../logic/calc';
import type { Tournament, TournamentMode, TournamentSettings, MaxGames, Round, Table } from '../types';

const PREFIX = 'mah_tournament_';

export const StorageService = {

    /**
     * 保存されている大会名の一覧を返す。
     */
    listTournaments: (): string[] =>
        Object.keys(localStorage)
            .filter(k => k.startsWith(PREFIX))
            .map(k => k.replace(PREFIX, '')),

    /**
     * 指定した大会データを取得する。
     * 存在しない場合は null を返す。
     */
    getTournament: (name: string): Tournament | null => {
        const raw = localStorage.getItem(PREFIX + name);
        if (!raw) return null;
        return JSON.parse(raw) as Tournament;
    },

    /**
     * 大会データを保存する。
     * 保存前に runRecalculation() を通してスコアを最新化する。
     */
    saveTournament: (name: string, data: Tournament): Tournament => {
        const updated = runRecalculation(data);
        localStorage.setItem(PREFIX + name, JSON.stringify(updated));
        return updated;
    },

    /**
     * 新しい大会を作成して保存する。
     * @returns 作成した大会の名前
     */
    createTournament: (
        name: string,
        maxTables: number,
        maxGames: MaxGames,
        mode: TournamentMode
    ): string => {
        const data: Tournament = {
            tournament_info: {
                name,
                max_tables: maxTables,
                max_games: maxGames,
                mode,
                settings: {
                    uma_type: '10-30',
                    start_pts: 250,
                    return_pts: 300,
                    shizumi_uma: {
                        '1': [12, -1, -3,  -8],
                        '2': [ 8,  4, -4,  -8],
                        '3': [ 8,  3,  1, -12],
                    },
                },
            },
            players: [],
            rounds: [],
        };
        localStorage.setItem(PREFIX + name, JSON.stringify(data));
        return name;
    },

    /**
     * 卓組みを全ラウンド一括保存する（既存ラウンドに追記）。
     */
    saveAllRounds: (name: string, newRounds: Round[]): Tournament | null => {
        if (!newRounds || !Array.isArray(newRounds)) return null;
        const data = StorageService.getTournament(name);
        if (!data) return null;

        const startNum = data.rounds.length;
        const adjustedRounds = newRounds.map((r, i) => ({
            ...r,
            round_number: startNum + i + 1,
        }));

        data.rounds = [...data.rounds, ...adjustedRounds];
        return StorageService.saveTournament(name, data);
    },

    /**
     * プレイヤーを追加する。
     * IDは既存の最大値+1を自動採番する。
     */
    addPlayer: (name: string, playerName: string): Tournament => {
        const data = StorageService.getTournament(name)!;
        const newId = data.players.length > 0
            ? Math.max(...data.players.map(p => p.id)) + 1
            : 1;
        data.players.push({
            id: newId,
            name: playerName,
            total_score: 0,
            games_played: 0,
            team: 'white',
        });
        return StorageService.saveTournament(name, data);
    },

    /**
     * プレイヤーのチームを red / white で切り替える。
     */
    togglePlayerTeam: (name: string, playerId: number): Tournament => {
        const data = StorageService.getTournament(name)!;
        data.players = data.players.map(p =>
            p.id === playerId
                ? { ...p, team: p.team === 'red' ? 'white' : 'red' }
                : p
        );
        return StorageService.saveTournament(name, data);
    },

    /**
     * プレイヤーをランダムに並べて red / white を交互に割り当てる。
     */
    shuffleTeams: (name: string): Tournament => {
        const data = StorageService.getTournament(name)!;
        const shuffled = [...data.players].sort(() => Math.random() - 0.5);
        data.players = data.players.map(p => {
            const index = shuffled.findIndex(s => s.id === p.id);
            return { ...p, team: index % 2 === 0 ? 'red' : 'white' };
        });
        return StorageService.saveTournament(name, data);
    },

    /**
     * プレイヤー名を変更する。
     */
    updatePlayerName: (name: string, playerId: number, newName: string): Tournament => {
        const data = StorageService.getTournament(name)!;
        data.players = data.players.map(p =>
            p.id === playerId ? { ...p, name: newName } : p
        );
        return StorageService.saveTournament(name, data);
    },

    /**
     * 1ラウンド分の卓組みを追加する。
     * @returns 新しいラウンド番号
     */
    startRound: (name: string, tables: Table[], restingPlayerIds: number[]): number => {
        const data = StorageService.getTournament(name)!;
        const newRound: Round = {
            round_number: data.rounds.length + 1,
            tables,
            resting_player_ids: restingPlayerIds,
        };
        data.rounds.push(newRound);
        StorageService.saveTournament(name, data);
        return newRound.round_number;
    },

    /**
     * 点数を保存して is_recorded を true にする。
     * saveTournament() 経由でスコアが再計算される。
     *
     * @param rawScores - 素点の配列（実際の点棒の数。例: 35000）
     */
    submitScore: (
        name: string,
        roundNum: number,
        tableId: number,
        rawScores: number[]
    ): Tournament => {
        const data = StorageService.getTournament(name)!;
        const round = data.rounds[roundNum - 1];
        const table = round.tables.find(t => t.table_id === tableId);
        if (!table) throw new Error(`tableId ${tableId} が見つかりません`);
        table.scores = rawScores;
        table.is_recorded = true;
        return StorageService.saveTournament(name, data);
    },

    /**
     * 大会設定を更新する。
     * 設定変更後に runRecalculation() が走るため、全スコアが再計算される。
     */
    updateSettings: (name: string, newSettings: TournamentSettings): Tournament => {
        const data = StorageService.getTournament(name)!;
        data.tournament_info.settings = newSettings;
        return StorageService.saveTournament(name, data);
    },

    /**
     * 大会データをJSONファイルとしてダウンロードする。
     */
    exportJSON: (name: string): void => {
        const raw = localStorage.getItem(PREFIX + name);
        if (!raw) return;
        const blob = new Blob([raw], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${name}.json`;
        a.click();
    },

    /**
     * 大会を削除する。
     */
    deleteTournament: (name: string): void => {
        localStorage.removeItem(PREFIX + name);
    },
};
