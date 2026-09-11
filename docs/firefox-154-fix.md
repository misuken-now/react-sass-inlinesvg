# Firefox 154以降でSVGが読み込まれない問題の修正

## 問題の概要

Firefox 154以降で、Sass経由でSVG名を解決するSVGが `data-svg-status="loading"` のまま表示されない。

### 影響範囲

- 影響バージョン: Firefox 154以降
- 影響機能: CSS `animation-name` を利用したSVG切り替え
- 症状: `defaultName` を指定しないSVGコンポーネントが読み込まれない
- 正常動作: Firefox 153.2.0esr以前、Chrome、Safari

## 根本原因

**Firefox 154以降ではSVG要素に `::before` 擬似要素が生成されない。**

そのため、`::before` に設定していた `animation` が適用されず、`animationstart` が発火しない。

v153.2.0esr と v156.0b5 での実測（要素種別 × animation対象 × duration × content の有無 × タイミングの48通り）で、両バージョンの結果が異なるのは `svg` + `::before` の組み合わせのみ。

| 要素 | animation対象 | v153 | v156 |
| ---- | ------------- | ---- | ---- |
| svg  | `::before`    | 発火 | **非発火** |
| svg  | 要素本体      | 発火 | 発火 |
| div  | `::before`    | 発火 | 発火 |
| div  | 要素本体      | 発火 | 発火 |

`div` の `::before` は両バージョンで発火するため、擬似要素全般の挙動変更ではなくSVG要素に限定された変更。

v156で `getComputedStyle(svgElement, "::before").content` は `none` を返す。

### 従来の仕組み

```scss
&[data-svg-status]::before {
  content: "#{$svg-name}";
  animation: svg_#{$svg-name} 1s paused !important;
}
```

1. `data-svg-status` 属性の付与で `::before` の `animation-name` が適用される
2. `animationstart` が発火し、`event.animationName` からSVG名を検出
3. SVGをfetchして描画

Firefox 154以降は手順1が成立しない。

## 修正内容

トリガーを `::before` から要素自体へ移動する。他の変更は不要。

```scss
// 修正前
&[data-svg-status]::before#{$suffix} {
  content: "#{$svg-name}";
  animation: svg_#{$svg-name} 1s paused !important;
}

// 修正後
&[data-svg-status]#{$suffix} {
  animation: svg_#{$svg-name} 1s paused !important;
}
```

`content` は削除する。SVG要素では `::before` が生成されないため、`content` を残しても効果がない。

TypeScript側の変更は不要。

## 検証で不要と確認した変更

初期の修正案には以下が含まれていたが、いずれも不要と実測で確認した。

### `1s paused` → `0.001s` への変更

`duration` は結果に影響しない。48通りの検証で `1s paused` / `0.001s` / `1s` すべて同一の結果。

メインスレッドを最大500msブロックした負荷テスト（60要素 × 4段階）でも、全条件で60/60発火。hover往復5回でも毎回発火する。

さらに `0.001s` は `animationend` を発火させる副作用がある。ライブラリが利用側のSVG要素の `animation` を予約する仕様上、余計なイベントを漏らすため望ましくない。`paused` は `animationend` を発火させない。

### `@keyframes` 定義後の `requestAnimationFrame` 1フレーム待機

効果がない。`requestAnimationFrame` 待機を保持したまま `::before` 版のscssに戻すと、v156では20要素中10要素が `loading` のまま失敗する。

`@keyframes` 注入と `data-svg-status` 適用の順序を4通り（同一タスク内 / `setTimeout(0)` / `requestAnimationFrame` / 属性適用後に `@keyframes` 注入）試しても、SVG要素本体にanimationを設定していればすべて発火する。

Safari向けの既存の `setupStyle` → `aggregateProcess` の非同期化で十分。

### `content` の擬似要素への残置

デバッグ用として機能しない。v156ではSVG要素の `::before` が生成されず `content` は `none` になる。

## 動作確認

Storybook `atoms-svg--styling-pattern`（SVG 20個）

| バージョン | 修正前 | 修正後 |
| ---------- | ------ | ------ |
| 153.2.0esr | 20/20 complete | 20/20 complete |
| 156.0b5    | 10/20 complete（10個 loading） | 20/20 complete |

- 全要素 56×56px を維持
- hover / click による切り替え、`NULL` / `NONE` / `HIDDEN` も正常動作
- Jest 38件成功

## 影響範囲

### 互換性への注意

APIの変更はない。

ただし、トリガーが要素本体に移るため、利用側が同じSVG要素に独自の `animation` を設定している場合は競合する。READMEのBrowser Supportに制約を記載済み。

### パフォーマンス影響

なし。セレクタが1つ減り `content` の指定もなくなるため、生成されるCSSは軽くなる。

## 参考資料

- [CSS Animations Level 1](https://www.w3.org/TR/css-animations-1/)
- [MDN: animationstart event](https://developer.mozilla.org/en-US/docs/Web/API/Element/animationstart_event)
