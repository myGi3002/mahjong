// src/types/index.ts
// このプロジェクト全体で使うデータ型の定義。
// localStorageに保存されるJSONの構造と一致させている。

// =============================================================================
// ユニオン型（決まった値のどれかしか入らないもの）
// =============================================================================

/** ウマの種類 */
export type UmaType = '5-10' | '10-20' | '10-30' | '20-30' | 'shizumi';

/** 大会モード */
export type TournamentMode = 'normal' | 'kouhaku';

/** チーム */
export type Team = 'red' | 'white';

/** 対局数設定（フリーまたは数値文字列） */
export type MaxGames = 'フリー' | '1' | '2' | '3' | '4';

// =============================================================================
// 設定
// =============================================================================

/**
 * 沈みウマの設定。
 * キーは浮き人数（"1"〜"3"）、値は [1位, 2位, 3位, 4位] のボーナス配列。
 * 例: { "1": [12, -1, -3, -8], "2": [8, 4, -4, -8], "3": [8, 3, 1, -12] }
 */
export type ShizumiUma = {
    [floatingCount: string]: [number, number, number, number];
};

/** ウマ・持ち点などの大会設定 */
export interface TournamentSettings {
    uma_type: UmaType;
    start_pts: number;      // 持ち点（例: 250 = 25,000点）
    return_pts: number;     // 返し点（例: 300 = 30,000点）
    shizumi_uma: ShizumiUma;
}

// =============================================================================
// 大会情報
// =============================================================================

/** 大会の基本情報 */
export interface TournamentInfo {
    name: string;
    max_tables: number;
    max_games: MaxGames;
    mode: TournamentMode;
    settings: TournamentSettings;
}

// =============================================================================
// プレイヤー
// =============================================================================

/** プレイヤー */
export interface Player {
    id: number;
    name: string;
    total_score: number;    // 全対局の合計得点（保存のたびに再計算される）
    games_played: number;   // 消化局数
    team: Team;             // 紅白戦モードのチーム
}

// =============================================================================
// 卓・ラウンド
// =============================================================================

/**
 * 1卓分のデータ。
 * scores  : 素点（実際の点棒の数。例: 35000）
 * points  : 順位点（ウマ・オカ込みの最終得点。calc.tsが計算）
 */
export interface Table {
    table_id: number;
    player_ids: number[];               // 座席順（東・南・西・北）のプレイヤーID
    scores: number[];                   // 素点（is_recorded が true のとき有効）
    points: number[];                   // 順位点（is_recorded が true のとき有効）
    is_recorded: boolean;               // true = 点数入力済み
}

/** 1ラウンド分のデータ */
export interface Round {
    round_number: number;
    tables: Table[];
    resting_player_ids: number[];       // 抜け番のプレイヤーID
}

// =============================================================================
// 大会全体
// =============================================================================

/** localStorageに保存される大会データ全体 */
export interface Tournament {
    tournament_info: TournamentInfo;
    players: Player[];
    rounds: Round[];
}

// =============================================================================
// コンポーネントのprops（よく使うもの）
// =============================================================================

/** filenameを受け取るコンポーネント共通のprops */
export interface WithFilename {
    filename: string;
}
