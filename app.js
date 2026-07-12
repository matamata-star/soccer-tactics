"use strict";

/* =========================================================
   サッカー戦術ボード
   - 座標系: コートをメートル単位 (0..W, 0..H) の「横向き論理座標」で扱う
   - スマホ縦表示は SVG グループの回転のみで実現（データは常に横向き座標）
   - 図形（サークル/スクエア/矢印）は全コマ共通の注釈レイヤー
   ========================================================= */

/* ---------- コート定義 ---------- */
const COURTS = {
  full:  { W: 105,  H: 68 },
  half:  { W: 52.5, H: 68 },
  blank: { W: 105,  H: 68 },
};
const PAD = 3; // ゴールのはみ出し分の余白（m）

const LS_AUTOSAVE = "soccerTactics.autosave.v1";
const LS_SAVES = "soccerTactics.saves.v1";

/* ---------- フォーメーション定義（フルコート基準の%座標） ---------- */
const formations = {
  "4-4-2": {
    1:  { x: 5,  y: 50, role: "GK" },
    2:  { x: 22, y: 18, role: "DF" },
    3:  { x: 20, y: 38, role: "DF" },
    4:  { x: 20, y: 62, role: "DF" },
    5:  { x: 22, y: 82, role: "DF" },
    6:  { x: 36, y: 30, role: "MF" },
    7:  { x: 36, y: 50, role: "MF" },
    8:  { x: 36, y: 70, role: "MF" },
    9:  { x: 44, y: 15, role: "MF" },
    10: { x: 44, y: 35, role: "FW" },
    11: { x: 44, y: 65, role: "FW" },
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
    1:  { x: 5,  y: 50, role: "GK" },
    2:  { x: 20, y: 28, role: "DF" },
    3:  { x: 18, y: 50, role: "DF" },
    4:  { x: 20, y: 72, role: "DF" },
    5:  { x: 32, y: 12, role: "MF" },
    6:  { x: 36, y: 30, role: "MF" },
    7:  { x: 36, y: 50, role: "MF" },
    8:  { x: 36, y: 70, role: "MF" },
    9:  { x: 32, y: 88, role: "MF" },
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
  portrait: window.innerHeight > window.innerWidth,
  orientationManual: false, // ユーザーが手動で縦横を切り替えたら自動追従をやめる
  tool: "select",           // select | circle | rect | arrow-pass | arrow-run
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
};

let undoStack = [];
const UNDO_MAX = 60;

/* ---------- DOM 参照 ---------- */
const $ = (id) => document.getElementById(id);
const svg = $("board");
const scene = $("scene");
const layers = {
  pitch:   $("layer-pitch"),
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

/* ---------- ビューボックス / 向き ---------- */
function applyViewBox() {
  const { W, H } = court();
  let vw, vh;
  if (state.portrait) {
    vw = H + PAD * 2; vh = W + PAD * 2;
    svg.setAttribute("viewBox", `${-PAD} ${-PAD} ${vw} ${vh}`);
    scene.setAttribute("transform", `translate(${H} 0) rotate(90)`);
  } else {
    vw = W + PAD * 2; vh = H + PAD * 2;
    svg.setAttribute("viewBox", `${-PAD} ${-PAD} ${vw} ${vh}`);
    scene.removeAttribute("transform");
  }
  svg.style.aspectRatio = `${vw} / ${vh}`;

  // 高さ制限に収まるよう幅も明示的に絞る（レターボックスの余白をなくす）
  svg.style.width = "100%";
  const availW = svg.getBoundingClientRect().width;
  const maxH = window.innerWidth <= 900
    ? window.innerHeight * 0.66
    : window.innerHeight - 240;
  const w = Math.min(availW, Math.max(200, maxH) * (vw / vh));
  if (w < availW) svg.style.width = `${Math.round(w)}px`;
}

/* ---------- ピッチ描画 ---------- */
function renderPitch() {
  const { W, H } = court();
  const L = layers.pitch;
  L.innerHTML = "";

  // 余白ごと芝生色で塗る
  el("rect", { x: -PAD, y: -PAD, width: W + PAD * 2, height: H + PAD * 2, fill: "#123420" }, L);

  // 芝生ストライプ
  const stripes = state.courtType === "half" ? 6 : 10;
  for (let i = 0; i < stripes; i++) {
    el("rect", {
      x: (i * W) / stripes, y: 0, width: W / stripes, height: H,
      fill: i % 2 ? "#1b4d2a" : "#14381d",
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
    el("rect", { x: a.x, y: a.y, width: a.w, height: a.h, rx: 0.5, fill: "rgba(255,213,74,0.10)", stroke: color, "stroke-width": sw }, g);
  } else if (a.type === "arrow") {
    const dash = a.style === "run" ? "1.6 1.2" : null;
    const markerId = a.style === "run" ? "ah-run" : "ah-pass";
    el("line", {
      x1: a.x1, y1: a.y1, x2: a.x2, y2: a.y2,
      stroke: color, "stroke-width": sw, "stroke-dasharray": dash,
      "marker-end": `url(#${markerId})`,
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
  if (a.type === "rect") return { minX: a.x, minY: a.y, maxX: a.x + a.w, maxY: a.y + a.h };
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

  // 選択中の点線アウトライン
  if (a.type === "circle") {
    el("circle", { cx: a.cx, cy: a.cy, r: a.r + 0.9, fill: "none", stroke: "rgba(255,255,255,0.7)", "stroke-width": 0.18, "stroke-dasharray": "1 1", "pointer-events": "none" }, L);
  } else if (a.type === "rect") {
    el("rect", { x: a.x - 0.9, y: a.y - 0.9, width: a.w + 1.8, height: a.h + 1.8, fill: "none", stroke: "rgba(255,255,255,0.7)", "stroke-width": 0.18, "stroke-dasharray": "1 1", "pointer-events": "none" }, L);
  }

  const mkHandle = (x, y, role) => {
    const g = el("g", { class: "handle", "data-role": role, transform: `translate(${x} ${y})` }, L);
    el("circle", { r: hr * 1.4, fill: "transparent" }, g); // 当たり判定
    el("circle", { r: hr, fill: "#ffffff", stroke: "#1f2937", "stroke-width": 0.18 }, g);
    return g;
  };

  if (a.type === "circle") {
    mkHandle(a.cx + a.r, a.cy, "resize");
  } else if (a.type === "rect") {
    mkHandle(a.x + a.w, a.y + a.h, "resize");
  } else if (a.type === "arrow") {
    mkHandle(a.x1, a.y1, "p1");
    mkHandle(a.x2, a.y2, "p2");
  }

  // 削除ボタン
  const bb = annoBBox(a);
  const bx = clamp(bb.maxX + 2.2, 2, W - 2);
  const by = clamp(bb.minY - 2.2, 2, H - 2);
  const del = el("g", { class: "handle handle-delete", "data-role": "delete", transform: `translate(${bx} ${by})` }, L);
  el("circle", { r: hr * 1.5, fill: "transparent" }, del);
  el("circle", { r: hr * 1.1, fill: "#ef4444", stroke: "#fff", "stroke-width": 0.16 }, del);
  const c = hr * 0.5;
  el("line", { x1: -c, y1: -c, x2: c, y2: c, stroke: "#fff", "stroke-width": Math.max(0.22, hr * 0.18), "stroke-linecap": "round" }, del);
  el("line", { x1: -c, y1: c, x2: c, y2: -c, stroke: "#fff", "stroke-width": Math.max(0.22, hr * 0.18), "stroke-linecap": "round" }, del);
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
    for (let i = 1; i <= 11; i++) {
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

function pentagonPath(r) {
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const a = (-90 + i * 72) * Math.PI / 180;
    pts.push(`${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`);
  }
  return `M ${pts.join(" L ")} Z`;
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
  const counterRot = state.portrait ? "rotate(-90)" : null;

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
  el("path", { d: pentagonPath(rb * 0.45), fill: "#222", "pointer-events": "none" }, inner);
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

/* ---------- 軌跡 ---------- */
function drawPaths() {
  layers.paths.innerHTML = "";
  if (!state.showPaths || state.frames.length < 2) return;

  const ids = [...activeIds(), "ball"];
  for (const id of ids) {
    const pts = state.frames.map((f) => f[id]).filter(Boolean);
    if (pts.length < 2) continue;
    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;

    const attrs = { d, fill: "none", "stroke-linecap": "round", "pointer-events": "none" };
    if (id === "ball") {
      Object.assign(attrs, { stroke: "rgba(255,255,255,0.65)", "stroke-width": 0.28, "stroke-dasharray": "0.9 0.9" });
    } else if (id.startsWith("p-a")) {
      Object.assign(attrs, { stroke: "rgba(0,210,255,0.45)", "stroke-width": 0.3, "stroke-dasharray": "1.1 1.1" });
    } else {
      Object.assign(attrs, { stroke: "rgba(255,65,108,0.45)", "stroke-width": 0.3, "stroke-dasharray": "1.1 1.1" });
    }
    el("path", attrs, layers.paths);
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
    basePositions = simpleFormations[useCount];
  }
  const positions = {};
  for (let i = 0; i < useCount; i++) {
    const key = `p-${team}${i + 1}`;
    const b = basePositions[i];
    const xm = (b.x / 100) * W;
    const ym = (b.y / 100) * H;
    positions[key] = {
      x: team === "a" ? xm : W - xm,
      y: ym,
      role: b.role,
    };
  }
  return positions;
}

function spawnPos(team, i) {
  const { W, H } = court();
  const x = team === "a" ? W * 0.28 : W * 0.72;
  const y = clamp(H / 2 + (i - 6) * 4, 2, H - 2);
  return { x, y };
}

function createDefaultFrame(applyLabels) {
  const { W, H } = court();
  const frame = {};
  for (const team of ["a", "b"]) {
    const count = team === "a" ? state.playerCountA : state.playerCountB;
    const pos = getFormationPositions(team, "4-4-2", count);
    for (const key of Object.keys(pos)) {
      frame[key] = { x: pos[key].x, y: pos[key].y };
      if (applyLabels) state.players[key].label = pos[key].role || "";
    }
  }
  frame["ball"] = { x: W / 2, y: H / 2 };
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
  const positions = getFormationPositions(team, formationName);
  for (const key of Object.keys(positions)) {
    frame[key] = { x: positions[key].x, y: positions[key].y };
    state.players[key].label = positions[key].role || "";
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
}

function buildThumbSvg(frame) {
  const { W, H } = court();
  const s = document.createElementNS(SVGNS, "svg");
  s.setAttribute("viewBox", `0 0 ${W} ${H}`);
  el("rect", { x: 0, y: 0, width: W, height: H, fill: "#17402a" }, s);
  // 図形をうっすら
  for (const a of state.annotations) {
    if (a.type === "circle") {
      el("circle", { cx: a.cx, cy: a.cy, r: a.r, fill: "none", stroke: "rgba(255,213,74,0.5)", "stroke-width": 0.8 }, s);
    } else if (a.type === "rect") {
      el("rect", { x: a.x, y: a.y, width: a.w, height: a.h, fill: "none", stroke: "rgba(255,213,74,0.5)", "stroke-width": 0.8 }, s);
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
  return deep({
    v: 1,
    courtType: state.courtType,
    playerCountA: state.playerCountA,
    playerCountB: state.playerCountB,
    players: state.players,
    frames: state.frames,
    annotations: state.annotations,
    speed: state.speed,
    showPaths: state.showPaths,
    loopPlayback: state.loopPlayback,
    currentFrameIndex: state.currentFrameIndex,
  });
}

function loadDoc(doc) {
  stopPlayback();
  animCounter++;
  activeAnim = null;

  state.courtType = COURTS[doc.courtType] ? doc.courtType : "full";
  state.playerCountA = clamp(parseInt(doc.playerCountA, 10) || 8, 1, 11);
  state.playerCountB = clamp(parseInt(doc.playerCountB, 10) || 8, 1, 11);

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
  state.frames.forEach(ensureFrameCompleteness);
  state.currentFrameIndex = clamp(parseInt(doc.currentFrameIndex, 10) || 0, 0, state.frames.length - 1);

  state.annotations = Array.isArray(doc.annotations)
    ? doc.annotations.filter((a) => a && ["circle", "rect", "arrow"].includes(a.type))
    : [];
  state.selectedAnno = null;

  state.speed = clamp(parseFloat(doc.speed) || 1.0, 0.2, 3.0);
  state.showPaths = doc.showPaths !== false;
  state.loopPlayback = doc.loopPlayback === true;

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
      $("save-name").value = name;
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
      renderSavesList();
    });

    row.appendChild(info);
    row.appendChild(btnLoad);
    row.appendChild(btnDel);
    list.appendChild(row);
  }
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
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const doc = JSON.parse(reader.result);
      if (!doc || !Array.isArray(doc.frames)) throw new Error("invalid");
      pushUndo();
      loadDoc(doc);
      scheduleAutosave();
    } catch (e) {
      alert("ファイルを読み込めませんでした（このアプリで書き出したJSONを選んでください）");
    }
  };
  reader.readAsText(file);
}

/* ---------- 人数変更 ---------- */
function setPlayerCount(team, count, skipUndo) {
  const newCount = clamp(count, 1, 11);
  const old = team === "a" ? state.playerCountA : state.playerCountB;
  if (newCount === old) return;
  if (!skipUndo) pushUndo();
  if (team === "a") state.playerCountA = newCount;
  else state.playerCountB = newCount;

  // 増えた選手の座標を「全コマ」に補完する
  state.frames.forEach(ensureFrameCompleteness);

  buildTokens();
  updateTokenPositions(currentFrame());
  drawPaths();
  updateFramesTimeline();
  syncCountsUI();
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
  state.courtType = type;
  const n = court();
  const sx = n.W / o.W, sy = n.H / o.H, sr = Math.min(sx, sy);

  // 既存の座標を新しいコートサイズへスケーリング
  for (const frame of state.frames) {
    for (const key of Object.keys(frame)) {
      frame[key].x = clamp(frame[key].x * sx, 0, n.W);
      frame[key].y = clamp(frame[key].y * sy, 0, n.H);
    }
  }
  for (const a of state.annotations) {
    if (a.type === "circle") {
      a.cx = clamp(a.cx * sx, 0, n.W); a.cy = clamp(a.cy * sy, 0, n.H); a.r = Math.max(1, a.r * sr);
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

/* ---------- ツール ---------- */
function setTool(tool) {
  state.tool = tool;
  if (tool !== "select") selectAnno(null);
  updateToolbarUI();
}

function updateToolbarUI() {
  document.querySelectorAll("[data-tool]").forEach((b) => {
    b.classList.toggle("active", b.dataset.tool === state.tool);
  });
  document.querySelectorAll("[data-court]").forEach((b) => {
    b.classList.toggle("active", b.dataset.court === state.courtType);
  });
  $("btn-orientation").classList.toggle("active", state.portrait);
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
  } else {
    anno = {
      id: newAnnoId(), type: "arrow",
      style: state.tool === "arrow-run" ? "run" : "pass",
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
    p.x = clamp(pt.x + drag.grabDX, 0, W);
    p.y = clamp(pt.y + drag.grabDY, 0, H);
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
    if (a.type === "circle") {
      a.cx = clamp(o.cx + dx, 0, W); a.cy = clamp(o.cy + dy, 0, H);
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
    if (a.type === "circle" && drag.role === "resize") {
      a.r = clamp(dist({ x: a.cx, y: a.cy }, pt), 1, Math.max(W, H));
    } else if (a.type === "rect" && drag.role === "resize") {
      a.w = clamp(pt.x - a.x, 1.5, W);
      a.h = clamp(pt.y - a.y, 1.5, H);
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
    if (a.type === "circle") {
      a.r = clamp(dist({ x: a.cx, y: a.cy }, { x: px, y: py }), 0.4, Math.max(W, H));
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
      } else if (a.type === "rect" && (a.w < 1.5 || a.h < 1.5)) {
        a.w = 12; a.h = 9;
        a.x = clamp(d.start.x - 6, 0, W - 12);
        a.y = clamp(d.start.y - 4.5, 0, H - 9);
      } else if (a.type === "arrow" && dist({ x: a.x1, y: a.y1 }, { x: a.x2, y: a.y2 }) < 2) {
        if (state.portrait) { a.x2 = a.x1; a.y2 = clamp(a.y1 - 9, 0, H); }
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
  updateToolbarUI();
  updatePlayBtn();
  $("speed-slider").value = state.speed;
  $("speed-val").textContent = `${state.speed.toFixed(1)}s / コマ`;
  updateToggleBtn($("btn-toggle-paths"), state.showPaths, "🎯 軌跡の表示");
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
  document.querySelectorAll("[data-court]").forEach((b) => {
    b.addEventListener("click", () => setCourtType(b.dataset.court));
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

  // コマの追加・削除
  $("btn-add-frame").addEventListener("click", () => {
    stopPlayback(); cancelAnim();
    pushUndo();
    const newFrame = deep(currentFrame());
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
    state.frames = [createDefaultFrame(true)];
    state.currentFrameIndex = 0;
    buildTokens();
    updateTokenPositions(currentFrame());
    drawPaths();
    updateFramesTimeline();
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
    updateToggleBtn($("btn-toggle-paths"), state.showPaths, "🎯 軌跡の表示");
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
    if (state.playerCountA >= 11 && state.playerCountB >= 11) return;
    pushUndo();
    setPlayerCount("a", state.playerCountA + 1, true);
    setPlayerCount("b", state.playerCountB + 1, true);
  });
  $("btn-both-dec").addEventListener("click", () => {
    if (state.playerCountA <= 1 && state.playerCountB <= 1) return;
    pushUndo();
    setPlayerCount("a", state.playerCountA - 1, true);
    setPlayerCount("b", state.playerCountB - 1, true);
  });
  $("btn-a-inc").addEventListener("click", () => setPlayerCount("a", state.playerCountA + 1));
  $("btn-a-dec").addEventListener("click", () => setPlayerCount("a", state.playerCountA - 1));
  $("btn-b-inc").addEventListener("click", () => setPlayerCount("b", state.playerCountB + 1));
  $("btn-b-dec").addEventListener("click", () => setPlayerCount("b", state.playerCountB - 1));

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
  $("edit-label").addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveLabelEditor();
  });

  // リサイズ（縦横の自動追従）
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
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

  // PC では全パネルを開き、スマホではコマ一覧だけ開く
  const wide = window.innerWidth > 900;
  document.querySelectorAll("details.panel").forEach((d) => {
    d.open = wide || d.id === "panel-frames";
  });

  // PWA（https で開いた場合のみ）
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

init();
