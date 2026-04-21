# 麻雀大会マネージャー

麻雀大会の参加者登録・卓組み生成・点数入力・ランキング管理をブラウザ上で完結できるWebアプリです。
サーバー不要で、すべてのデータをブラウザの `localStorage` に保存します。

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | React 18 |
| ビルドツール | Vite |
| ルーティング | React Router v6 |
| データ保存 | localStorage（サーバー不要） |
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
├── App.jsx                  # ルーティング定義
├── main.jsx                 # Reactエントリーポイント
│
├── pages/                   # 各画面のコンポーネント
│   ├── Launcher.jsx         # ホーム（大会の作成・選択）
│   ├── Dashboard.jsx        # 大会ダッシュボード
│   ├── RoundPrepare.jsx     # 卓組みプレビュー・確定
│   ├── RoundTables.jsx      # ラウンド卓一覧
│   ├── ScoreInput.jsx       # 点数入力
│   ├── PlayerDetail.jsx     # プレイヤー詳細
│   └── Settings.jsx         # 詳細設定
│
├── components/              # 再利用可能なUIコンポーネント
│   └── FloatingLabelSelect.jsx  # フローティングラベル付きセレクトボックス
│
├── services/                # データ操作ロジック
│   └── StorageService.js    # localStorageとのやり取りをまとめたサービス層
│
├── logic/                   # ビジネスロジック
│   ├── matching.js          # 卓組み最適化アルゴリズム
│   └── calc.js              # 点数計算・スコア再集計
│
└── styles/                  # スタイルシート
    └── index.css            # 全スタイルを管理（整理予定）
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
| `points` | 順位点（ウマ・オカ込みの最終得点。`calc.js` が計算） |
| `is_recorded` | `true` になると「入力済み」扱いになりスコアに反映される |
| `total_score` | 全対局の `points` の合計（保存のたびに再計算） |
| `games_played` | 消化局数（`is_recorded` な卓の数） |

---

## 各ファイルの役割

### `App.jsx`
React Router を使ったルーティングの定義ファイルです。
どのURLにどのページコンポーネントを表示するかをここで管理します。

---

### `pages/Launcher.jsx`
アプリのホーム画面です。以下の機能を持ちます。

- 大会名・使用卓数・対局数・モード（通常/紅白戦）を設定して新規大会を作成
- 過去の大会一覧を表示し、クリックでダッシュボードへ遷移
- 大会の削除（⋮メニューから）
- JSONファイルのインポート

---

### `pages/Dashboard.jsx`
大会の中心となる画面です。以下の情報をまとめて確認できます。

- 対局の進行状況（卓ごとの入力済み/未入力）
- 現在のランキング（`total_score` 降順）
- 参加者の追加（大会開始前のみ）
- 紅白戦モードのチームスコアとシャッフルボタン
- 卓組み確認・詳細設定・JSON出力へのリンク

---

### `pages/RoundPrepare.jsx`
卓組みのプレビューと確定を行う画面です。

- `matching.js` を使って最適化された卓組みを生成・表示
- 座席（東南西北）の偏りや同卓回数の重複を警告
- 「再構成」ボタンで別の組み合わせを試せる
- 対局開始後は編集不可（確認のみ）
- 対戦表をJPEG画像として出力できる（html2canvas使用）

---

### `pages/RoundTables.jsx`
ラウンドごとの卓一覧画面です。

- 回戦切り替えタブと左右ナビゲーション
- 各卓の座席・プレイヤー名・入力済みスコアを表示
- 卓をタップするとScoreInput画面へ遷移

---

### `pages/ScoreInput.jsx`
1卓分の点数を入力する画面です。

- 100点単位で入力（例：30,000点 → 300）
- 3人分入力すると4人目を自動計算（合計が `start_pts × 4` になるよう）
- `±` ボタンで符号反転
- エンターキーで次の入力欄へ自動フォーカス
- 合計が規定点数と一致しないと保存できない

> **注意**：入力欄は100点単位だが、`submitScore()` には `×100` した値（素点そのまま）を渡す

---

### `pages/PlayerDetail.jsx`
プレイヤーごとの詳細画面です。

- 名前の変更
- 着順分布（1〜4位それぞれの回数）
- 対戦履歴（回戦・着順・スコア・同卓プレイヤー）

---

### `pages/Settings.jsx`
大会の詳細設定画面です。設定保存時に `runRecalculation()` が走り、全スコアが再計算されます。

- ウマ設定（5-10 / 10-20 / 10-30 / 20-30 / 沈みウマ）
- 沈みウマの詳細設定（浮き人数×着順）
- 持ち点・返し点の設定

---

### `components/FloatingLabelSelect.jsx`
フローティングラベル付きのセレクトボックスコンポーネントです。
選択状態になるとラベルが上に移動するアニメーション付きUIを提供します。
`Launcher.jsx`（対局数・モード選択）と `Settings.jsx`（ウマ設定）で使用しています。

```jsx
<FloatingLabelSelect
  label="ラベル名"
  name="field_name"
  value={value}
  onChange={e => setValue(e.target.value)}
  options={[{ label: '表示名', value: '値' }]}
/>
```

---

### `services/StorageService.js`
`localStorage` へのデータ操作をすべてまとめたサービス層です。
各ページコンポーネントはこのサービスを通じてデータを読み書きします。

**重要な設計方針：保存は必ず `saveTournament()` を経由する。**
`saveTournament()` は内部で `runRecalculation()` を呼び出すため、
どのメソッドで保存しても常にスコアが最新の状態で保存されます。

| メソッド | 説明 |
|---------|------|
| `listTournaments()` | `mah_tournament_` プレフィックスのキーを全件取得して大会名一覧を返す |
| `getTournament(name)` | 指定した大会データをJSONパースして返す |
| `saveTournament(name, data)` | `runRecalculation()` を通してからlocalStorageに保存 |
| `createTournament(name, maxTables, maxGames, mode)` | 初期データを生成して保存し、大会名を返す |
| `addPlayer(name, playerName)` | プレイヤーを追加（IDは既存の最大値+1） |
| `togglePlayerTeam(name, playerId)` | red / white を切り替え |
| `shuffleTeams(name)` | プレイヤーをランダムに並べてred/whiteを交互に割り当て |
| `updatePlayerName(name, playerId, newName)` | プレイヤー名を変更 |
| `saveAllRounds(name, newRounds)` | 卓組みを全ラウンド一括保存（既存ラウンドに追記） |
| `startRound(name, tables, restingPlayerIds)` | 1ラウンド分の卓組みを追加（現在は未使用の可能性あり） |
| `submitScore(name, roundNum, tableId, rawScores)` | 素点を保存して `is_recorded = true` にする |
| `updateSettings(name, newSettings)` | 設定を更新（全スコアが再計算される） |
| `exportJSON(name)` | 大会データをJSONファイルとしてダウンロード |
| `deleteTournament(name)` | `localStorage.removeItem()` で大会を削除 |

---

### `logic/calc.js`
素点から順位点を計算し、全対局を再集計するモジュールです。
Python で書かれた `calc.py` をJSに移植したものです。

#### `calculatePoints(rawScores, settings)`
1卓分の素点配列（例：`[35000, 28000, 22000, 15000]`）を受け取り、
順位点の配列（例：`[42.3, 12.1, -10.5, -43.9]`）を返します。

**計算の流れ：**

1. **オカの計算**：`(返し点 - 持ち点) × 4 ÷ 10` を1位に加算
2. **ウマの決定**：`uma_type` に応じた順位ボーナスを決定
   - 沈みウマの場合は「持ち点以上のプレイヤー数（浮き人数）」で分岐し、`shizumi_uma` の設定を参照
3. **素点の変換**：`(素点 - 返し点×100) ÷ 1000` で持ち点基準の増減に変換
4. **順位付けと得点確定**：降順ソートして順位ボーナスを加算。同点の場合は該当する順位点の平均を配分

#### `runRecalculation(data)`
大会データ全体を受け取り、全ラウンド・全卓を再集計します。

- まず全プレイヤーの `total_score` と `games_played` を0にリセット
- `is_recorded === true` の卓だけを対象に `calculatePoints()` を呼び出す
- 最新の設定（ウマ・持ち点等）で計算し直すため、設定変更後も正確なスコアが保たれる

---

### `logic/matching.js`
卓組みを自動生成する最適化アルゴリズムです。

#### `generateOptimizedMultiRounds(players, maxTables, targetGamesPerPerson)`
**山登り法（Hill Climbing）** を使ってペナルティを最小化した卓組みを生成します。

**処理の流れ：**

```
1. 初期スケジュール生成 (createInitialSchedule)
   └─ 各プレイヤーが何回戦に出場するかをランダムに割り当て（抜け番を先に確定）
   └─ 割り当てに基づいてランダムな初期卓組みを生成

2. 山登り法による最適化（最大5000回試行）
   └─ 同一回戦内でランダムに2人を選んで入れ替えてみる (attemptSwap)
   └─ ペナルティが改善・同等なら採用、悪化なら元に戻す (undoSwap)
   └─ ペナルティが0になれば即終了

3. 最もペナルティの低かった組み合わせを返す
```

**ペナルティの重み（`calculateTotalPenalty`）：**

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
```

---

## 今後の予定

- [ ] CSSファイルをページ・コンポーネント単位に分割してリファクタリング
- [ ] レイアウトの調整・UI改善
- [ ] TypeScript化の検討
