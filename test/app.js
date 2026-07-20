"use strict";

/* =========================================================
   サッカー戦術ボード
   - 座標系: コートをメートル単位 (0..W, 0..H) の「横向き論理座標」で扱う
   - スマホ縦表示は SVG グループの回転のみで実現（データは常に横向き座標）
   - 図形（サークル/スクエア/矢印）は全コマ共通の注釈レイヤー
   ========================================================= */

const APP_VERSION = "0.1"; // 版数（⚙設定パネルに表示。リリースごとに更新する）
const APP_URL = "https://matamata-star.github.io/soccer-tactics/"; // 配布用の本番URL（設定パネルに表示）

/* ---------- コート定義 ---------- */
const COURTS = {
  full:  { W: 105,  H: 68 },
  half:  { W: 52.5, H: 68 },
  blank: { W: 105,  H: 68 },
};
const PAD = 3; // ゴールのはみ出し分の余白（m）
const BENCH_DEPTH = 11; // 控え選手ベンチ帯の奥行き（m）。無地コートでは使わない

const LS_AUTOSAVE = "soccerTactics.autosave.v1";
const LS_SAVES = "soccerTactics.saves.v1";
const LS_CUSTOM_FORMATIONS = "soccerTactics.customFormations.v1";

/* ---------- コートカラー ---------- */
const COURT_THEMES = {
  vivid:    { c1: "#1f9645", c2: "#25ab50", bg: "#1c8a41" },
  standard: { c1: "#1b6b34", c2: "#1f7a3b", bg: "#175f2e" },
  pastel:   { c1: "#8fd19e", c2: "#a3dcae", bg: "#86c795" },
  classic:  { c1: "#14381d", c2: "#1b4d2a", bg: "#123420" },
};

/* ---------- フォーメーション定義（フルコート基準の%座標） ---------- */
const formations = {
  "4-4-2": {
    // 定番の「フラット4-4-2」: 守備ライン4人・中盤ライン4人ともほぼ横一線に並べる
    1:  { x: 5,  y: 50, role: "GK" },
    2:  { x: 20, y: 15, role: "DF" },
    3:  { x: 20, y: 38, role: "DF" },
    4:  { x: 20, y: 62, role: "DF" },
    5:  { x: 20, y: 85, role: "DF" },
    6:  { x: 36, y: 15, role: "MF" },
    7:  { x: 36, y: 38, role: "MF" },
    8:  { x: 36, y: 62, role: "MF" },
    9:  { x: 36, y: 85, role: "MF" },
    10: { x: 46, y: 35, role: "FW" },
    11: { x: 46, y: 65, role: "FW" },
  },
  "4-3-3": {
    1:  { x: 5,  y: 50, role: "GK" },
    2:  { x: 22, y: 18, role: "DF" },
    3:  { x: 20, y: 38, role: "DF" },
    4:  { x: 20, y: 62, role: "DF" },
    5:  { x: 22, y: 82, role: "DF" },
    6:  { x: 35, y: 28, role: "MF" },
    7:  { x: 35, y: 50, role: "MF" },
    8:  { x: 35, y: 72, role: "MF" },
    9:  { x: 46, y: 15, role: "FW" },
    10: { x: 46, y: 50, role: "FW" },
    11: { x: 46, y: 85, role: "FW" },
  },
  "3-5-2": {
    // 3バックはフラットに、MFの5人は1列に並べず、両ウイング＋中央の3人を前目(x高め)・
    // その間の2人を後目(x低め)に配置する「W字」（前列5/7/9・後列6/8）
    1:  { x: 5,  y: 50, role: "GK" },
    2:  { x: 20, y: 22, role: "DF" },
    3:  { x: 20, y: 50, role: "DF" },
    4:  { x: 20, y: 78, role: "DF" },
    5:  { x: 40, y: 8,  role: "MF" },
    6:  { x: 27, y: 30, role: "MF" },
    7:  { x: 40, y: 50, role: "MF" },
    8:  { x: 27, y: 70, role: "MF" },
    9:  { x: 40, y: 92, role: "MF" },
    10: { x: 46, y: 35, role: "FW" },
    11: { x: 46, y: 65, role: "FW" },
  }
};

/* 少人数用の配置（1〜10人） */
const simpleFormations = {
  1: [
    { x: 30, y: 50, role: "" },
  ],
  2: [
    { x: 8,  y: 50, role: "GK" },
    { x: 35, y: 50, role: "FW" },
  ],
  3: [
    { x: 8,  y: 50, role: "GK" },
    { x: 22, y: 50, role: "DF" },
    { x: 38, y: 50, role: "FW" },
  ],
  4: [
    { x: 8,  y: 50, role: "GK" },
    { x: 22, y: 35, role: "DF" },
    { x: 22, y: 65, role: "DF" },
    { x: 38, y: 50, role: "FW" },
  ],
  5: [
    { x: 5,  y: 50, role: "GK" },
    { x: 22, y: 35, role: "DF" },
    { x: 22, y: 65, role: "DF" },
    { x: 36, y: 50, role: "MF" },
    { x: 46, y: 50, role: "FW" },
  ],
  6: [
    { x: 5,  y: 50, role: "GK" },
    { x: 20, y: 30, role: "DF" },
    { x: 20, y: 70, role: "DF" },
    { x: 34, y: 50, role: "MF" },
    { x: 44, y: 30, role: "FW" },
    { x: 44, y: 70, role: "FW" },
  ],
  7: [
    { x: 5,  y: 50, role: "GK" },
    { x: 20, y: 28, role: "DF" },
    { x: 20, y: 72, role: "DF" },
    { x: 33, y: 50, role: "MF" },
    { x: 40, y: 25, role: "MF" },
    { x: 40, y: 75, role: "MF" },
    { x: 47, y: 50, role: "FW" },
  ],
  8: [
    { x: 5,  y: 50, role: "GK" },
    { x: 20, y: 22, role: "DF" },
    { x: 20, y: 50, role: "DF" },
    { x: 20, y: 78, role: "DF" },
    { x: 34, y: 30, role: "MF" },
    { x: 34, y: 70, role: "MF" },
    { x: 44, y: 30, role: "FW" },
    { x: 44, y: 70, role: "FW" },
  ],
  9: [
    { x: 5,  y: 50, role: "GK" },
    { x: 20, y: 22, role: "DF" },
    { x: 20, y: 50, role: "DF" },
    { x: 20, y: 78, role: "DF" },
    { x: 33, y: 22, role: "MF" },
    { x: 33, y: 50, role: "MF" },
    { x: 33, y: 78, role: "MF" },
    { x: 44, y: 35, role: "FW" },
    { x: 44, y: 65, role: "FW" },
  ],
  10: [
    { x: 5,  y: 50, role: "GK" },
    { x: 20, y: 20, role: "DF" },
    { x: 20, y: 40, role: "DF" },
    { x: 20, y: 60, role: "DF" },
    { x: 20, y: 80, role: "DF" },
    { x: 33, y: 28, role: "MF" },
    { x: 33, y: 50, role: "MF" },
    { x: 33, y: 72, role: "MF" },
    { x: 44, y: 35, role: "FW" },
    { x: 44, y: 65, role: "FW" },
  ],
  11: null, // formations を使う
};

/* ---------- 状態 ---------- */
const state = {
  courtType: "full",
  courtColor: "vivid",
  portrait: window.innerHeight > window.innerWidth,
  orientationManual: false, // ユーザーが手動で縦横を切り替えたら自動追従をやめる
  halfFacing: "left",       // 半面コート専用: left | right | up | down（ゴールの向き）
  tool: "select",           // select | circle | rect | tri | arrow-pass | arrow-run | line
  frames: [],               // 各コマ: { "p-a1": {x,y}, ..., "ball": {x,y} } （メートル座標）
  currentFrameIndex: 0,
  players: {},              // "p-a1" -> { team, num, label }
  playerCountA: 8,
  playerCountB: 8,
  annotations: [],          // { id, type: circle|rect|arrow, ... } 全コマ共通
  selectedAnno: null,
  isPlaying: false,
  speed: 1.0,
  showPaths: true,
  loopPlayback: false,
  activeSaveName: null, // 直近に開いた/保存した名前付き作戦（上書き保存の対象）
};

let undoStack = [];
const UNDO_MAX = 60;

/* ---------- DOM 参照 ---------- */
const $ = (id) => document.getElementById(id);
const svg = $("board");
const scene = $("scene");
const layers = {
  pitch:   $("layer-pitch"),
  bench:   $("layer-bench"),
  anno:    $("layer-anno"),
  paths:   $("layer-paths"),
  tokens:  $("layer-tokens"),
  handles: $("layer-handles"),
};

const SVGNS = "http://www.w3.org/2000/svg";

function el(name, attrs, parent) {
  const n = document.createElementNS(SVGNS, name);
  if (attrs) for (const k of Object.keys(attrs)) {
    if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
  }
  if (parent) parent.appendChild(n);
  return n;
}

/* ---------- 汎用ヘルパー ---------- */
const court = () => COURTS[state.courtType];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const deep = (o) => JSON.parse(JSON.stringify(o));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

let annoSeq = 0;
const newAnnoId = () => `anno_${Date.now().toString(36)}_${annoSeq++}`;

function pxPerMeter() {
  // scene の変換行列からスケールを取る（回転・レターボックスも正しく反映される）
  const m = scene.getScreenCTM();
  if (m) {
    const s = Math.hypot(m.a, m.b);
    if (s > 0.01) return s;
  }
  const r = svg.getBoundingClientRect();
  const { W, H } = court();
  const logicalW = (state.portrait ? H : W) + PAD * 2;
  return r.width > 0 ? r.width / logicalW : 8;
}
const markerR = () => Math.max(2.0, 14 / pxPerMeter());
const ballR   = () => Math.max(1.1, 9 / pxPerMeter());
const handleR = () => Math.max(1.3, 13 / pxPerMeter());

/* クライアント座標 → 論理座標（縦表示の回転も自動で吸収される） */
function clientToLogical(cx, cy) {
  const m = scene.getScreenCTM();
  if (!m) return { x: 0, y: 0 };
  const p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
  return { x: p.x, y: p.y };
}

/* 半面コートは4方向の「攻撃方向」（自陣ゴールの向きではなく、攻める方向）を指定する。
   ゴール（自陣・防御側）は攻撃方向の反対側に描画される。フル/無地コートは従来の縦横トグルを使う */
function halfFacingToOrientation(facing) {
  switch (facing) {
    case "left":  return { portrait: false, flip: true };  // 左へ攻める（ゴールは右）
    case "down":  return { portrait: true, flip: false };  // 下へ攻める（ゴールは上）
    case "up":    return { portrait: true, flip: true };   // 上へ攻める（ゴールは下）
    case "right":
    default:      return { portrait: false, flip: false }; // 右へ攻める（ゴールは左）
  }
}

function effectiveOrientation() {
  if (state.courtType === "half") return halfFacingToOrientation(state.halfFacing);
  return { portrait: state.portrait, flip: false };
}

function benchActive() {
  return state.courtType !== "blank";
}

/* シーン全体の回転・反転を打ち消す変換文字列（番号・ラベル・ベンチ表記を正しい向きに保つ） */
function counterTransformFor(orientation) {
  const { portrait, flip } = orientation || effectiveOrientation();
  return flip
    ? (portrait ? "scale(-1,1) rotate(-90)" : "scale(-1,1)")
    : (portrait ? "rotate(-90)" : null);
}

/* 控えエリアの奥行きのうち、選手を安全にドラッグできる範囲（マーカー半径＋ラベル分の余白を除く） */
function benchDragMargin() {
  const R = markerR();
  const fs = Math.max(1.6, R * 0.62);
  return R + fs * 1.6;
}

/* ---------- ビューボックス / 向き ---------- */
/* コートの高さ計算に使う「安定した画面の高さ」。スマホのURLバー出入り（高さだけの変化）では
   更新せず、画面幅が変わったとき（回転・実リサイズ）だけリサイズハンドラが更新する */
let stableViewportH = window.innerHeight;

function applyViewBox() {
  const { W, H } = court();
  const { portrait, flip } = effectiveOrientation();
  const extraBottom = benchActive() ? BENCH_DEPTH : 0; // ベンチ帯の分だけH方向を拡張

  let vw, vh, originX, originY, transform;
  if (portrait) {
    vw = H + PAD * 2 + extraBottom;
    vh = W + PAD * 2;
    originX = -(H + PAD + extraBottom);
    originY = -PAD;
    transform = flip ? `rotate(90) translate(${W} 0) scale(-1,1)` : "rotate(90)";
  } else {
    vw = W + PAD * 2;
    vh = H + PAD * 2 + extraBottom;
    originX = -PAD;
    originY = -PAD;
    transform = flip ? `translate(${W} 0) scale(-1,1)` : "";
  }
  svg.setAttribute("viewBox", `${originX} ${originY} ${vw} ${vh}`);
  if (transform) scene.setAttribute("transform", transform);
  else scene.removeAttribute("transform");
  svg.style.aspectRatio = `${vw} / ${vh}`;

  // 高さ制限に収まるよう幅も明示的に絞る（レターボックスの余白をなくす）。
  // スマホのスクロールでURLバーが出入りするとinnerHeightが揺れてコートが伸縮して見えるため、
  // 画面幅が変わったときだけ更新する「安定した高さ」(stableViewportH)を使う
  svg.style.width = "100%";
  const availW = svg.getBoundingClientRect().width;
  const maxH = window.innerWidth <= 900
    ? stableViewportH * 0.66
    : stableViewportH - 240;
  const w = Math.min(availW, Math.max(200, maxH) * (vw / vh));
  if (w < availW) svg.style.width = `${Math.round(w)}px`;
}

/* ---------- 控えエリア（将棋の駒台のような、コート外の待機スペース） ---------- */
function renderBench() {
  const L = layers.bench;
  L.innerHTML = "";
  if (!benchActive()) return;
  const { W, H } = court();
  const theme = COURT_THEMES[state.courtColor] || COURT_THEMES.vivid;
  const y0 = H;

  // コートと同系色で塗ってから少し暗くし、プレー面とは区別しつつ一体感を持たせる
  el("rect", { x: -PAD, y: y0, width: W + PAD * 2, height: BENCH_DEPTH, fill: theme.bg }, L);
  el("rect", { x: -PAD, y: y0, width: W + PAD * 2, height: BENCH_DEPTH, fill: "rgba(0,0,0,0.4)" }, L);
  el("line", {
    x1: -PAD, y1: y0, x2: W + PAD, y2: y0,
    stroke: "rgba(255,255,255,0.3)", "stroke-width": 0.3, "stroke-dasharray": "1.4 1.2",
  }, L);

  // ラベルはシーンの回転・反転を打ち消して常に正しい向きで表示し、
  // 帯の奥行き(BENCH_DEPTH)に収まるよう中央揃え・小さめのフォントにする
  const fs = Math.min(2.2, BENCH_DEPTH * 0.19);
  const anchor = el("g", { transform: `translate(${W / 2} ${y0 + BENCH_DEPTH / 2})` }, L);
  const inner = el("g", { transform: counterTransformFor() }, anchor);
  const label = el("text", {
    x: 0, y: 0, "font-size": fs, "font-weight": 700,
    "text-anchor": "middle", "dominant-baseline": "central",
    fill: "rgba(255,255,255,0.55)",
  }, inner);
  label.textContent = "控え";
}

/* ---------- ピッチ描画 ---------- */
function renderPitch() {
  const { W, H } = court();
  const L = layers.pitch;
  L.innerHTML = "";
  const theme = COURT_THEMES[state.courtColor] || COURT_THEMES.vivid;
  renderBench();

  // 余白ごと芝生色で塗る
  el("rect", { x: -PAD, y: -PAD, width: W + PAD * 2, height: H + PAD * 2, fill: theme.bg }, L);

  // 芝生ストライプ
  const stripes = state.courtType === "half" ? 6 : 10;
  for (let i = 0; i < stripes; i++) {
    el("rect", {
      x: (i * W) / stripes, y: 0, width: W / stripes, height: H,
      fill: i % 2 ? theme.c2 : theme.c1,
    }, L);
  }

  const lc = "rgba(255,255,255,0.85)";
  const lw = 0.35;
  const stroke = { fill: "none", stroke: lc, "stroke-width": lw };

  // 外枠（無地でも枠だけは描く）
  el("rect", { x: 0, y: 0, width: W, height: H, ...stroke }, L);
  if (state.courtType === "blank") return;

  const cy = H / 2;
  const penW = 16.5, penH = 40.32;
  const goalW = 5.5, goalH = 18.32;
  const goalMouth = 7.32, goalDepth = 1.9;
  const r = 9.15;

  const drawGoal = (x) => {
    el("rect", {
      x, y: cy - goalMouth / 2, width: goalDepth, height: goalMouth,
      fill: "rgba(255,255,255,0.18)", stroke: lc, "stroke-width": lw * 0.8,
    }, L);
  };
  // ペナルティアーク: ペナルティスポット中心 r=9.15、エリア外側のみ
  const drawArc = (spotX, dir) => {
    const dx = penW - 11;             // スポットからエリア線まで
    const dy = Math.sqrt(r * r - dx * dx);
    const x = spotX + dir * dx;
    const sweep = dir > 0 ? 1 : 0;
    el("path", { d: `M ${x} ${cy - dy} A ${r} ${r} 0 0 ${sweep} ${x} ${cy + dy}`, ...stroke }, L);
  };
  const drawBox = (x, w, h) => {
    el("rect", { x, y: cy - h / 2, width: w, height: h, ...stroke }, L);
  };

  if (state.courtType === "full") {
    // ハーフウェーライン・センターサークル
    el("line", { x1: W / 2, y1: 0, x2: W / 2, y2: H, stroke: lc, "stroke-width": lw }, L);
    el("circle", { cx: W / 2, cy, r, ...stroke }, L);
    el("circle", { cx: W / 2, cy, r: 0.4, fill: lc }, L);
    // 左右のエリア
    drawBox(0, penW, penH); drawBox(W - penW, penW, penH);
    drawBox(0, goalW, goalH); drawBox(W - goalW, goalW, goalH);
    el("circle", { cx: 11, cy, r: 0.35, fill: lc }, L);
    el("circle", { cx: W - 11, cy, r: 0.35, fill: lc }, L);
    drawArc(11, 1); drawArc(W - 11, -1);
    drawGoal(-goalDepth); drawGoal(W);
  } else if (state.courtType === "half") {
    // 左端がゴール、右端がハーフウェーライン
    drawBox(0, penW, penH);
    drawBox(0, goalW, goalH);
    el("circle", { cx: 11, cy, r: 0.35, fill: lc }, L);
    drawArc(11, 1);
    drawGoal(-goalDepth);
    // センターサークルの半分（右端から左へ膨らむ）
    el("path", { d: `M ${W} ${cy - r} A ${r} ${r} 0 0 0 ${W} ${cy + r}`, ...stroke }, L);
    el("circle", { cx: W, cy, r: 0.4, fill: lc }, L);
  }
}

/* ---------- 注釈（図形・矢印） ---------- */
function getAnno(id) {
  return state.annotations.find((a) => a.id === id) || null;
}

/* 点(x,y)を(cx,cy)中心にdeg度回転した座標を返す */
function rotatePt(x, y, cx, cy, deg) {
  const rad = (deg * Math.PI) / 180;
  const c = Math.cos(rad), s = Math.sin(rad);
  const dx = x - cx, dy = y - cy;
  return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
}

function annoCenter(a) {
  if (a.type === "rect") return { x: a.x + a.w / 2, y: a.y + a.h / 2 };
  if (a.type === "circle" || a.type === "tri") return { x: a.cx, y: a.cy };
  if (a.type === "cone" || a.type === "marker") return { x: a.x, y: a.y };
  return { x: (a.x1 + a.x2) / 2, y: (a.y1 + a.y2) / 2 };
}

/* 縦表示でsceneが回転していても図形が画面上で同じ向きに見えるようにするための逆回転角（度）。
   図形は左右対称なのでflip（半面コートの反転）は打ち消さなくても見た目が崩れない */
function annoCounterRot() {
  return effectiveOrientation().portrait ? -90 : 0;
}

/* 正三角形の3頂点（rot=0で頂点が上）。r は外接円の半径 */
function triPointsArr(a) {
  return [0, 1, 2].map((i) => {
    const ang = (((a.rot || 0) - 90 + i * 120) * Math.PI) / 180;
    return { x: a.cx + a.r * Math.cos(ang), y: a.cy + a.r * Math.sin(ang) };
  });
}

function triPoints(a) {
  return triPointsArr(a).map((p) => `${p.x},${p.y}`).join(" ");
}

const bboxOfPts = (pts) => ({
  minX: Math.min(...pts.map((p) => p.x)), minY: Math.min(...pts.map((p) => p.y)),
  maxX: Math.max(...pts.map((p) => p.x)), maxY: Math.max(...pts.map((p) => p.y)),
});

function annoStrokeColor(a) {
  if (a.type === "arrow") return a.style === "pass" ? "#ffffff" : "#ffd54a";
  return "#ffd54a";
}

function buildAnnoEl(a) {
  const g = el("g", { class: "anno" + (state.selectedAnno === a.id ? " selected" : ""), "data-anno": a.id });
  const sw = 0.45;
  const color = annoStrokeColor(a);
  if (a.type === "circle") {
    el("circle", { cx: a.cx, cy: a.cy, r: a.r, fill: "rgba(255,213,74,0.10)", stroke: color, "stroke-width": sw }, g);
  } else if (a.type === "rect") {
    const cr = annoCounterRot();
    const eff = (a.rot || 0) + cr;
    el("rect", {
      x: a.x, y: a.y, width: a.w, height: a.h, rx: 0.5, fill: "rgba(255,213,74,0.10)", stroke: color, "stroke-width": sw,
      transform: eff ? `rotate(${eff} ${a.x + a.w / 2} ${a.y + a.h / 2})` : null,
    }, g);
  } else if (a.type === "tri") {
    const cr = annoCounterRot();
    if (cr) g.setAttribute("transform", `rotate(${cr} ${a.cx} ${a.cy})`);
    el("polygon", { points: triPoints(a), fill: "rgba(255,213,74,0.10)", stroke: color, "stroke-width": sw, "stroke-linejoin": "round" }, g);
  } else if (a.type === "cone") {
    // トレーニング用コーン（オレンジの三角錐＋白帯）。選手より少し小さいサイズに追従させる
    const cr = annoCounterRot();
    if (cr) g.setAttribute("transform", `rotate(${cr} ${a.x} ${a.y})`);
    const cs = markerR() * 1.15;
    el("polygon", {
      points: `${a.x},${a.y - cs} ${a.x - cs * 0.75},${a.y + cs * 0.55} ${a.x + cs * 0.75},${a.y + cs * 0.55}`,
      fill: "#ff7a1a", stroke: "#ffffff", "stroke-width": 0.16, "stroke-linejoin": "round",
    }, g);
    el("line", { x1: a.x - cs * 0.38, y1: a.y - cs * 0.05, x2: a.x + cs * 0.38, y2: a.y - cs * 0.05, stroke: "#ffffff", "stroke-width": 0.16 }, g);
    el("circle", { cx: a.x, cy: a.y, r: Math.max(1.8, cs), fill: "transparent" }, g);
  } else if (a.type === "marker") {
    // マーカーディスク（黄色の平たい円盤）。選手より少し小さいサイズに追従させる
    const mr = markerR() * 0.75;
    el("circle", { cx: a.x, cy: a.y, r: mr, fill: "#ffe23e", stroke: "#c99700", "stroke-width": 0.14 }, g);
    el("circle", { cx: a.x, cy: a.y, r: mr * 0.4, fill: "none", stroke: "#c99700", "stroke-width": 0.12 }, g);
    el("circle", { cx: a.x, cy: a.y, r: Math.max(1.8, mr * 1.2), fill: "transparent" }, g);
  } else if (a.type === "arrow") {
    const dash = a.style === "run" ? "1.6 1.2" : null;
    const markerId = a.style === "run" ? "ah-run" : a.style === "pass" ? "ah-pass" : null;
    el("line", {
      x1: a.x1, y1: a.y1, x2: a.x2, y2: a.y2,
      stroke: color, "stroke-width": sw, "stroke-dasharray": dash,
      "marker-end": markerId ? `url(#${markerId})` : null,
    }, g);
    // タッチしやすいように透明の太い当たり判定を重ねる
    el("line", {
      x1: a.x1, y1: a.y1, x2: a.x2, y2: a.y2,
      stroke: "rgba(0,0,0,0)", "stroke-width": Math.max(3, 26 / pxPerMeter()),
    }, g);
  }
  return g;
}

function renderAnnotations() {
  layers.anno.innerHTML = "";
  for (const a of state.annotations) layers.anno.appendChild(buildAnnoEl(a));
}

function annoBBox(a) {
  if (a.type === "circle") return { minX: a.cx - a.r, minY: a.cy - a.r, maxX: a.cx + a.r, maxY: a.cy + a.r };
  if (a.type === "tri") {
    const cr = annoCounterRot();
    const pts = triPointsArr(a).map((p) => (cr ? rotatePt(p.x, p.y, a.cx, a.cy, cr) : p));
    return bboxOfPts(pts);
  }
  if (a.type === "cone" || a.type === "marker") {
    const r = Math.max(1.5, markerR() * 1.2); // 向きに関わらず収まる正方形で近似
    return { minX: a.x - r, minY: a.y - r, maxX: a.x + r, maxY: a.y + r };
  }
  if (a.type === "rect") {
    const eff = (a.rot || 0) + annoCounterRot();
    if (!eff) return { minX: a.x, minY: a.y, maxX: a.x + a.w, maxY: a.y + a.h };
    const c = annoCenter(a);
    const corners = [
      rotatePt(a.x, a.y, c.x, c.y, eff),
      rotatePt(a.x + a.w, a.y, c.x, c.y, eff),
      rotatePt(a.x, a.y + a.h, c.x, c.y, eff),
      rotatePt(a.x + a.w, a.y + a.h, c.x, c.y, eff),
    ];
    return bboxOfPts(corners);
  }
  return {
    minX: Math.min(a.x1, a.x2), minY: Math.min(a.y1, a.y2),
    maxX: Math.max(a.x1, a.x2), maxY: Math.max(a.y1, a.y2),
  };
}

function renderHandles() {
  const L = layers.handles;
  L.innerHTML = "";
  const a = getAnno(state.selectedAnno);
  if (!a) return;

  const hr = handleR();
  const { W, H } = court();

  // 選択中の点線アウトライン（縦表示の逆回転も図形本体と同じように掛ける）
  const cr = annoCounterRot();
  if (a.type === "circle") {
    el("circle", { cx: a.cx, cy: a.cy, r: a.r + 0.9, fill: "none", stroke: "rgba(255,255,255,0.7)", "stroke-width": 0.18, "stroke-dasharray": "1 1", "pointer-events": "none" }, L);
  } else if (a.type === "rect") {
    const effOutline = (a.rot || 0) + cr;
    el("rect", {
      x: a.x - 0.9, y: a.y - 0.9, width: a.w + 1.8, height: a.h + 1.8, fill: "none", stroke: "rgba(255,255,255,0.7)", "stroke-width": 0.18, "stroke-dasharray": "1 1", "pointer-events": "none",
      transform: effOutline ? `rotate(${effOutline} ${a.x + a.w / 2} ${a.y + a.h / 2})` : null,
    }, L);
  } else if (a.type === "tri") {
    el("polygon", {
      points: triPoints({ cx: a.cx, cy: a.cy, r: a.r + 0.9, rot: a.rot }), fill: "none", stroke: "rgba(255,255,255,0.7)", "stroke-width": 0.18, "stroke-dasharray": "1 1", "pointer-events": "none",
      transform: cr ? `rotate(${cr} ${a.cx} ${a.cy})` : null,
    }, L);
  } else if (a.type === "cone" || a.type === "marker") {
    el("circle", { cx: a.x, cy: a.y, r: Math.max(2.0, markerR() * 1.3), fill: "none", stroke: "rgba(255,255,255,0.7)", "stroke-width": 0.18, "stroke-dasharray": "1 1", "pointer-events": "none" }, L);
  }

  const mkHandle = (x, y, role, fillColor) => {
    const g = el("g", { class: "handle", "data-role": role, transform: `translate(${x} ${y})` }, L);
    el("circle", { r: hr * 1.4, fill: "transparent" }, g); // 当たり判定
    el("circle", { r: hr, fill: fillColor || "#ffffff", stroke: "#1f2937", "stroke-width": 0.18 }, g);
    return g;
  };

  let rotHandlePos = null; // 削除・複製ボタンが回転ハンドルに重ならないよう位置を覚えておく
  if (a.type === "circle") {
    mkHandle(a.cx + a.r, a.cy, "resize");
  } else if (a.type === "rect") {
    const c = annoCenter(a);
    const eff = (a.rot || 0) + cr;
    const br = rotatePt(a.x + a.w, a.y + a.h, c.x, c.y, eff);
    mkHandle(br.x, br.y, "resize");
    rotHandlePos = rotatePt(c.x, a.y - 2.4, c.x, c.y, eff);
    mkHandle(rotHandlePos.x, rotHandlePos.y, "rotate", "#10b981"); // 緑＝回転ハンドル
  } else if (a.type === "tri") {
    const v0 = triPointsArr(a)[1]; // 右下の頂点＝サイズ変更
    const v = cr ? rotatePt(v0.x, v0.y, a.cx, a.cy, cr) : v0;
    mkHandle(v.x, v.y, "resize");
    const angA = (((a.rot || 0) - 90 + cr) * Math.PI) / 180; // 頂点方向の先＝回転
    const rd = a.r + 2.4;
    rotHandlePos = { x: a.cx + rd * Math.cos(angA), y: a.cy + rd * Math.sin(angA) };
    mkHandle(rotHandlePos.x, rotHandlePos.y, "rotate", "#10b981");
  } else if (a.type === "arrow") {
    mkHandle(a.x1, a.y1, "p1");
    mkHandle(a.x2, a.y2, "p2");
  }

  // 削除ボタン（右上）。回転ハンドルの位置も含めた外接枠の外側に、
  // ハンドルの大きさ（画面サイズで変わる）に応じた距離だけ離して置く
  let bb = annoBBox(a);
  if (rotHandlePos) {
    bb = {
      minX: Math.min(bb.minX, rotHandlePos.x), minY: Math.min(bb.minY, rotHandlePos.y),
      maxX: Math.max(bb.maxX, rotHandlePos.x), maxY: Math.max(bb.maxY, rotHandlePos.y),
    };
  }
  const btnOff = Math.max(2.6, hr * 1.8);
  const bx = clamp(bb.maxX + btnOff, 2, W - 2);
  const by = clamp(bb.minY - btnOff, 2, H - 2);
  const del = el("g", { class: "handle handle-delete", "data-role": "delete", transform: `translate(${bx} ${by})` }, L);
  el("circle", { r: hr * 1.5, fill: "transparent" }, del);
  el("circle", { r: hr * 1.1, fill: "#ef4444", stroke: "#fff", "stroke-width": 0.16 }, del);
  const c = hr * 0.5;
  el("line", { x1: -c, y1: -c, x2: c, y2: c, stroke: "#fff", "stroke-width": Math.max(0.22, hr * 0.18), "stroke-linecap": "round" }, del);
  el("line", { x1: -c, y1: c, x2: c, y2: -c, stroke: "#fff", "stroke-width": Math.max(0.22, hr * 0.18), "stroke-linecap": "round" }, del);

  // 複製ボタン（左上）
  const dx = clamp(bb.minX - btnOff, 2, W - 2);
  const dy = clamp(bb.minY - btnOff, 2, H - 2);
  const dup = el("g", { class: "handle handle-duplicate", "data-role": "duplicate", transform: `translate(${dx} ${dy})` }, L);
  el("circle", { r: hr * 1.5, fill: "transparent" }, dup);
  el("circle", { r: hr * 1.1, fill: "#3b82f6", stroke: "#fff", "stroke-width": 0.16 }, dup);
  const s = hr * 0.42;
  const sw = Math.max(0.18, hr * 0.16);
  el("rect", { x: -s * 0.9, y: -s * 0.5, width: s * 1.15, height: s * 1.15, rx: s * 0.15, fill: "none", stroke: "#fff", "stroke-width": sw }, dup);
  el("rect", { x: -s * 0.35, y: -s * 1.0, width: s * 1.15, height: s * 1.15, rx: s * 0.15, fill: "none", stroke: "#fff", "stroke-width": sw }, dup);
}

/* 図形を少しずらした位置に複製する */
function duplicateAnno(id) {
  const a = getAnno(id);
  if (!a) return;
  pushUndo();
  const { W, H } = court();
  const copy = deep(a);
  copy.id = newAnnoId();
  const off = 3;
  if (copy.type === "circle" || copy.type === "tri") {
    copy.cx = clamp(copy.cx + off, 0, W);
    copy.cy = clamp(copy.cy + off, 0, H);
  } else if (copy.type === "cone" || copy.type === "marker") {
    copy.x = clamp(copy.x + off, 0, W);
    copy.y = clamp(copy.y + off, 0, H);
  } else if (copy.type === "rect") {
    copy.x = clamp(copy.x + off, 0, Math.max(0, W - copy.w));
    copy.y = clamp(copy.y + off, 0, Math.max(0, H - copy.h));
  } else if (copy.type === "arrow") {
    copy.x1 = clamp(copy.x1 + off, 0, W); copy.y1 = clamp(copy.y1 + off, 0, H);
    copy.x2 = clamp(copy.x2 + off, 0, W); copy.y2 = clamp(copy.y2 + off, 0, H);
  }
  state.annotations.push(copy);
  selectAnno(copy.id);
  updateFramesTimeline();
  scheduleAutosave();
}

function selectAnno(id) {
  state.selectedAnno = id;
  renderAnnotations();
  renderHandles();
}

function deleteAnno(id) {
  pushUndo();
  state.annotations = state.annotations.filter((a) => a.id !== id);
  state.selectedAnno = null;
  renderAnnotations();
  renderHandles();
  scheduleAutosave();
}

function clearAnnotations() {
  if (state.annotations.length === 0) return;
  if (!confirm("描いた図形・矢印をすべて削除しますか？")) return;
  pushUndo();
  state.annotations = [];
  state.selectedAnno = null;
  renderAnnotations();
  renderHandles();
  scheduleAutosave();
}

/* ---------- 選手・ボール（トークン） ---------- */
function ensurePlayers() {
  for (const team of ["a", "b"]) {
    for (let i = 1; i <= 20; i++) {
      const key = `p-${team}${i}`;
      if (!state.players[key]) state.players[key] = { team, num: String(i), label: "" };
    }
  }
}

function activeIds() {
  const ids = [];
  for (let i = 1; i <= state.playerCountA; i++) ids.push(`p-a${i}`);
  for (let i = 1; i <= state.playerCountB; i++) ids.push(`p-b${i}`);
  return ids;
}

function pentagonPoints(cx, cy, r, rotDeg) {
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const a = (rotDeg + i * 72) * Math.PI / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(3)},${(cy + r * Math.sin(a)).toFixed(3)}`);
  }
  return pts.join(" ");
}

/* 定番のサッカーボール柄。実物と同じ「中央に黒五角形→それを囲む白い六角形の輪→
   ボールの縁で切れる黒五角形」の構成にする（六角形は縁取り線だけで内側は素地の白のまま）。
   円でクリップして縁の五角形が自然に切れて見えるようにする */
function buildBallPattern(rb) {
  const g = el("g", { "pointer-events": "none" });
  const defs = el("defs", null, g);
  const clip = el("clipPath", { id: "ball-pattern-clip" }, defs);
  el("circle", { cx: 0, cy: 0, r: rb * 0.99 }, clip);

  const pat = el("g", { "clip-path": "url(#ball-pattern-clip)" }, g);
  const dark = "#20242b";
  // ballR()は画面上ほぼ常に9px固定（9/pxPerMeter()）なので、比率だけだと縫い目線が
  // 実機で1px未満になり見えなくなる。画面上で最低1px強は確保する
  const seam = Math.max(rb * 0.06, 1.1 / pxPerMeter());

  const pentR = rb * 0.30;   // 中央の黒五角形
  const hexDist = rb * 0.60; // 六角形の中心までの距離
  const hexR = rb * 0.30;    // 六角形の頂点までの距離（中央五角形の頂点と揃う）
  const rimDist = rb * 0.80; // 縁の五角形の中心までの距離
  const rimR = rb * 0.32;    // 縁の五角形の大きさ（円の外まではみ出してクリップされる）

  el("polygon", {
    points: pentagonPoints(0, 0, pentR, -90), fill: dark,
    stroke: dark, "stroke-width": seam, "stroke-linejoin": "round",
  }, pat);

  for (let k = 0; k < 5; k++) {
    const ang = -90 + 36 + k * 72;
    const cx = hexDist * Math.cos(ang * Math.PI / 180);
    const cy = hexDist * Math.sin(ang * Math.PI / 180);
    const pts = [];
    for (let j = 0; j < 6; j++) {
      const a = (ang + 180 + j * 60) * Math.PI / 180;
      pts.push(`${(cx + hexR * Math.cos(a)).toFixed(3)},${(cy + hexR * Math.sin(a)).toFixed(3)}`);
    }
    el("polygon", {
      points: pts.join(" "), fill: "none",
      stroke: dark, "stroke-width": seam, "stroke-linejoin": "round",
    }, pat);
  }

  for (let k = 0; k < 5; k++) {
    const ang = -90 + k * 72;
    const cx = rimDist * Math.cos(ang * Math.PI / 180);
    const cy = rimDist * Math.sin(ang * Math.PI / 180);
    el("polygon", {
      points: pentagonPoints(cx, cy, rimR, ang), fill: dark,
      stroke: dark, "stroke-width": seam, "stroke-linejoin": "round",
    }, pat);
  }
  return g;
}

let tokenEls = {};
let lastRendered = {}; // 直近に描画した座標（アニメーションの開始点に使う）

function buildTokens() {
  layers.tokens.innerHTML = "";
  tokenEls = {};
  const R = markerR();
  const rb = ballR();
  const ppm = pxPerMeter();
  const hitPad = Math.max(0.8, 8 / ppm);
  const counterRot = counterTransformFor();

  for (const id of activeIds()) {
    const meta = state.players[id];
    const g = el("g", { class: `token team-${meta.team}`, "data-token": id }, layers.tokens);
    const inner = el("g", { class: "inner", transform: counterRot }, g);
    el("circle", { r: R + hitPad, fill: "transparent", class: "hit" }, inner);
    el("circle", { r: R, class: "body" }, inner);
    const num = el("text", { class: "num", "text-anchor": "middle", "dominant-baseline": "central", "font-size": (R * 1.0).toFixed(2) }, inner);
    num.textContent = meta.num;
    if (meta.label) {
      const fs = Math.max(1.6, R * 0.62);
      const lbl = el("text", { class: "lbl", "text-anchor": "middle", "dominant-baseline": "central", y: (R + fs * 0.85).toFixed(2), "font-size": fs.toFixed(2) }, inner);
      lbl.textContent = meta.label;
    }
    tokenEls[id] = g;
  }

  // ボール
  const g = el("g", { class: "token ball", "data-token": "ball" }, layers.tokens);
  const inner = el("g", { class: "inner", transform: counterRot }, g);
  el("circle", { r: rb + hitPad, fill: "transparent", class: "hit" }, inner);
  el("circle", { r: rb, fill: "#f5f5f5", stroke: "#777", "stroke-width": 0.14 }, inner);
  inner.appendChild(buildBallPattern(rb));
  tokenEls["ball"] = g;
}

function updateTokenPositions(pos) {
  for (const id of Object.keys(tokenEls)) {
    const p = pos[id];
    if (!p) continue;
    tokenEls[id].setAttribute("transform", `translate(${p.x} ${p.y})`);
    lastRendered[id] = { x: p.x, y: p.y };
  }
}

function currentFrame() {
  return state.frames[state.currentFrameIndex];
}

/* ---------- 動きの矢印（コマ間の移動を自動でパス/走路矢印として表示） ---------- */
function drawPaths() {
  layers.paths.innerHTML = "";
  if (!state.showPaths || state.frames.length < 2) return;

  const ids = [...activeIds(), "ball"];
  for (const id of ids) {
    const pts = state.frames.map((f) => f[id]).filter(Boolean);
    if (pts.length < 2) continue;
    const isBall = id === "ball";

    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1], p1 = pts[i];
      if (dist(p0, p1) < 0.3) continue; // ほとんど動いていない区間は矢印を出さない

      const attrs = {
        x1: p0.x.toFixed(2), y1: p0.y.toFixed(2),
        x2: p1.x.toFixed(2), y2: p1.y.toFixed(2),
        "stroke-linecap": "round", "pointer-events": "none",
      };
      if (isBall) {
        Object.assign(attrs, {
          stroke: "rgba(255,255,255,0.85)", "stroke-width": 0.28,
          "marker-end": "url(#ah-trail-pass)",
        });
      } else if (id.startsWith("p-a")) {
        Object.assign(attrs, {
          stroke: "rgba(0,210,255,0.75)", "stroke-width": 0.28, "stroke-dasharray": "1.1 1.1",
          "marker-end": "url(#ah-trail-run-a)",
        });
      } else {
        Object.assign(attrs, {
          stroke: "rgba(255,65,108,0.75)", "stroke-width": 0.28, "stroke-dasharray": "1.1 1.1",
          "marker-end": "url(#ah-trail-run-b)",
        });
      }
      el("line", attrs, layers.paths);
    }
  }
}

/* ---------- フォーメーション / コマ ---------- */
function getFormationPositions(team, formationName, count) {
  const { W, H } = court();
  const useCount = count || (team === "a" ? state.playerCountA : state.playerCountB);
  let basePositions;
  if (useCount === 11) {
    const f = formations[formationName] || formations["4-4-2"];
    basePositions = [];
    for (let i = 1; i <= 11; i++) basePositions.push(f[i]);
  } else {
    basePositions = simpleFormations[useCount] || simpleFormations[8];
  }
  const positions = {};
  for (let i = 0; i < useCount; i++) {
    const key = `p-${team}${i + 1}`;
    const b = basePositions[i];
    const xm = (b.x / 100) * W;
    const ym = (b.y / 100) * H;
    positions[key] = {
      // チームA(青)が既定で「高いx」側＝縦画面で下・横画面で右に来るようにする
      x: team === "b" ? xm : W - xm,
      y: ym,
      role: b.role,
    };
  }
  return positions;
}

function spawnPos(team, i) {
  const { W, H } = court();
  if (i > 11 && benchActive()) {
    // 12人目以降は控えエリアへ直接配置する。チームAとBで行を分けて重ならないようにする
    const idx = i - 12; // 0..8 (最大9人分: 12〜20人目)
    const cols = 9;
    const col = idx % cols;
    const marginX = W * 0.06;
    const x = clamp(marginX + (col * (W - marginX * 2)) / (cols - 1), 2, W - 2);
    const y = team === "a"
      ? clamp(H + 2, H + 1, H + BENCH_DEPTH - 0.5)
      : clamp(H + BENCH_DEPTH - benchDragMargin(), H + 1, H + BENCH_DEPTH - 0.5);
    return { x, y };
  }
  const x = team === "b" ? W * 0.28 : W * 0.72;
  const y = clamp(H / 2 + (i - 6) * 4, 2, H - 2);
  return { x, y };
}

function createDefaultFrame(applyLabels) {
  const { W, H } = court();
  const frame = {};
  for (const team of ["a", "b"]) {
    const count = team === "a" ? state.playerCountA : state.playerCountB;
    const onPitchCount = Math.min(count, 11);
    const pos = getFormationPositions(team, "4-4-2", onPitchCount);
    for (const key of Object.keys(pos)) {
      frame[key] = { x: pos[key].x, y: pos[key].y };
    }
    // 12人目以降は控えエリアへ（フォーメーションの定義がないため）
    for (let i = 12; i <= count; i++) {
      frame[`p-${team}${i}`] = spawnPos(team, i);
    }
    if (applyLabels) {
      if (onPitchCount === 11) {
        // 11人ちょうどは4-4-2本来の役割構成（GK1/DF4/MF4/FW2）をそのまま使う
        for (const key of Object.keys(pos)) state.players[key].label = pos[key].role || "";
      } else {
        // 11人未満は簡易配置には決まった役割比率がないので、FW:MF:DF=1:2:1で付与する
        reassignRoleLabels(team, count);
      }
    }
  }
  frame["ball"] = { x: W / 2, y: H / 2 };
  return frame;
}

/* 半面コート専用の既定配置: チームAのみを使い、コート全体に広げて配置する。
   ボールはハーフウェーライン中央（センターサークルの位置）に置く */
function createHalfDefaultFrame() {
  const { W, H } = court();
  const frame = {};
  const count = clamp(state.playerCountA || 8, 1, 20);
  const onPitchCount = Math.min(count, 11);
  let basePositions;
  if (onPitchCount === 11) {
    const f = formations["4-4-2"];
    basePositions = [];
    for (let i = 1; i <= 11; i++) basePositions.push(f[i]);
  } else {
    basePositions = simpleFormations[onPitchCount];
  }
  // 通常フォーメーションのx範囲（およそ5〜46%）をハーフコート全体（8〜92%）へ引き伸ばす
  const remapX = (x) => 8 + ((x - 5) / (46 - 5)) * (92 - 8);
  for (let i = 0; i < onPitchCount; i++) {
    const key = `p-a${i + 1}`;
    const b = basePositions[i];
    const xPct = clamp(remapX(b.x), 2, 98);
    frame[key] = { x: (xPct / 100) * W, y: (b.y / 100) * H };
  }
  if (onPitchCount === 11) {
    // 11人ちょうどは4-4-2本来の役割構成をそのまま使う
    for (let i = 0; i < onPitchCount; i++) state.players[`p-a${i + 1}`].label = basePositions[i].role || "";
  } else {
    // 11人未満はFW:MF:DF=1:2:1の比率で付与する
    reassignRoleLabels("a", count);
  }
  // 12人目以降は控えエリアへ
  for (let i = 12; i <= count; i++) {
    const key = `p-a${i}`;
    frame[key] = spawnPos("a", i);
    state.players[key].label = "";
  }
  frame["ball"] = { x: W, y: H / 2 }; // ハーフウェーライン中央＝センターサークル位置
  return frame;
}

/* コマに存在しない選手の座標を補完する */
function ensureFrameCompleteness(frame) {
  const { W, H } = court();
  for (const id of activeIds()) {
    if (!frame[id]) {
      const team = id.includes("-a") ? "a" : "b";
      const i = parseInt(id.replace(`p-${team}`, ""), 10);
      frame[id] = spawnPos(team, i);
    }
  }
  if (!frame["ball"]) frame["ball"] = { x: W / 2, y: H / 2 };
}

function applyFormation(team, formationName) {
  stopPlayback();
  cancelAnim();
  pushUndo();
  const frame = currentFrame();
  const count = team === "a" ? state.playerCountA : state.playerCountB;
  const onPitchCount = Math.min(count, 11);
  const positions = getFormationPositions(team, formationName, onPitchCount);
  for (const key of Object.keys(positions)) {
    frame[key] = { x: positions[key].x, y: positions[key].y };
    if (state.courtType !== "blank") state.players[key].label = positions[key].role || "";
  }
  // 12人目以降は控えのまま（フォーメーションの対象外）。位置がなければ控えへ補完するだけ
  for (let i = 12; i <= count; i++) {
    const key = `p-${team}${i}`;
    if (!frame[key]) frame[key] = spawnPos(team, i);
  }
  buildTokens();
  animateToFrame(state.currentFrameIndex, 350, () => {
    drawPaths();
    updateFramesTimeline();
  });
  scheduleAutosave();
}

/* ---------- アニメーション ---------- */
let animCounter = 0;
let activeAnim = null; // { target }

function cancelAnim() {
  if (activeAnim) {
    // 途中キャンセル時は行き先のコマへ即座にスナップする
    const target = activeAnim.target;
    activeAnim = null;
    animCounter++;
    state.currentFrameIndex = target;
    updateTokenPositions(currentFrame());
    updateHUD();
  }
}

const easeInOut = (k) => (k < 0.5 ? 2 * k * k : -1 + (4 - 2 * k) * k);

function animateToFrame(idx, durMs, done) {
  animCounter++;
  const my = animCounter;
  const to = state.frames[idx];
  if (!to) return;
  const from = {};
  for (const id of Object.keys(tokenEls)) {
    from[id] = lastRendered[id] ? { ...lastRendered[id] } : (to[id] ? { ...to[id] } : null);
  }
  activeAnim = { target: idx };
  const t0 = performance.now();

  function tick(now) {
    if (my !== animCounter) return;
    let k = durMs > 0 ? (now - t0) / durMs : 1;
    k = clamp(k, 0, 1);
    const e = easeInOut(k);
    const pos = {};
    for (const id of Object.keys(tokenEls)) {
      const b = to[id];
      if (!b) continue;
      const a = from[id] || b;
      pos[id] = { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e };
    }
    updateTokenPositions(pos);
    if (k < 1) {
      requestAnimationFrame(tick);
    } else {
      activeAnim = null;
      state.currentFrameIndex = idx;
      updateHUD();
      if (done) done();
    }
  }
  requestAnimationFrame(tick);
}

/* ---------- 再生 ---------- */
function startPlayback() {
  if (state.frames.length <= 1) return;
  state.isPlaying = true;
  updatePlayBtn();
  // 最終コマから再生したときは先頭に戻ってから再生する
  if (state.currentFrameIndex >= state.frames.length - 1) {
    animateToFrame(0, 300, () => {
      if (state.isPlaying) playStep();
    });
  } else {
    playStep();
  }
}

function playStep() {
  if (!state.isPlaying) return;
  let next = state.currentFrameIndex + 1;
  if (next >= state.frames.length) {
    if (state.loopPlayback) {
      next = 0;
    } else {
      stopPlayback();
      return;
    }
  }
  animateToFrame(next, state.speed * 1000, () => {
    if (state.isPlaying) playStep();
  });
}

function stopPlayback() {
  if (!state.isPlaying) return;
  state.isPlaying = false;
  updatePlayBtn();
}

function updatePlayBtn() {
  const btn = $("btn-play");
  btn.textContent = state.isPlaying ? "⏸" : "▶";
  btn.classList.toggle("playing", state.isPlaying);
}

/* ---------- HUD / タイムライン ---------- */
function updateHUD() {
  $("current-frame-num").textContent = state.currentFrameIndex + 1;
  $("total-frames-num").textContent = `/ ${state.frames.length}`;
  // サムネイルの active 切替（作り直しはしない）
  const thumbs = $("frames-list").children;
  for (let i = 0; i < thumbs.length; i++) {
    thumbs[i].classList.toggle("active", i === state.currentFrameIndex);
  }
  const noteEl = $("frame-note");
  if (noteEl && document.activeElement !== noteEl) {
    noteEl.value = (currentFrame() && currentFrame().note) || "";
  }
}

/* 現在のコマのサムネイルにメモ有無のドット表示を反映する */
function updateCurrentThumbNoteDot() {
  const thumbs = $("frames-list").children;
  const thumb = thumbs[state.currentFrameIndex];
  if (!thumb) return;
  const has = !!(currentFrame() && currentFrame().note);
  let dot = thumb.querySelector(".thumb-note-dot");
  if (has && !dot) {
    dot = document.createElement("span");
    dot.className = "thumb-note-dot";
    thumb.appendChild(dot);
  } else if (!has && dot) {
    dot.remove();
  }
}

function buildThumbSvg(frame) {
  const { W, H } = court();
  const extraBottom = benchActive() ? BENCH_DEPTH : 0;
  const s = document.createElementNS(SVGNS, "svg");
  s.setAttribute("viewBox", `0 0 ${W} ${H + extraBottom}`);
  el("rect", { x: 0, y: 0, width: W, height: H, fill: "#17402a" }, s);
  if (extraBottom) el("rect", { x: 0, y: H, width: W, height: extraBottom, fill: "rgba(8,12,18,0.55)" }, s);
  // 図形をうっすら
  for (const a of state.annotations) {
    if (a.type === "circle") {
      el("circle", { cx: a.cx, cy: a.cy, r: a.r, fill: "none", stroke: "rgba(255,213,74,0.5)", "stroke-width": 0.8 }, s);
    } else if (a.type === "rect") {
      el("rect", {
        x: a.x, y: a.y, width: a.w, height: a.h, fill: "none", stroke: "rgba(255,213,74,0.5)", "stroke-width": 0.8,
        transform: a.rot ? `rotate(${a.rot} ${a.x + a.w / 2} ${a.y + a.h / 2})` : null,
      }, s);
    } else if (a.type === "tri") {
      el("polygon", { points: triPoints(a), fill: "none", stroke: "rgba(255,213,74,0.5)", "stroke-width": 0.8 }, s);
    } else if (a.type === "cone") {
      el("circle", { cx: a.x, cy: a.y, r: 1.1, fill: "rgba(255,122,26,0.85)" }, s);
    } else if (a.type === "marker") {
      el("circle", { cx: a.x, cy: a.y, r: 0.9, fill: "rgba(255,226,62,0.85)" }, s);
    } else if (a.type === "arrow") {
      el("line", { x1: a.x1, y1: a.y1, x2: a.x2, y2: a.y2, stroke: "rgba(255,255,255,0.4)", "stroke-width": 0.8 }, s);
    }
  }
  for (const id of activeIds()) {
    const p = frame[id];
    if (!p) continue;
    el("circle", { cx: p.x, cy: p.y, r: 2.6, fill: id.startsWith("p-a") ? "#00b4e6" : "#ff416c" }, s);
  }
  if (frame["ball"]) {
    el("circle", { cx: frame["ball"].x, cy: frame["ball"].y, r: 1.7, fill: "#fff" }, s);
  }
  return s;
}

function updateFramesTimeline() {
  const list = $("frames-list");
  list.innerHTML = "";
  state.frames.forEach((f, idx) => {
    const d = document.createElement("div");
    d.className = "frame-thumb" + (idx === state.currentFrameIndex ? " active" : "");
    d.appendChild(buildThumbSvg(f));
    const n = document.createElement("span");
    n.className = "thumb-num";
    n.textContent = idx + 1;
    d.appendChild(n);
    if (f.note) {
      const dot = document.createElement("span");
      dot.className = "thumb-note-dot";
      d.appendChild(dot);
    }
    d.addEventListener("click", () => {
      stopPlayback();
      cancelAnim();
      animateToFrame(idx, 300, () => drawPaths());
    });
    list.appendChild(d);
  });
  updateHUD();
}

/* ---------- Undo ---------- */
function serializeDoc() {
  const doc = deep({
    v: 1,
    appVersion: APP_VERSION,
    courtType: state.courtType,
    courtColor: state.courtColor,
    halfFacing: state.halfFacing,
    playerCountA: state.playerCountA,
    playerCountB: state.playerCountB,
    players: state.players,
    frames: state.frames,
    annotations: state.annotations,
    speed: state.speed,
    showPaths: state.showPaths,
    loopPlayback: state.loopPlayback,
    currentFrameIndex: state.currentFrameIndex,
    activeSaveName: state.activeSaveName,
  });
  // 既定値のまま（番号=初期値・ラベル無し）の選手は保存しない。読み込み時にensurePlayersが同じ値で補完する
  for (const key of Object.keys(doc.players)) {
    const p = doc.players[key];
    if (p.label === "" && p.num === key.replace(/^p-[ab]/, "")) delete doc.players[key];
  }
  // 座標を小数2桁（メートル）に丸めてデータを軽くする。1cm未満の精度は表示に影響しない
  const r2 = (v) => (typeof v === "number" ? Math.round(v * 100) / 100 : v);
  for (const f of doc.frames) {
    for (const k of Object.keys(f)) {
      if (k === "note") continue;
      f[k].x = r2(f[k].x); f[k].y = r2(f[k].y);
    }
  }
  for (const a of doc.annotations) {
    for (const k of Object.keys(a)) a[k] = r2(a[k]);
  }
  return doc;
}

/* 外部ファイル由来の図形データを型・数値チェックして正規化する（壊れたものはnull＝破棄） */
function sanitizeAnno(raw) {
  if (!raw || typeof raw !== "object") return null;
  const n = (v) => { const x = Number(v); return Number.isFinite(x) ? x : null; };
  const id = typeof raw.id === "string" && raw.id ? raw.id.slice(0, 40) : newAnnoId();
  const rot = (((n(raw.rot) || 0) % 360) + 360) % 360;
  if (raw.type === "circle" || raw.type === "tri") {
    const cx = n(raw.cx), cy = n(raw.cy), r = n(raw.r);
    if (cx === null || cy === null || r === null) return null;
    const a = { id, type: raw.type, cx, cy, r: Math.max(0.4, r) };
    if (raw.type === "tri" && rot) a.rot = rot;
    return a;
  }
  if (raw.type === "rect") {
    const x = n(raw.x), y = n(raw.y), w = n(raw.w), h = n(raw.h);
    if (x === null || y === null || w === null || h === null) return null;
    const a = { id, type: "rect", x, y, w: Math.max(0.5, w), h: Math.max(0.5, h) };
    if (rot) a.rot = rot;
    return a;
  }
  if (raw.type === "cone" || raw.type === "marker") {
    const x = n(raw.x), y = n(raw.y);
    if (x === null || y === null) return null;
    return { id, type: raw.type, x, y };
  }
  if (raw.type === "arrow") {
    const x1 = n(raw.x1), y1 = n(raw.y1), x2 = n(raw.x2), y2 = n(raw.y2);
    if (x1 === null || y1 === null || x2 === null || y2 === null) return null;
    const style = ["pass", "run", "line"].includes(raw.style) ? raw.style : "pass";
    return { id, type: "arrow", style, x1, y1, x2, y2 };
  }
  return null;
}

function loadDoc(doc) {
  stopPlayback();
  animCounter++;
  activeAnim = null;

  state.courtType = COURTS[doc.courtType] ? doc.courtType : "full";
  state.courtColor = COURT_THEMES[doc.courtColor] ? doc.courtColor : "vivid";
  state.halfFacing = ["left", "right", "up", "down"].includes(doc.halfFacing) ? doc.halfFacing : "left";
  const aRaw = parseInt(doc.playerCountA, 10);
  const bRaw = parseInt(doc.playerCountB, 10);
  state.playerCountA = clamp(Number.isFinite(aRaw) ? aRaw : 8, 1, 20);
  state.playerCountB = clamp(Number.isFinite(bRaw) ? bRaw : 8, 0, 20);

  state.players = {};
  ensurePlayers();
  if (doc.players && typeof doc.players === "object") {
    for (const key of Object.keys(state.players)) {
      const p = doc.players[key];
      if (p) {
        state.players[key].num = String(p.num ?? state.players[key].num).slice(0, 3);
        state.players[key].label = String(p.label ?? "").slice(0, 10);
      }
    }
  }

  state.frames = Array.isArray(doc.frames) && doc.frames.length > 0 ? deep(doc.frames) : [createDefaultFrame(false)];
  state.frames = state.frames.filter((f) => f && typeof f === "object").slice(0, 300); // 異常に大きい外部データはメモリ保護のため打ち切る
  if (state.frames.length === 0) state.frames = [createDefaultFrame(false)];
  // 外部ファイル由来の壊れた値（数値でない座標など）は捨てて自動補完に任せる
  state.frames.forEach((f) => {
    for (const key of Object.keys(f)) {
      if (key === "note") continue;
      const x = Number(f[key] && f[key].x), y = Number(f[key] && f[key].y);
      if (Number.isFinite(x) && Number.isFinite(y)) f[key] = { x, y };
      else delete f[key];
    }
    if (typeof f.note === "string") f.note = f.note.slice(0, 200);
    else delete f.note;
  });
  state.frames.forEach(ensureFrameCompleteness);
  state.currentFrameIndex = clamp(parseInt(doc.currentFrameIndex, 10) || 0, 0, state.frames.length - 1);

  state.annotations = Array.isArray(doc.annotations)
    ? doc.annotations.map(sanitizeAnno).filter(Boolean).slice(0, 400)
    : [];
  state.selectedAnno = null;

  state.speed = clamp(parseFloat(doc.speed) || 1.0, 0.2, 3.0);
  state.showPaths = doc.showPaths !== false;
  state.loopPlayback = doc.loopPlayback === true;
  state.activeSaveName = typeof doc.activeSaveName === "string" ? doc.activeSaveName.slice(0, 30) : null;

  renderAll();
}

function pushUndo() {
  undoStack.push(JSON.stringify(serializeDoc()));
  if (undoStack.length > UNDO_MAX) undoStack.shift();
  updateUndoUI();
}

function undo() {
  const s = undoStack.pop();
  if (!s) return;
  loadDoc(JSON.parse(s));
  scheduleAutosave();
  updateUndoUI();
}

function updateUndoUI() {
  $("btn-undo").disabled = undoStack.length === 0;
}

/* ---------- 保存（localStorage / ファイル） ---------- */
let autosaveTimer = null;
function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    try {
      localStorage.setItem(LS_AUTOSAVE, JSON.stringify(serializeDoc()));
    } catch (e) { /* 容量超過などは黙って無視 */ }
  }, 400);
}

function readSaves() {
  try {
    const raw = localStorage.getItem(LS_SAVES);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === "object" ? obj : {};
  } catch (e) {
    return {};
  }
}

function writeSaves(saves) {
  try {
    localStorage.setItem(LS_SAVES, JSON.stringify(saves));
  } catch (e) {
    alert("保存に失敗しました（端末の保存容量を確認してください）");
  }
}

function renderSavesList() {
  const list = $("saves-list");
  const saves = readSaves();
  const names = Object.keys(saves).sort((a, b) => (saves[b].savedAt || 0) - (saves[a].savedAt || 0));
  list.innerHTML = "";
  if (names.length === 0) {
    const p = document.createElement("div");
    p.className = "saves-empty";
    p.textContent = "保存された作戦はまだありません";
    list.appendChild(p);
    return;
  }
  for (const name of names) {
    const row = document.createElement("div");
    row.className = "save-row-item";

    const info = document.createElement("div");
    info.className = "save-info";
    const nm = document.createElement("div");
    nm.className = "save-name";
    nm.textContent = name;
    const dt = document.createElement("div");
    dt.className = "save-date";
    const d = new Date(saves[name].savedAt || 0);
    dt.textContent = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    info.appendChild(nm); info.appendChild(dt);

    const btnLoad = document.createElement("button");
    btnLoad.textContent = "開く";
    btnLoad.addEventListener("click", () => {
      pushUndo();
      loadDoc(saves[name].doc);
      state.activeSaveName = name;
      $("save-name").value = name;
      updateActiveSaveUI();
      scheduleAutosave();
    });

    const btnDel = document.createElement("button");
    btnDel.textContent = "✕";
    btnDel.className = "danger";
    btnDel.addEventListener("click", () => {
      if (!confirm(`「${name}」を削除しますか？`)) return;
      const s = readSaves();
      delete s[name];
      writeSaves(s);
      if (state.activeSaveName === name) {
        state.activeSaveName = null;
        updateActiveSaveUI();
      }
      renderSavesList();
    });

    row.appendChild(info);
    row.appendChild(btnLoad);
    row.appendChild(btnDel);
    list.appendChild(row);
  }
  updateActiveSaveUI();
}

/* 現在編集中の保存（名前欄が一致していれば「保存」で上書きされる）の表示を更新する */
function updateActiveSaveUI() {
  const indicator = $("active-save-indicator");
  if (!indicator) return;
  const saves = readSaves();
  const valid = state.activeSaveName && saves[state.activeSaveName];
  indicator.hidden = !valid;
  if (valid) $("active-save-name").textContent = state.activeSaveName;
}

function saveCurrentAs() {
  const name = $("save-name").value.trim();
  if (!name) {
    alert("保存名を入力してください（例: ロンド4対2）");
    return;
  }
  const saves = readSaves();
  saves[name] = { doc: serializeDoc(), savedAt: Date.now() };
  writeSaves(saves);
  state.activeSaveName = name;
  renderSavesList();
}

function exportToFile() {
  const name = $("save-name").value.trim() || "tactics";
  const blob = new Blob([JSON.stringify(serializeDoc(), null, 1)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function importFromFile(file) {
  // 加工された巨大ファイルでブラウザが固まらないよう上限を設ける（正常な保存データは数十KB程度）
  if (file.size > 5 * 1024 * 1024) {
    alert("ファイルが大きすぎます（5MBまで）。このアプリで書き出したJSONを選んでください。");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const doc = JSON.parse(reader.result);
      if (!doc || !Array.isArray(doc.frames)) throw new Error("invalid");
      pushUndo();
      loadDoc(doc);
      // 読み込んだファイル名を保存名の欄に入れておく。同名の保存がこの端末にあるときだけ
      // 「編集中」（＝保存で上書き）扱いにし、無ければ新規扱いにする
      const base = String(file.name || "").replace(/\.[^.]+$/, "").trim().slice(0, 30);
      if (base) $("save-name").value = base;
      state.activeSaveName = base && readSaves()[base] ? base : null;
      updateActiveSaveUI();
      scheduleAutosave();
    } catch (e) {
      alert("ファイルを読み込めませんでした（このアプリで書き出したJSONを選んでください）");
    }
  };
  reader.readAsText(file);
}

/* 比率(ratios)に従ってtotalを整数配分する（最大剰余法で端数を配分） */
function splitByRatio(total, ratios) {
  const sum = ratios.reduce((a, b) => a + b, 0);
  const raw = ratios.map((r) => (total * r) / sum);
  const floors = raw.map(Math.floor);
  let remainder = total - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => ({ i, frac: v - floors[i] })).sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainder; k++) floors[order[k].i]++;
  return floors;
}

/* 人数変更のたびに、GK/DF/MF/FWのラベルが付いている（＝固有名を付けていない）選手だけを対象に、
   FW:MF:DF = 1:2:1（＋GK1人）の比率でラベルを貼り直す。固有名を付けた選手は対象外＝一切変更しない。
   12人目以降は控えエリアに直接入るポジション未定の選手なので、ラベル付け対象からも外す。 */
function reassignRoleLabels(team, count) {
  if (state.courtType === "blank") return; // 無地コートは既定でラベル無し
  const onPitchCount = Math.min(count, 11);
  const eligible = [];
  for (let i = 1; i <= onPitchCount; i++) {
    const id = `p-${team}${i}`;
    const label = (state.players[id].label || "").trim();
    if (label === "" || POSITION_LABELS.has(label)) eligible.push(id);
  }
  // 12人目以降はラベルを付けない（既にGK/DF/MF/FWが付いていたら念のためクリアする）
  for (let i = 12; i <= count; i++) {
    const id = `p-${team}${i}`;
    const label = (state.players[id].label || "").trim();
    if (POSITION_LABELS.has(label)) state.players[id].label = "";
  }
  if (eligible.length === 0) return;

  const roles = [];
  if (eligible.length === 1) {
    roles.push("");
  } else {
    roles.push("GK");
    const [df, mf, fw] = splitByRatio(eligible.length - 1, [1, 2, 1]); // DF:MF:FW = 1:2:1
    for (let k = 0; k < df; k++) roles.push("DF");
    for (let k = 0; k < mf; k++) roles.push("MF");
    for (let k = 0; k < fw; k++) roles.push("FW");
  }
  eligible.forEach((id, idx) => { state.players[id].label = roles[idx] || ""; });
}

/* ---------- 人数変更 ---------- */
function setPlayerCount(team, count, skipUndo) {
  const min = team === "b" ? 0 : 1; // チームBは相手なし（0人）にもできる
  const newCount = clamp(count, min, 20);
  const old = team === "a" ? state.playerCountA : state.playerCountB;
  if (newCount === old) return;
  if (!skipUndo) pushUndo();
  if (team === "a") state.playerCountA = newCount;
  else state.playerCountB = newCount;

  reassignRoleLabels(team, newCount);

  // 増えた選手の座標を「全コマ」に補完する
  state.frames.forEach(ensureFrameCompleteness);

  buildTokens();
  updateTokenPositions(currentFrame());
  drawPaths();
  updateFramesTimeline();
  syncCountsUI();
  updateFormationPanels();
  scheduleAutosave();
}

function syncCountsUI() {
  $("player-count-a").textContent = state.playerCountA;
  $("player-count-b").textContent = state.playerCountB;
  $("player-count-a-badge").textContent = state.playerCountA;
  $("player-count-b-badge").textContent = state.playerCountB;
}

/* ---------- コート切替 ---------- */
function setCourtType(type) {
  if (!COURTS[type] || type === state.courtType) return;
  stopPlayback();
  cancelAnim();
  pushUndo();

  const o = court();
  const switchingToHalf = type === "half";
  state.courtType = type;
  const n = court();
  const sx = n.W / o.W, sy = n.H / o.H, sr = Math.min(sx, sy);

  if (switchingToHalf) {
    // 半面コートは1チーム用の練習を想定した既定配置に切り替える
    state.playerCountB = 0;
    state.frames = [createHalfDefaultFrame()];
    state.currentFrameIndex = 0;
  } else {
    // 既存の座標を新しいコートサイズへスケーリング
    for (const frame of state.frames) {
      for (const key of Object.keys(frame)) {
        if (key === "note") continue;
        frame[key].x = clamp(frame[key].x * sx, 0, n.W);
        frame[key].y = clamp(frame[key].y * sy, 0, n.H);
      }
    }
  }
  if (type === "blank") {
    // 無地コートは既定でラベル無し。GK/DF/MF/FWの自動ラベルのみクリアし、固有名は残す
    for (const id of activeIds()) {
      const label = (state.players[id].label || "").trim();
      if (POSITION_LABELS.has(label)) state.players[id].label = "";
    }
  }
  for (const a of state.annotations) {
    if (a.type === "circle" || a.type === "tri") {
      a.cx = clamp(a.cx * sx, 0, n.W); a.cy = clamp(a.cy * sy, 0, n.H); a.r = Math.max(1, a.r * sr);
    } else if (a.type === "cone" || a.type === "marker") {
      a.x = clamp(a.x * sx, 0, n.W); a.y = clamp(a.y * sy, 0, n.H);
    } else if (a.type === "rect") {
      a.x = clamp(a.x * sx, 0, n.W); a.y = clamp(a.y * sy, 0, n.H);
      a.w = Math.max(1.5, a.w * sx); a.h = Math.max(1.5, a.h * sy);
    } else if (a.type === "arrow") {
      a.x1 = clamp(a.x1 * sx, 0, n.W); a.y1 = clamp(a.y1 * sy, 0, n.H);
      a.x2 = clamp(a.x2 * sx, 0, n.W); a.y2 = clamp(a.y2 * sy, 0, n.H);
    }
  }
  renderAll();
  scheduleAutosave();
}

function setCourtColor(theme) {
  if (!COURT_THEMES[theme] || theme === state.courtColor) return;
  state.courtColor = theme;
  renderPitch();
  updateToolbarUI();
  scheduleAutosave();
}

/* ---------- 半面コートのゴール向き ---------- */
function setHalfFacing(facing) {
  if (!["left", "right", "up", "down"].includes(facing) || facing === state.halfFacing) return;
  state.halfFacing = facing;
  selectAnno(null);
  renderAll();
  scheduleAutosave();
}

/* ---------- チーム入替（青と赤の場所をまるごと入れ替える） ---------- */
function swapTeams() {
  pushUndo();

  const tmpCount = state.playerCountA;
  state.playerCountA = state.playerCountB;
  state.playerCountB = tmpCount;

  for (let i = 1; i <= 20; i++) {
    const aKey = `p-a${i}`, bKey = `p-b${i}`;
    const aMeta = state.players[aKey], bMeta = state.players[bKey];
    const tmpMeta = { num: aMeta.num, label: aMeta.label };
    aMeta.num = bMeta.num; aMeta.label = bMeta.label;
    bMeta.num = tmpMeta.num; bMeta.label = tmpMeta.label;

    for (const frame of state.frames) {
      const aPos = frame[aKey];
      const bPos = frame[bKey];
      if (bPos !== undefined) frame[aKey] = bPos; else delete frame[aKey];
      if (aPos !== undefined) frame[bKey] = aPos; else delete frame[bKey];
    }
  }

  buildTokens();
  updateTokenPositions(currentFrame());
  drawPaths();
  updateFramesTimeline();
  syncCountsUI();
  updateFormationPanels();
  scheduleAutosave();
}

/* 「ラインを揃える」の対象として認識するポジション名。
   選手の固有名（それ以外の文字列）は対象外にし、貼り替え・整列のどちらでも触らない。 */
const POSITION_LABELS = new Set(["GK", "DF", "MF", "FW"]);

/* X座標でソートし、最も大きい隙間のところで2つのクラスタに分割する。
   4人以下ならそのまま1グループ（1列）として返す。5人以上のときは、既存の
   自ゴール側グループ/前目グループの分かれ方（M型・W型）をそのまま2列として活かす。 */
function splitIntoDepthClusters(ids, frame) {
  const sorted = ids.slice().sort((a, b) => frame[a].x - frame[b].x);
  if (sorted.length <= 4) return [sorted];
  let maxGap = -1, splitAt = 1;
  for (let i = 1; i < sorted.length; i++) {
    const gap = frame[sorted[i]].x - frame[sorted[i - 1]].x;
    if (gap > maxGap) { maxGap = gap; splitAt = i; }
  }
  return [sorted.slice(0, splitAt), sorted.slice(splitAt)];
}

/* ---------- 同じ役割ラベルの選手を整列（一度きりのスナップ、以後は自由に動かせる） ----------
   基準: GK/DF/MF/FW のいずれかのラベルが付いたコート上の選手をチームごとにグループ化する。
   4人以下ならX座標（コートの奥行き方向）の平均値に全員のXを揃えて1列にする。
   5人以上のときは、現在のX座標の一番大きい隙間のところで2つに分け、それぞれの平均Xに揃える
   （3-5-2のMFのような「M型・W型」の分かれ方を保ったまま整列する）。
   Y座標（横方向の広がり）は基本的にそのまま活かすが、近すぎて重なりそうな場合だけ均等に広げ直す。
   控えエリアの選手はこのグループ化から除外し、代わりに控えエリア内で重ならないよう一列に並べ直す。
   選手の固有名（GK/DF/MF/FW以外の文字列）が付いた選手は対象外（動かさない）。 */
function alignByRole() {
  pushUndo();
  const frame = currentFrame();
  const { W, H } = court();
  const minGap = Math.max(4, markerR() * 2.4);
  let aligned = false;

  for (const team of ["a", "b"]) {
    const count = team === "a" ? state.playerCountA : state.playerCountB;
    const groups = {};
    const benchedIds = [];
    for (let i = 1; i <= count; i++) {
      const id = `p-${team}${i}`;
      const label = (state.players[id].label || "").trim();
      const pos = frame[id];
      if (!pos) continue;
      if (pos.y > H) { benchedIds.push(id); continue; } // 控えエリアの選手はコート上の整列に含めない
      if (!POSITION_LABELS.has(label)) continue; // 固有名（ポジション名以外）は対象外
      if (!groups[label]) groups[label] = [];
      groups[label].push(id);
    }

    for (const label of Object.keys(groups)) {
      const ids = groups[label];
      if (ids.length < 2) continue;

      const clusters = splitIntoDepthClusters(ids, frame);
      for (const cluster of clusters) {
        if (cluster.length < 1) continue;
        const avgX = cluster.reduce((sum, id) => sum + frame[id].x, 0) / cluster.length;
        cluster.forEach((id) => { frame[id].x = avgX; });

        // Y方向が近すぎて重なりそうな場合は、現在の中心を保ったまま均等に広げ直す
        if (cluster.length >= 2) {
          const sorted = cluster.slice().sort((idA, idB) => frame[idA].y - frame[idB].y);
          const neededSpan = minGap * (sorted.length - 1);
          const currentSpan = frame[sorted[sorted.length - 1]].y - frame[sorted[0]].y;
          if (currentSpan < neededSpan) {
            const centerY = sorted.reduce((sum, id) => sum + frame[id].y, 0) / sorted.length;
            const startY = clamp(centerY - neededSpan / 2, 0, Math.max(0, H - neededSpan));
            sorted.forEach((id, idx) => { frame[id].y = startY + idx * minGap; });
          }
        }
      }
      aligned = true;
    }

    // 控えエリアの選手は、役割に関係なく控えエリア内で重ならない一列に並べ直す
    if (benchedIds.length >= 2) {
      const sorted = benchedIds.slice().sort((idA, idB) => frame[idA].x - frame[idB].x);
      const neededSpan = minGap * (sorted.length - 1);
      const centerX = sorted.reduce((sum, id) => sum + frame[id].x, 0) / sorted.length;
      const startX = clamp(centerX - neededSpan / 2, 0, Math.max(0, W - neededSpan));
      const benchY = H + BENCH_DEPTH / 2;
      sorted.forEach((id, idx) => { frame[id].x = startX + idx * minGap; frame[id].y = benchY; });
      aligned = true;
    }
  }

  if (!aligned) {
    alert("整列できる選手がいません（GK・DF・MF・FWのラベルが付いた選手が同じチームに2人以上、または控えエリアに2人以上いる場合に整列できます）。");
    undoStack.pop();
    updateUndoUI();
    return;
  }

  updateTokenPositions(frame);
  drawPaths();
  updateFramesTimeline();
  scheduleAutosave();
}

/* ---------- 自作フォーメーション（11人以外の人数用） ---------- */
function readCustomFormations() {
  try {
    const raw = localStorage.getItem(LS_CUSTOM_FORMATIONS);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === "object" ? obj : {};
  } catch (e) {
    return {};
  }
}

function writeCustomFormations(all) {
  try {
    localStorage.setItem(LS_CUSTOM_FORMATIONS, JSON.stringify(all));
  } catch (e) {
    alert("保存に失敗しました（端末の保存容量を確認してください）");
  }
}

/* 現在のチームの配置を「チームA基準・0〜100%」に正規化して取得する */
function captureTeamPositionsAsBasis(team) {
  const { W, H } = court();
  const count = team === "a" ? state.playerCountA : state.playerCountB;
  const frame = currentFrame();
  const positions = {};
  for (let i = 1; i <= count; i++) {
    const id = `p-${team}${i}`;
    const p = frame[id];
    if (!p) continue;
    let xPct = (p.x / W) * 100;
    if (team === "a") xPct = 100 - xPct;
    positions[i] = { x: clamp(xPct, 0, 100), y: clamp((p.y / H) * 100, 0, 100), role: state.players[id].label || "" };
  }
  return positions;
}

function saveCustomFormation(team) {
  const count = team === "a" ? state.playerCountA : state.playerCountB;
  if (count < 1) return;
  const inputEl = $(`custom-formation-name-${team}`);
  const name = inputEl.value.trim();
  if (!name) {
    alert("配置の名前を入力してください（例: 3-2、ロンド用など）");
    return;
  }
  const all = readCustomFormations();
  const list = all[count] || (all[count] = []);
  list.push({ id: newAnnoId(), name, positions: captureTeamPositionsAsBasis(team), savedAt: Date.now() });
  writeCustomFormations(all);
  inputEl.value = "";
  renderCustomFormationList(team);
}

function applyCustomFormationTo(team, count, entry) {
  stopPlayback();
  cancelAnim();
  pushUndo();
  const { W, H } = court();
  const frame = currentFrame();
  for (let i = 1; i <= count; i++) {
    const id = `p-${team}${i}`;
    const b = entry.positions[i];
    if (!b) continue;
    const xm = (b.x / 100) * W;
    frame[id] = { x: team === "b" ? xm : W - xm, y: (b.y / 100) * H };
    state.players[id].label = b.role || "";
  }
  buildTokens();
  animateToFrame(state.currentFrameIndex, 350, () => {
    drawPaths();
    updateFramesTimeline();
  });
  scheduleAutosave();
}

function deleteCustomFormation(team, count, id) {
  const all = readCustomFormations();
  if (!all[count]) return;
  if (!confirm("この配置を削除しますか？")) return;
  all[count] = all[count].filter((e) => e.id !== id);
  writeCustomFormations(all);
  renderCustomFormationList(team);
}

function renderCustomFormationList(team) {
  const count = team === "a" ? state.playerCountA : state.playerCountB;
  const listEl = $(`custom-formation-list-${team}`);
  if (!listEl) return;
  listEl.innerHTML = "";
  const all = readCustomFormations();
  const entries = (all[count] || []).slice().sort((x, y) => (y.savedAt || 0) - (x.savedAt || 0));
  if (entries.length === 0) {
    const p = document.createElement("div");
    p.className = "saves-empty";
    p.textContent = `${count}人用の保存済み配置はまだありません`;
    listEl.appendChild(p);
    return;
  }
  for (const entry of entries) {
    const row = document.createElement("div");
    row.className = "save-row-item";

    const info = document.createElement("div");
    info.className = "save-info";
    const nm = document.createElement("div");
    nm.className = "save-name";
    nm.textContent = entry.name;
    info.appendChild(nm);

    const btnApply = document.createElement("button");
    btnApply.textContent = "適用";
    btnApply.addEventListener("click", () => applyCustomFormationTo(team, count, entry));

    const btnDel = document.createElement("button");
    btnDel.textContent = "✕";
    btnDel.className = "danger";
    btnDel.addEventListener("click", () => deleteCustomFormation(team, count, entry.id));

    row.appendChild(info);
    row.appendChild(btnApply);
    row.appendChild(btnDel);
    listEl.appendChild(row);
  }
}

/* 人数に応じてプリセット/自作フォーメーションのパネル表示を切り替える */
function updateFormationPanels() {
  for (const team of ["a", "b"]) {
    const count = team === "a" ? state.playerCountA : state.playerCountB;
    const section = $(`formation-section-${team}`);
    if (!section) continue;
    section.hidden = count === 0;
    if (count === 0) continue;
    const showPresets = count >= 11; // 11人以上ならプリセット（12人目以降は控えへ）
    $(`formation-presets-${team}`).hidden = !showPresets;
    $(`formation-custom-${team}`).hidden = showPresets;
    if (!showPresets) renderCustomFormationList(team);
  }
}

/* ---------- ツール ---------- */
function setTool(tool) {
  state.tool = tool;
  if (tool !== "select") selectAnno(null);
  updateToolbarUI();
}

/* ツールバーのドロップダウングループ定義 */
const DD_GROUPS = {
  shapes: ["circle", "rect", "tri", "cone", "marker"],
  arrows: ["arrow-pass", "arrow-run", "line"],
};
const COURT_NAMES = { full: "フル", half: "半面", blank: "無地" };

function updateToolbarUI() {
  document.querySelectorAll("[data-tool]").forEach((b) => {
    b.classList.toggle("active", b.dataset.tool === state.tool);
  });
  document.querySelectorAll(".dd-toggle").forEach((btn) => {
    const tools = DD_GROUPS[btn.dataset.dd] || [];
    btn.classList.toggle("active", tools.includes(state.tool));
  });
  // コートのドロップダウンは現在のコート名を表示する
  const courtToggle = $("dd-court-toggle");
  if (courtToggle) courtToggle.firstChild.nodeValue = COURT_NAMES[state.courtType] || "コート";
  document.querySelectorAll("[data-court]").forEach((b) => {
    b.classList.toggle("active", b.dataset.court === state.courtType);
  });
  document.querySelectorAll("[data-theme]").forEach((b) => {
    b.classList.toggle("active", b.dataset.theme === state.courtColor);
  });
  $("btn-orientation").classList.toggle("active", state.portrait);

  // 半面コートのときだけ4方向のゴール向きボタンを表示する
  const isHalf = state.courtType === "half";
  $("btn-orientation").hidden = isHalf;
  $("half-facing-group").hidden = !isHalf;
  document.querySelectorAll("[data-facing]").forEach((b) => {
    b.classList.toggle("active", b.dataset.facing === state.halfFacing);
  });
}

/* ---------- ポインター操作 ---------- */
let drag = null;

function onPointerDown(e) {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  if (drag) return; // 2本目の指は無視

  stopPlayback();
  cancelAnim();

  const pt = clientToLogical(e.clientX, e.clientY);
  const target = e.target;

  // 図形作成ツール
  if (state.tool !== "select") {
    beginCreate(pt);
    if (drag) {
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    }
    return;
  }

  const handleG = target.closest ? target.closest(".handle") : null;
  const annoG = target.closest ? target.closest("[data-anno]") : null;

  // トークンはDOMの重なり順ではなく距離で判定する
  // （ボールが選手に重なっていても選手を優先してつかめるように）
  const hitToken = pickToken(pt);

  if (handleG) {
    const role = handleG.dataset.role;
    if (role === "delete") {
      if (state.selectedAnno) deleteAnno(state.selectedAnno);
      return;
    }
    if (role === "duplicate") {
      if (state.selectedAnno) duplicateAnno(state.selectedAnno);
      return;
    }
    beginHandleDrag(role, pt);
  } else if (hitToken) {
    beginTokenDrag(hitToken, pt, e);
  } else if (annoG) {
    selectAnno(annoG.dataset.anno);
    beginAnnoDrag(pt);
  } else {
    selectAnno(null);
    return;
  }

  if (drag) {
    try { svg.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  }
}

/* ポインター位置にあるトークンを返す（選手優先、次にボール） */
function pickToken(pt) {
  const frame = currentFrame();
  const ppm = pxPerMeter();
  const hitPad = Math.max(0.8, 8 / ppm);
  const playerHit = markerR() + hitPad;
  const ballHit = ballR() + hitPad;

  let best = null;
  let bestDist = Infinity;
  for (const id of activeIds()) {
    const p = frame[id];
    if (!p) continue;
    const d = dist(p, pt);
    if (d <= playerHit && d < bestDist) {
      best = id;
      bestDist = d;
    }
  }
  if (best) return best;
  if (frame["ball"] && dist(frame["ball"], pt) <= ballHit) return "ball";
  return null;
}

function beginTokenDrag(id, pt, e) {
  const frame = currentFrame();
  const p = frame[id];
  if (!p) return;
  drag = {
    mode: "token", id,
    startClientX: e.clientX, startClientY: e.clientY,
    startTime: performance.now(),
    grabDX: p.x - pt.x, grabDY: p.y - pt.y,
    moved: false, undoPushed: false,
    ballAttach: false, ballDX: 0, ballDY: 0,
  };
  // 選手がボールの近くにいればボールも一緒に動かす
  if (id !== "ball" && frame["ball"] && dist(p, frame["ball"]) < 3.5) {
    drag.ballAttach = true;
    drag.ballDX = frame["ball"].x - p.x;
    drag.ballDY = frame["ball"].y - p.y;
  }
}

function beginAnnoDrag(pt) {
  const a = getAnno(state.selectedAnno);
  if (!a) return;
  drag = { mode: "anno", start: pt, orig: deep(a), moved: false, undoPushed: false };
}

function beginHandleDrag(role, pt) {
  const a = getAnno(state.selectedAnno);
  if (!a) return;
  drag = { mode: "handle", role, start: pt, orig: deep(a), moved: false, undoPushed: false };
}

function beginCreate(pt) {
  const { W, H } = court();
  const start = { x: clamp(pt.x, 0, W), y: clamp(pt.y, 0, H) };
  pushUndo();
  let anno;
  if (state.tool === "circle") {
    anno = { id: newAnnoId(), type: "circle", cx: start.x, cy: start.y, r: 0.4 };
  } else if (state.tool === "rect") {
    anno = { id: newAnnoId(), type: "rect", x: start.x, y: start.y, w: 0.5, h: 0.5 };
  } else if (state.tool === "tri") {
    anno = { id: newAnnoId(), type: "tri", cx: start.x, cy: start.y, r: 0.4 };
  } else if (state.tool === "cone") {
    anno = { id: newAnnoId(), type: "cone", x: start.x, y: start.y };
  } else if (state.tool === "marker") {
    anno = { id: newAnnoId(), type: "marker", x: start.x, y: start.y };
  } else {
    let style = "pass";
    if (state.tool === "arrow-run") style = "run";
    else if (state.tool === "line") style = "line";
    anno = {
      id: newAnnoId(), type: "arrow",
      style,
      x1: start.x, y1: start.y, x2: start.x, y2: start.y,
    };
  }
  state.annotations.push(anno);
  drag = { mode: "create", id: anno.id, start, moved: false };
  renderAnnotations();
}

function onPointerMove(e) {
  if (!drag) return;
  const pt = clientToLogical(e.clientX, e.clientY);
  const { W, H } = court();

  if (drag.mode === "token") {
    const movedPx = Math.hypot(e.clientX - drag.startClientX, e.clientY - drag.startClientY);
    if (!drag.moved && movedPx < 5) return;
    if (!drag.moved) {
      drag.moved = true;
      if (!drag.undoPushed) { pushUndo(); drag.undoPushed = true; }
    }
    const frame = currentFrame();
    const p = frame[drag.id];
    if (!p) return;
    const maxY = (drag.id !== "ball" && benchActive()) ? H + BENCH_DEPTH - benchDragMargin() : H;
    p.x = clamp(pt.x + drag.grabDX, 0, W);
    p.y = clamp(pt.y + drag.grabDY, 0, maxY);
    if (drag.ballAttach && frame["ball"]) {
      frame["ball"].x = clamp(p.x + drag.ballDX, 0, W);
      frame["ball"].y = clamp(p.y + drag.ballDY, 0, H);
    }
    updateTokenPositions(frame);
    drawPaths();
  } else if (drag.mode === "anno") {
    const a = getAnno(state.selectedAnno);
    if (!a) return;
    if (!drag.moved) {
      drag.moved = true;
      if (!drag.undoPushed) { pushUndo(); drag.undoPushed = true; }
    }
    const dx = pt.x - drag.start.x;
    const dy = pt.y - drag.start.y;
    const o = drag.orig;
    if (a.type === "circle" || a.type === "tri") {
      a.cx = clamp(o.cx + dx, 0, W); a.cy = clamp(o.cy + dy, 0, H);
    } else if (a.type === "cone" || a.type === "marker") {
      a.x = clamp(o.x + dx, 0, W); a.y = clamp(o.y + dy, 0, H);
    } else if (a.type === "rect") {
      a.x = clamp(o.x + dx, -a.w / 2, W - a.w / 2);
      a.y = clamp(o.y + dy, -a.h / 2, H - a.h / 2);
    } else if (a.type === "arrow") {
      const cdx = clamp(dx, -Math.min(o.x1, o.x2), W - Math.max(o.x1, o.x2));
      const cdy = clamp(dy, -Math.min(o.y1, o.y2), H - Math.max(o.y1, o.y2));
      a.x1 = o.x1 + cdx; a.y1 = o.y1 + cdy;
      a.x2 = o.x2 + cdx; a.y2 = o.y2 + cdy;
    }
    renderAnnotations();
    renderHandles();
  } else if (drag.mode === "handle") {
    const a = getAnno(state.selectedAnno);
    if (!a) return;
    if (!drag.moved) {
      drag.moved = true;
      if (!drag.undoPushed) { pushUndo(); drag.undoPushed = true; }
    }
    if ((a.type === "circle" || a.type === "tri") && drag.role === "resize") {
      a.r = clamp(dist({ x: a.cx, y: a.cy }, pt), 1, Math.max(W, H));
    } else if (a.type === "rect" && drag.role === "resize") {
      // 回転中の四角形は、ポインタ座標を画面上の実回転（縦表示の逆回転込み）の前に戻してから幅・高さを計算する
      const c = { x: drag.orig.x + drag.orig.w / 2, y: drag.orig.y + drag.orig.h / 2 };
      const eff = (a.rot || 0) + annoCounterRot();
      const p = eff ? rotatePt(pt.x, pt.y, c.x, c.y, -eff) : pt;
      a.w = clamp(p.x - a.x, 1.5, W);
      a.h = clamp(p.y - a.y, 1.5, H);
    } else if (drag.role === "rotate" && (a.type === "rect" || a.type === "tri")) {
      const c = annoCenter(a);
      const ang = (Math.atan2(pt.y - c.y, pt.x - c.x) * 180) / Math.PI;
      if (drag.rotStartAngle === undefined) {
        drag.rotStartAngle = ang;
        drag.rotBase = drag.orig.rot || 0;
      }
      let rot = Math.round(drag.rotBase + (ang - drag.rotStartAngle));
      rot = ((rot % 360) + 360) % 360;
      const snapped = Math.round(rot / 45) * 45; // 45度の倍数付近では吸着させる
      if (Math.abs(snapped - rot) <= 4) rot = snapped % 360;
      a.rot = rot;
    } else if (a.type === "arrow") {
      const px = clamp(pt.x, 0, W), py = clamp(pt.y, 0, H);
      if (drag.role === "p1") { a.x1 = px; a.y1 = py; }
      else { a.x2 = px; a.y2 = py; }
    }
    renderAnnotations();
    renderHandles();
  } else if (drag.mode === "create") {
    const a = getAnno(drag.id);
    if (!a) return;
    drag.moved = true;
    const px = clamp(pt.x, 0, W), py = clamp(pt.y, 0, H);
    if (a.type === "circle" || a.type === "tri") {
      a.r = clamp(dist({ x: a.cx, y: a.cy }, { x: px, y: py }), 0.4, Math.max(W, H));
    } else if (a.type === "cone" || a.type === "marker") {
      a.x = px; a.y = py; // 置き場所をドラッグで微調整できる
    } else if (a.type === "rect") {
      a.x = Math.min(drag.start.x, px);
      a.y = Math.min(drag.start.y, py);
      a.w = Math.max(0.5, Math.abs(px - drag.start.x));
      a.h = Math.max(0.5, Math.abs(py - drag.start.y));
    } else if (a.type === "arrow") {
      a.x2 = px; a.y2 = py;
    }
    renderAnnotations();
  }
  if (e.cancelable) e.preventDefault();
}

function onPointerUp(e) {
  if (!drag) return;
  const d = drag;
  drag = null;

  if (d.mode === "token") {
    if (!d.moved && d.id !== "ball" && performance.now() - d.startTime < 500) {
      openLabelEditor(d.id);
      return;
    }
    if (d.moved) {
      updateFramesTimeline();
      scheduleAutosave();
    }
  } else if (d.mode === "anno" || d.mode === "handle") {
    if (d.moved) scheduleAutosave();
  } else if (d.mode === "create") {
    const a = getAnno(d.id);
    if (a) {
      const { W, H } = court();
      // タップだけ（ドラッグなし）の場合はデフォルトサイズで置く
      if (a.type === "circle" && a.r < 1.5) {
        a.r = 5.5;
      } else if (a.type === "tri" && a.r < 1.5) {
        a.r = 6;
      } else if (a.type === "rect" && (a.w < 1.5 || a.h < 1.5)) {
        a.w = 12; a.h = 9;
        a.x = clamp(d.start.x - 6, 0, W - 12);
        a.y = clamp(d.start.y - 4.5, 0, H - 9);
      } else if (a.type === "arrow" && dist({ x: a.x1, y: a.y1 }, { x: a.x2, y: a.y2 }) < 2) {
        if (effectiveOrientation().portrait) { a.x2 = a.x1; a.y2 = clamp(a.y1 - 9, 0, H); }
        else { a.x2 = clamp(a.x1 + 9, 0, W); a.y2 = a.y1; }
      }
      state.tool = "select";
      updateToolbarUI();
      selectAnno(a.id);
      updateFramesTimeline();
      scheduleAutosave();
    }
  }
}

/* ---------- 選手ラベル編集 ---------- */
let editingPlayerId = null;

function openLabelEditor(id) {
  editingPlayerId = id;
  const meta = state.players[id];
  $("edit-title").textContent = `選手の編集（${meta.team === "a" ? "青" : "赤"}チーム）`;
  $("edit-num").value = meta.num;
  $("edit-label").value = meta.label;
  $("editor-backdrop").hidden = false;
  $("edit-label").focus();
}

function closeLabelEditor() {
  $("editor-backdrop").hidden = true;
  editingPlayerId = null;
}

function saveLabelEditor() {
  if (!editingPlayerId) return;
  pushUndo();
  const meta = state.players[editingPlayerId];
  meta.num = $("edit-num").value.trim().slice(0, 3) || meta.num;
  meta.label = $("edit-label").value.trim().slice(0, 10);
  buildTokens();
  updateTokenPositions(currentFrame());
  closeLabelEditor();
  scheduleAutosave();
}

/* ---------- 全体再描画 ---------- */
function renderAll() {
  applyViewBox();
  renderPitch();
  renderAnnotations();
  renderHandles();
  buildTokens();
  updateTokenPositions(currentFrame());
  drawPaths();
  updateFramesTimeline();
  syncCountsUI();
  updateFormationPanels();
  updateActiveSaveUI();
  updateToolbarUI();
  updatePlayBtn();
  $("speed-slider").value = state.speed;
  $("speed-val").textContent = `${state.speed.toFixed(1)}s / コマ`;
  updateToggleBtn($("btn-toggle-paths"), state.showPaths, "🏹 動きの矢印");
  updateToggleBtn($("btn-loop-playback"), state.loopPlayback, "🔁 ループ再生");
}

function updateToggleBtn(btn, on, label) {
  btn.textContent = `${label}: ${on ? "ON" : "OFF"}`;
  btn.classList.toggle("toggled-on", on);
}

/* ---------- イベント設定 ---------- */
function setupEventListeners() {
  svg.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  // ツールバー
  document.querySelectorAll("[data-tool]").forEach((b) => {
    b.addEventListener("click", () => setTool(b.dataset.tool));
  });

  // ツールのドロップダウン（図形・コーン/マーカー）。トグルで開閉し、外側タップで閉じる
  const closeAllDD = () => document.querySelectorAll(".dd-menu").forEach((m) => { m.hidden = true; });
  document.querySelectorAll(".dd-toggle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const menu = document.querySelector(`[data-dd-menu="${btn.dataset.dd}"]`);
      const willOpen = menu.hidden;
      closeAllDD();
      menu.hidden = !willOpen;
    });
  });
  document.querySelectorAll(".dd-menu button").forEach((b) => {
    b.addEventListener("click", closeAllDD); // ツール/コート選択自体は各共通リスナーが行う
  });
  document.addEventListener("pointerdown", (e) => {
    if (!e.target.closest || !e.target.closest(".tool-dd")) closeAllDD();
  });

  // 配布用URLのコピー
  $("btn-copy-url").addEventListener("click", async () => {
    const btn = $("btn-copy-url");
    let ok = false;
    try {
      await navigator.clipboard.writeText(APP_URL);
      ok = true;
    } catch (e) {
      // 古いブラウザ・非https向けのフォールバック（readonlyのままだと選択できない端末があるため一時解除）
      const inp = $("app-url");
      inp.removeAttribute("readonly");
      inp.select();
      inp.setSelectionRange(0, inp.value.length);
      try { ok = document.execCommand("copy"); } catch (e2) {}
      inp.setAttribute("readonly", "");
      const sel = window.getSelection();
      if (sel) sel.removeAllRanges();
    }
    btn.textContent = ok ? "コピーしました" : "コピー失敗";
    setTimeout(() => { btn.textContent = "コピー"; }, 1600);
  });
  document.querySelectorAll("[data-court]").forEach((b) => {
    b.addEventListener("click", () => setCourtType(b.dataset.court));
  });
  document.querySelectorAll("[data-theme]").forEach((b) => {
    b.addEventListener("click", () => setCourtColor(b.dataset.theme));
  });
  document.querySelectorAll("[data-facing]").forEach((b) => {
    b.addEventListener("click", () => setHalfFacing(b.dataset.facing));
  });
  $("btn-orientation").addEventListener("click", () => {
    state.portrait = !state.portrait;
    state.orientationManual = true;
    selectAnno(null);
    renderAll();
  });
  $("btn-undo").addEventListener("click", undo);
  $("btn-clear-annos").addEventListener("click", clearAnnotations);

  // 再生コントロール
  $("btn-play").addEventListener("click", () => {
    if (state.isPlaying) stopPlayback();
    else startPlayback();
  });
  $("btn-prev").addEventListener("click", () => {
    stopPlayback(); cancelAnim();
    if (state.currentFrameIndex > 0) {
      animateToFrame(state.currentFrameIndex - 1, 300, () => drawPaths());
    }
  });
  $("btn-next").addEventListener("click", () => {
    stopPlayback(); cancelAnim();
    if (state.currentFrameIndex < state.frames.length - 1) {
      animateToFrame(state.currentFrameIndex + 1, 300, () => drawPaths());
    }
  });

  // コマごとのメモ
  $("frame-note").addEventListener("input", () => {
    const f = currentFrame();
    if (!f) return;
    const val = $("frame-note").value;
    if (val) f.note = val; else delete f.note;
    updateCurrentThumbNoteDot();
    scheduleAutosave();
  });

  // コマの追加・削除
  $("btn-add-frame").addEventListener("click", () => {
    stopPlayback(); cancelAnim();
    pushUndo();
    const newFrame = deep(currentFrame());
    delete newFrame.note; // メモはコマごとに内容が異なるため引き継がない
    state.frames.splice(state.currentFrameIndex + 1, 0, newFrame);
    state.currentFrameIndex++;
    drawPaths();
    updateFramesTimeline();
    scheduleAutosave();
  });
  $("btn-delete-frame").addEventListener("click", () => {
    stopPlayback(); cancelAnim();
    if (state.frames.length <= 1) {
      alert("これ以上コマを削除できません。");
      return;
    }
    pushUndo();
    state.frames.splice(state.currentFrameIndex, 1);
    if (state.currentFrameIndex >= state.frames.length) {
      state.currentFrameIndex = state.frames.length - 1;
    }
    updateTokenPositions(currentFrame());
    drawPaths();
    updateFramesTimeline();
    scheduleAutosave();
  });
  $("btn-clear-frames").addEventListener("click", () => {
    stopPlayback(); cancelAnim();
    if (!confirm("全コマをクリアして初期配置に戻しますか？（図形は残ります）")) return;
    pushUndo();
    if (state.courtType === "half") {
      state.playerCountB = 0;
      state.frames = [createHalfDefaultFrame()];
    } else {
      state.frames = [createDefaultFrame(state.courtType !== "blank")];
    }
    state.currentFrameIndex = 0;
    buildTokens();
    updateTokenPositions(currentFrame());
    drawPaths();
    updateFramesTimeline();
    syncCountsUI();
    updateFormationPanels();
    scheduleAutosave();
  });

  // 再生速度
  $("speed-slider").addEventListener("input", (e) => {
    state.speed = parseFloat(e.target.value);
    $("speed-val").textContent = `${state.speed.toFixed(1)}s / コマ`;
    scheduleAutosave();
  });

  // オプション
  $("btn-toggle-paths").addEventListener("click", () => {
    state.showPaths = !state.showPaths;
    updateToggleBtn($("btn-toggle-paths"), state.showPaths, "🏹 動きの矢印");
    drawPaths();
    scheduleAutosave();
  });
  $("btn-loop-playback").addEventListener("click", () => {
    state.loopPlayback = !state.loopPlayback;
    updateToggleBtn($("btn-loop-playback"), state.loopPlayback, "🔁 ループ再生");
    scheduleAutosave();
  });

  // フォーメーション
  document.querySelectorAll(".btn-formation-a").forEach((btn) => {
    btn.addEventListener("click", () => applyFormation("a", btn.dataset.formation));
  });
  document.querySelectorAll(".btn-formation-b").forEach((btn) => {
    btn.addEventListener("click", () => applyFormation("b", btn.dataset.formation));
  });

  // 人数（両チーム同時はアンドゥ1回分にまとめる）
  $("btn-both-inc").addEventListener("click", () => {
    if (state.playerCountA >= 20 && state.playerCountB >= 20) return;
    pushUndo();
    if (state.playerCountA === state.playerCountB) {
      setPlayerCount("a", state.playerCountA + 1, true);
      setPlayerCount("b", state.playerCountB + 1, true);
    } else if (state.playerCountA < state.playerCountB) {
      // 人数が違うときは、まず少ない方だけ増やして揃える
      setPlayerCount("a", state.playerCountA + 1, true);
    } else {
      setPlayerCount("b", state.playerCountB + 1, true);
    }
  });
  $("btn-both-dec").addEventListener("click", () => {
    if (state.playerCountA <= 1 && state.playerCountB <= 0) return;
    pushUndo();
    setPlayerCount("a", state.playerCountA - 1, true);
    setPlayerCount("b", state.playerCountB - 1, true);
  });
  $("btn-a-inc").addEventListener("click", () => setPlayerCount("a", state.playerCountA + 1));
  $("btn-a-dec").addEventListener("click", () => setPlayerCount("a", state.playerCountA - 1));
  $("btn-b-inc").addEventListener("click", () => setPlayerCount("b", state.playerCountB + 1));
  $("btn-b-dec").addEventListener("click", () => setPlayerCount("b", state.playerCountB - 1));

  // 自作フォーメーションの保存
  $("btn-save-formation-a").addEventListener("click", () => saveCustomFormation("a"));
  $("btn-save-formation-b").addEventListener("click", () => saveCustomFormation("b"));

  // チーム入替・ライン整列
  $("btn-swap-teams").addEventListener("click", swapTeams);
  $("btn-align-roles").addEventListener("click", alignByRole);

  // 保存
  $("btn-save").addEventListener("click", saveCurrentAs);
  $("btn-export").addEventListener("click", exportToFile);
  $("btn-import").addEventListener("click", () => $("import-file").click());
  $("import-file").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (f) importFromFile(f);
    e.target.value = "";
  });

  // ラベル編集ダイアログ
  $("edit-save").addEventListener("click", saveLabelEditor);
  $("edit-cancel").addEventListener("click", closeLabelEditor);
  $("editor-backdrop").addEventListener("pointerdown", (e) => {
    if (e.target === $("editor-backdrop")) closeLabelEditor();
  });
  $("label-editor").addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveLabelEditor();
    else if (e.key === "Escape") closeLabelEditor();
  });

  // キーボードショートカット（入力欄にフォーカス中・ダイアログ表示中は無効）
  window.addEventListener("keydown", (e) => {
    const tag = document.activeElement && document.activeElement.tagName;
    const typing = tag === "INPUT" || tag === "TEXTAREA";
    if (typing || !$("editor-backdrop").hidden) return;

    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      $("btn-undo").click();
      return;
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      if (state.selectedAnno) {
        e.preventDefault();
        deleteAnno(state.selectedAnno);
      }
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      $("btn-prev").click();
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      $("btn-next").click();
      return;
    }
    if (e.code === "Space") {
      e.preventDefault();
      $("btn-play").click();
      return;
    }
    if (e.key === "Escape") {
      if (state.selectedAnno) selectAnno(null);
      else if (state.tool !== "select") setTool("select");
    }
  });

  // リサイズ（縦横の自動追従）。スマホのスクロールによるURLバーの出入りは
  // 高さしか変えないため無視し、幅が変わったとき（回転や実際のリサイズ）だけ再レイアウトする
  let resizeTimer = null;
  let lastViewportW = window.innerWidth;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth === lastViewportW) return;
      lastViewportW = window.innerWidth;
      stableViewportH = window.innerHeight;
      if (!state.orientationManual) {
        state.portrait = window.innerHeight > window.innerWidth;
      }
      renderAll();
    }, 150);
  });
}

/* ---------- 起動 ---------- */
function init() {
  ensurePlayers();

  // 自動保存からの復元（失敗したら初期状態）
  let restored = false;
  try {
    const raw = localStorage.getItem(LS_AUTOSAVE);
    if (raw) {
      const doc = JSON.parse(raw);
      if (doc && Array.isArray(doc.frames)) {
        setupEventListeners();
        loadDoc(doc);
        restored = true;
      }
    }
  } catch (e) { /* 壊れた保存データは無視 */ }

  if (!restored) {
    state.frames = [createDefaultFrame(true)];
    setupEventListeners();
    renderAll();
  }

  renderSavesList();
  updateUndoUI();

  // PC では全パネルを開き、スマホではコマ一覧だけ開く（設定パネルは常に閉じたまま）
  const wide = window.innerWidth > 900;
  document.querySelectorAll("details.panel").forEach((d) => {
    d.open = (wide && d.id !== "panel-settings") || d.id === "panel-frames";
  });

  $("app-version").textContent = APP_VERSION;
  $("app-url").value = APP_URL;

  // PWA（https で開いた場合のみ。テスト版ではキャッシュ混在を避けるため登録しない）
  if ("serviceWorker" in navigator && location.protocol.startsWith("http") && document.body.dataset.env !== "test") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

init();
