# 麻雀大会マネージャー

麻雀大会の参加者登録・卓組み生成・点数入力・ランキング管理をブラウザ上で完結できるWebアプリです。
サーバー不要で、すべてのデータをブラウザの `localStorage` に保存します。

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | React 19 |
| 言語 | TypeScript |
| ビルドツール | Vite（rolldown-vite） |
| ルーティング | React Router v7 |
| データ保存 | localStorage（サーバー不要） |
| スタイル | CSS Modules + global.css |
| その他ライブラリ | html2canvas（対戦表の画像出力） |

---

## 機能一覧

- 大会の新規作成・削除・JSONインポート/エクスポート
- 参加者の登録・名前変更
- 卓組みの自動生成（山登り法による最適化アルゴリズム）
- 紅白戦モード（チーム分け・スコア集計）
- 点数入力（3人力入力で4人目を自動計算）
- ウマ・オカ・持ち点・返し点の設定
- 沈みウマ設定（浮き人数×着順で細かく設定可能）
- プレイヤー別の着順分布・対戦履歴
- 対戦表の画像出力（JPEGダウンロード）

---

## ディレクトリ構成

```
src/
├── App.tsx                      # ルーティング定義
├── main.tsx                     # Reactエントリーポイント
│
├── types/
│   └── index.ts                 # プロジェクト全体の型定義
│
├── pages/                       # 各画面のコンポーネント
│   ├── Launcher.tsx             # ホーム（大会の作成・選択）
│   ├── Dashboard.tsx            # 大会ダッシュボード
│   ├── RoundPrepare.tsx         # 卓組みプレビュー・確定
│   ├── RoundTables.tsx          # ラウンド卓一覧
│   ├── ScoreInput.tsx           # 点数入力
│   ├── PlayerDetail.tsx         # プレイヤー詳細
│   └── Settings.tsx             # 詳細設定
│
├── components/                  # 再利用可能なUIコンポーネント
│   ├── FloatingLabelSelect.tsx  # フローティングラベル付きセレクトボックス
│   ├── common/
│   │   └── AlertCard.tsx        # 警告カード（汎用）
│   └── dashboard/               # Dashboard専用コンポーネント
│       ├── RoundProgressGrid.tsx  # 対局進行状況グリッド
│       ├── PlayerRegisterForm.tsx # 参加者登録フォーム
│       └── RankingTable.tsx       # ランキングテーブル（紅白戦UI含む）
│
├── services/
│   └── StorageService.ts        # localStorageとのやり取りをまとめたサービス層
│
├── logic/
│   ├── matching.ts              # 卓組み最適化アルゴリズム
│   └── calc.ts                  # 点数計算・スコア再集計
│
└── styles/
    ├── global.css               # 変数・body・共通コンポーネント（App.tsxでimport）
    ├── components/
    │   ├── FloatingLabelSelect.module.css
    │   ├── common/
    │   │   └── AlertCard.module.css
    │   └── dashboard/
    │       ├── RoundProgressGrid.module.css
    │       └── RankingTable.module.css
    └── pages/
        ├── Launcher.module.css
        ├── RoundPrepare.module.css
        ├── RoundTables.module.css
        ├── ScoreInput.module.css
        ├── PlayerDetail.module.css
        └── Settings.module.css
```

---

## URL設計

大会ファイル名（`:filename`）をURLに含めることで、ページリロード後もデータを復元できます。

| URL | 画面 |
|-----|------|
| `/` | Launcher（大会選択・作成） |
| `/t/:filename/dashboard` | Dashboard（大会トップ） |
| `/t/:filename/player/:playerId` | PlayerDetail（プレイヤー詳細） |
| `/t/:filename/round/prepare` | RoundPrepare（卓組みプレビュー） |
| `/t/:filename/round/:roundNum` | RoundTables（ラウンド卓一覧） |
| `/t/:filename/round/:roundNum/table/:tableId` | ScoreInput（点数入力） |
| `/t/:filename/settings` | Settings（詳細設定） |

---

## データ構造

`localStorage` に `mah_tournament_<大会名>` というキーでJSONを保存します。

```json
{
  "tournament_info": {
    "name": "大会名",
    "max_tables": 2,
    "max_games": "4",
    "mode": "normal",
    "settings": {
      "uma_type": "10-30",
      "start_pts": 250,
      "return_pts": 300,
      "shizumi_uma": {
        "1": [12, -1, -3, -8],
        "2": [8, 4, -4, -8],
        "3": [8, 3, 1, -12]
      }
    }
  },
  "players": [
    { "id": 1, "name": "山田", "total_score": 42.3, "games_played": 3, "team": "red" }
  ],
  "rounds": [
    {
      "round_number": 1,
      "resting_player_ids": [5],
      "tables": [
        {
          "table_id": 1,
          "player_ids": [1, 2, 3, 4],
          "scores": [35000, 28000, 22000, 15000],
          "points": [42.3, 12.1, -10.5, -43.9],
          "is_recorded": true
        }
      ]
    }
  ]
}
```

### 主なフィールド説明

| フィールド | 説明 |
|-----------|------|
| `scores` | 素点（実際の点棒の数。例：35,000点 → 35000） |
| `points` | 順位点（ウマ・オカ込みの最終得点。`calc.ts` が計算） |
| `is_recorded` | `true` になると「入力済み」扱いになりスコアに反映される |
| `total_score` | 全対局の `points` の合計（保存のたびに再計算） |
| `games_played` | 消化局数（`is_recorded` な卓の数） |

---

## 各ファイルの役割

### `types/index.ts`
プロジェクト全体で使うデータ型の定義ファイルです。
`localStorage` に保存されるJSONの構造と一致しています。

主な型：`Tournament`・`Player`・`Round`・`Table`・`TournamentSettings`・`UmaType`・`TournamentMode`・`MaxGames`・`Team`

---

### `App.tsx`
React Router を使ったルーティングの定義ファイルです。
`global.css` のimportもここで行います。

---

### `pages/Launcher.tsx`
アプリのホーム画面です。以下の機能を持ちます。

- 大会名・使用卓数・対局数・モード（通常/紅白戦）を設定して新規大会を作成
- 過去の大会一覧を表示し、クリックでダッシュボードへ遷移
- 大会の削除（⋮メニューから）
- JSONファイルのインポート

---

### `pages/Dashboard.tsx`
大会の中心となる画面です。データ取得・更新のロジックを担当し、表示は各コンポーネントに委譲します。

- `RoundProgressGrid`：対局の進行状況（卓ごとの入力済み/未入力）
- `PlayerRegisterForm`：参加者の追加（大会開始前のみ）
- `RankingTable`：現在のランキング（`total_score` 降順）・紅白戦UI

---

### `pages/RoundPrepare.tsx`
卓組みのプレビューと確定を行う画面です。

- `matching.ts` を使って最適化された卓組みを生成・表示
- 座席（東南西北）の偏りや同卓回数の重複を `AlertCard` で警告
- 「再構成」ボタンで別の組み合わせを試せる
- 対局開始後は編集不可（確認のみ）
- 対戦表をJPEG画像として出力できる（html2canvas使用）

---

### `pages/RoundTables.tsx`
ラウンドごとの卓一覧画面です。

- 回戦切り替えタブと左右ナビゲーション
- 各卓の座席・プレイヤー名・入力済みスコアを表示
- 卓をタップするとScoreInput画面へ遷移

---

### `pages/ScoreInput.tsx`
1卓分の点数を入力する画面です。

- 100点単位で入力（例：30,000点 → 300）
- 3人分入力すると4人目を自動計算（合計が `start_pts × 4` になるよう）
- `±` ボタンで符号反転
- エンターキーで次の入力欄へ自動フォーカス
- 合計が規定点数と一致しないと保存できない

> **注意**：入力欄は100点単位だが、`submitScore()` には `×100` した値（素点そのまま）を渡す

---

### `pages/PlayerDetail.tsx`
プレイヤーごとの詳細画面です。

- 名前の変更
- 着順分布（1〜4位それぞれの回数）
- 対戦履歴（回戦・着順・スコア・同卓プレイヤー）

---

### `pages/Settings.tsx`
大会の詳細設定画面です。設定保存時に `runRecalculation()` が走り、全スコアが再計算されます。

- ウマ設定（5-10 / 10-20 / 10-30 / 20-30 / 沈みウマ）
- 沈みウマの詳細設定（浮き人数×着順）
- 持ち点・返し点の設定

---

### `components/FloatingLabelSelect.tsx`
フローティングラベル付きのセレクトボックスコンポーネントです。
選択状態になるとラベルが上に移動するアニメーション付きUIを提供します。
`Launcher.tsx`（対局数・モード選択）と `Settings.tsx`（ウマ設定）で使用しています。

```tsx
<FloatingLabelSelect
  label="ラベル名"
  name="field_name"
  value={value}
  onChange={(e) => setValue(e.target.value as SomeType)}
  options={[{ label: '表示名', value: '値' }]}
/>
```

---

### `components/common/AlertCard.tsx`
警告・注意事項を表示する汎用カードコンポーネントです。
`messages` が空の場合は何も表示しません。
現在は `RoundPrepare.tsx` の重複・偏り警告で使用しています。

---

### `components/dashboard/RoundProgressGrid.tsx`
ダッシュボードの対局進行状況グリッドです。
各回戦の卓ボタンを横スクロールで表示します。

### `components/dashboard/PlayerRegisterForm.tsx`
参加者登録フォームです。
大会開始後（`roundCount > 0` かつフリーでない）はロックされます。

### `components/dashboard/RankingTable.tsx`
ランキングテーブルです。紅白戦モードのスコアバー・シャッフルボタン・チームバッジも含みます。

---

### `services/StorageService.ts`
`localStorage` へのデータ操作をすべてまとめたサービス層です。

**重要な設計方針：保存は必ず `saveTournament()` を経由する。**
`saveTournament()` は内部で `runRecalculation()` を呼び出すため、
どのメソッドで保存しても常にスコアが最新の状態で保存されます。

| メソッド | 説明 |
|---------|------|
| `listTournaments()` | `mah_tournament_` プレフィックスのキーを全件取得して大会名一覧を返す |
| `getTournament(name)` | 指定した大会データをJSONパースして返す（存在しない場合は `null`） |
| `saveTournament(name, data)` | `runRecalculation()` を通してからlocalStorageに保存 |
| `createTournament(name, maxTables, maxGames, mode)` | 初期データを生成して保存し、大会名を返す |
| `addPlayer(name, playerName)` | プレイヤーを追加（IDは既存の最大値+1） |
| `togglePlayerTeam(name, playerId)` | red / white を切り替え |
| `shuffleTeams(name)` | プレイヤーをランダムに並べてred/whiteを交互に割り当て |
| `updatePlayerName(name, playerId, newName)` | プレイヤー名を変更 |
| `saveAllRounds(name, newRounds)` | 卓組みを全ラウンド一括保存（既存ラウンドに追記） |
| `submitScore(name, roundNum, tableId, rawScores)` | 素点を保存して `is_recorded = true` にする |
| `updateSettings(name, newSettings)` | 設定を更新（全スコアが再計算される） |
| `exportJSON(name)` | 大会データをJSONファイルとしてダウンロード |
| `deleteTournament(name)` | `localStorage.removeItem()` で大会を削除 |

---

### `logic/calc.ts`
素点から順位点を計算し、全対局を再集計するモジュールです。
Python で書かれた `calc.py` をTypeScriptに移植したものです。

#### `calculatePoints(rawScores: number[], settings: TournamentSettings): number[]`
1卓分の素点配列を受け取り、順位点の配列を返します。

計算の流れ：
1. **オカの計算**：`(返し点 - 持ち点) × 4 ÷ 10` を1位に加算
2. **ウマの決定**：`uma_type` に応じた順位ボーナスを決定（沈みウマは浮き人数で分岐）
3. **素点の変換**：`(素点 - 返し点×100) ÷ 1000` で持ち点基準の増減に変換
4. **順位付けと得点確定**：同点の場合は該当する順位点の平均を配分

#### `runRecalculation(data: Tournament): Tournament`
大会データ全体を受け取り、全ラウンド・全卓を再集計します。
全プレイヤーのスコアをリセットしてから `is_recorded === true` の卓だけを対象に再計算します。

---

### `logic/matching.ts`
卓組みを自動生成する最適化アルゴリズムです。

#### `generateOptimizedMultiRounds(players, maxTables, targetGamesPerPerson): Round[]`
**山登り法（Hill Climbing）** を使ってペナルティを最小化した卓組みを生成します。

処理の流れ：
1. 初期スケジュール生成（抜け番を先に確定してからランダムな卓組みを生成）
2. 山登り法による最適化（最大5000回試行、同一回戦内で2人をスワップ）
3. 最もペナルティの低かった組み合わせを返す

ペナルティの重み：

| 条件 | ペナルティ |
|------|-----------|
| 同じ2人が複数回同卓する | +1000（1回ごと） |
| 同じ座席（東南西北）に複数回座る | +500（1回ごと） |

---

## セットアップ

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# 型チェック
npx tsc --noEmit
```

---

## 今後の予定

- [ ] フェーズ4：堅牢化（バリデーション・エラーハンドリング・Error Boundary）
- [ ] フェーズ5：テスト（Vitest による calc.ts・matching.ts の単体テスト）
- [ ] フェーズ6：発展（Zustand・バックエンド化・CI/CD）
