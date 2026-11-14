/* =========================================================
   実績・DCR（旧ハコログ）
   データは S.data.dcr に入り、ログインしていればクラウドに同期されます。
   DCR（未配達率）＝ 未完了 ÷ 配達予定数 × 100
   ・C1のDCR：C1だけ　・C2のDCR：C1＋C2合算（＝その日のDCR）
   ・週：日曜C1〜土曜C2の合計。月・年も件数を合算してから計算
   ========================================================= */
"use strict";
const DCRM = (() => {
  const REASONS = [
    { k: "cu", label: "CU", desc: "置き配不可・受取人不在", color: "#e24a4a" },
    { k: "uta", label: "UTA", desc: "アクセス不可", color: "#2c6fe0" },
    { k: "nsl", label: "NSL", desc: "安全な置き場所なし", color: "#f08c00" },
    { k: "bc", label: "BC", desc: "営業時間外", color: "#8e5bd6" },
    { k: "other", label: "その他", desc: "上記に当てはまらない未完了", color: "#8a8a8a" }
  ];
  const C1 = "#2c6fe0", C2 = "#f08c00", PURPLE = "#7c4ddb";
  const DOW = ["日", "月", "火", "水", "木", "金", "土"];

  /* ---------- 日付（すべてローカル日付の "YYYY-MM-DD"） ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseD = (s) => { const m = /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/.exec(String(s || "").trim()); if (!m) return null; const d = new Date(+m[1], +m[2] - 1, +m[3]); return d.getMonth() === +m[2] - 1 ? d : null; };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const today = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
  const daysBetween = (a, b) => { const out = []; for (let d = a; d <= b; d = addDays(d, 1)) out.push(ymd(d)); return out; };
  const monthDates = (m) => daysBetween(new Date(m.getFullYear(), m.getMonth(), 1), new Date(m.getFullYear(), m.getMonth() + 1, 0));
  const weekStartOf = (d) => addDays(d, -d.getDay()); // 日曜はじまり
  const jpDate = (s) => { const d = parseD(s); return `${d.getMonth() + 1}/${d.getDate()}(${DOW[d.getDay()]})`; };
  const weekLabel = (ws) => { const d = parseD(ws), e = addDays(d, 6); return `${d.getMonth() + 1}/${d.getDate()}〜${e.getMonth() + 1}/${e.getDate()}`; };
  const monthChoices = (ws) => { const d = parseD(ws), a = ymd(d).slice(0, 7), b = ymd(addDays(d, 6)).slice(0, 7); return a === b ? [a] : [a, b]; };

  /* ---------- データ ---------- */
  const defaults = () => ({ records: {}, scorecards: {}, settings: { decimals: 2, goodLimit: 1.0, warnLimit: 2.0 } });
  function migrate(d) {
    const base = defaults();
    d.dcr = d.dcr && typeof d.dcr === "object" ? d.dcr : base;
    d.dcr.records ||= {}; d.dcr.scorecards ||= {};
    d.dcr.settings = { ...base.settings, ...(d.dcr.settings || {}) };
  }
  const D = () => S.data.dcr;
  const key = (date, c) => date + "|" + c;
  const rec = (date, c) => D().records[key(date, c)] || null;
  const inc = (r) => r.cu + r.uta + r.nsl + r.bc + r.other;
  const rate = (a, b) => (b > 0 ? (a / b) * 100 : null);
  const cyc = (r) => { if (!r) return null; const i = inc(r); return { ...r, inc: i, comp: r.planned - i, dcr: rate(i, r.planned) }; };
  function day(date) {
    const a = rec(date, 1), b = rec(date, 2), rs = [a, b].filter(Boolean);
    const planned = rs.reduce((s, r) => s + r.planned, 0), i = rs.reduce((s, r) => s + inc(r), 0);
    const reasons = {}; REASONS.forEach((x) => (reasons[x.k] = rs.reduce((s, r) => s + r[x.k], 0)));
    const c1 = cyc(a), c2 = cyc(b);
    return { date, c1, c2, entered: rs.length > 0, planned, inc: i, comp: planned - i, reasons, dcr: rate(i, planned),
      c1dcr: c1 && c1.planned > 0 ? c1.dcr : null, c2dcr: c2 && c2.planned > 0 ? rate(i, planned) : null, working: planned > 0 };
  }
  function period(dates) {
    const days = dates.map(day), work = days.filter((d) => d.working);
    const planned = work.reduce((s, d) => s + d.planned, 0), comp = work.reduce((s, d) => s + d.comp, 0), i = work.reduce((s, d) => s + d.inc, 0);
    const reasons = {}; REASONS.forEach((x) => (reasons[x.k] = work.reduce((s, d) => s + d.reasons[x.k], 0)));
    const c1 = days.map((d) => d.c1).filter((c) => c && c.planned > 0), c2 = days.map((d) => d.c2).filter((c) => c && c.planned > 0);
    const c1p = c1.reduce((s, c) => s + c.planned, 0), c1i = c1.reduce((s, c) => s + c.inc, 0), c2p = c2.reduce((s, c) => s + c.planned, 0), c2i = c2.reduce((s, c) => s + c.inc, 0);
    let top = null; REASONS.forEach((x) => { if (reasons[x.k] > 0 && (!top || reasons[x.k] > reasons[top.k])) top = x; });
    return { days, work, planned, comp, inc: i, reasons, workdays: work.length, dcr: rate(i, planned), c1dcr: rate(c1i, c1p), c2only: rate(c2i, c2p), top };
  }
  function level(v) {
    if (v == null) return { k: "off", c: "var(--line)", label: "記録なし" };
    const s = D().settings;
    if (v <= s.goodLimit + 1e-9) return { k: "good", c: "var(--g)", label: "良好" };
    if (v <= s.warnLimit + 1e-9) return { k: "warn", c: "var(--or)", label: "注意" };
    return { k: "bad", c: "var(--r)", label: "要改善" };
  }
  const pct = (v) => (v == null ? "—" : v.toFixed(D().settings.decimals) + "%");
  const short = (v) => (v == null ? "—" : v.toFixed(Math.min(1, D().settings.decimals)));
  const n = (v) => Number(v).toLocaleString("ja-JP");

  /* ---------- 週間スコアカード（10進の整数演算・途中で丸めない） ---------- */
  const RULE_START = "2026-09-06";
  const SF = [
    { k: "mentor", label: "Mentorスコア", unit: "点", rule: "800未満で −10点", ph: "例 848", int: false },
    { k: "dnr", label: "DNR問い合わせ", unit: "件", rule: "1件 −25点（回収できた場合も1件）", ph: "0", int: true, mul: "-25" },
    { k: "returnRate", label: "持ち戻り率", unit: "％", rule: "入力値 × −50点（0.48 → 0.48％）", ph: "例 0.48", int: false, mul: "-50" },
    { k: "late", label: "遅刻・早退", unit: "回", rule: "1回 −15点", ph: "0", int: true, mul: "-15" },
    { k: "accident", label: "欠車・事故", unit: "件", rule: "1件 −100点", ph: "0", int: true, mul: "-100" },
    { k: "workDays", label: "稼働日数", unit: "日", rule: "1日 ＋2.5点（対象月の数字）", ph: "0", int: true, mul: "2.5" },
    { k: "requestedOff", label: "希望休数", unit: "日", rule: "1日 −2.5点（対象月の数字）", ph: "0", int: true, mul: "-2.5" },
    { k: "follow", label: "フォロー", unit: "回", rule: "1回 ＋10点", ph: "0", int: true, mul: "10" },
    { k: "morningAbsent", label: "朝礼欠席", unit: "回", rule: "1回 −10点", ph: "0", int: true, mul: "-10" }
  ];
  const decParse = (str) => { const neg = str.startsWith("-"); const t = neg ? str.slice(1) : str; const [a, b = ""] = t.split("."); const v = BigInt((a || "0") + b); return { n: neg ? -v : v, s: b.length }; };
  const decMul = (x, y) => ({ n: x.n * y.n, s: x.s + y.s });
  const decAdd = (x, y) => { const s = Math.max(x.s, y.s); return { n: x.n * 10n ** BigInt(s - x.s) + y.n * 10n ** BigInt(s - y.s), s }; };
  const decCmp = (x, y) => { const d = decAdd(x, { n: -y.n, s: y.s }); return d.n < 0n ? -1 : d.n > 0n ? 1 : 0; };
  const decText = (x) => { const neg = x.n < 0n; let t = (neg ? -x.n : x.n).toString(); if (x.s > 0) { t = t.padStart(x.s + 1, "0"); t = t.slice(0, t.length - x.s) + "." + t.slice(t.length - x.s); t = t.replace(/\.?0+$/, ""); } return (neg && t !== "0" ? "−" : "") + t; };
  const decSigned = (x) => (x.n > 0n ? "＋" + decText(x) : x.n < 0n ? decText(x) : "±0");
  const decNum = (x) => Number(x.n) / 10 ** x.s;
  function scParse(raw, isInt) {
    if (raw == null) return { st: "empty" };
    let t = String(raw).trim(); if (!t) return { st: "empty" };
    t = t.replace(/[０-９．]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[,，%％\s]/g, "");
    if (!(isInt ? /^\d+$/ : /^(\d+\.?\d*|\.\d+)$/).test(t)) return { st: "invalid" };
    if (t.startsWith(".")) t = "0" + t; if (t.endsWith(".")) t = t.slice(0, -1);
    return { st: "value", v: decParse(t) };
  }
  function scCalc(card) {
    let total = { n: 100n, s: 0 }; const linesOut = [], missing = [], invalid = [];
    SF.forEach((f) => {
      const p = scParse(card[f.k], f.int); let pts = { n: 0n, s: 0 };
      if (p.st === "empty") missing.push(f);
      else if (p.st === "invalid") invalid.push(f);
      else pts = f.k === "mentor" ? (decCmp(p.v, { n: 800n, s: 0 }) < 0 ? { n: -10n, s: 0 } : { n: 0n, s: 0 }) : decMul(p.v, decParse(f.mul));
      total = decAdd(total, pts); linesOut.push({ f, p, pts });
    });
    return { total, lines: linesOut, missing, invalid, complete: !missing.length && !invalid.length };
  }
  const cardEmpty = (c) => SF.every((f) => !c[f.k] || !String(c[f.k]).trim());
  function cleanCard(c) {
    const ws = ymd(parseD(c.weekStart));
    const o = { weekStart: ws, targetMonth: /^\d{4}-\d{2}$/.test(c.targetMonth) ? c.targetMonth : monthChoices(ws).slice(-1)[0] };
    SF.forEach((f) => { if (c[f.k] != null && String(c[f.k]).trim() !== "") o[f.k] = String(c[f.k]); });
    return o;
  }

  /* ---------- 読み込み（ハコログのバックアップ・CSV） ---------- */
  function validate(x) {
    const d = parseD(x.date); if (!d) return "日付が読めません";
    const c = parseInt(String(x.cycle).replace(/^C/i, ""), 10); if (c !== 1 && c !== 2) return "サイクルはC1かC2です";
    const r = { date: ymd(d), cycle: c };
    for (const f of ["planned", "cu", "uta", "nsl", "bc", "other"]) {
      const raw = x[f]; const v = raw === undefined || raw === null || raw === "" ? 0 : Number(raw);
      if (!Number.isInteger(v) || v < 0) return f + "が0以上の整数ではありません"; r[f] = v;
    }
    if (inc(r) > r.planned) return "未完了の合計が配達予定数を超えています";
    return r;
  }
  function parseImport(text) {
    const t = text.trim().replace(/^﻿/, "");
    if (t.startsWith("{")) {
      const j = JSON.parse(t);
      if (!Array.isArray(j.records)) throw new Error("ハコログのバックアップ（JSON）ではありません");
      const records = [], errors = [];
      j.records.forEach((x, i) => { const r = validate(x); typeof r === "string" ? errors.push(`${i + 1}件目：${r}`) : records.push(r); });
      const cards = (Array.isArray(j.scorecards) ? j.scorecards : []).filter((c) => c && parseD(c.weekStart)).map(cleanCard);
      return { records, cards, errors, settings: j.settings };
    }
    const ls = t.split(/\r?\n/).filter((l) => l.trim());
    if (!ls.length || !/日付/.test(ls[0])) throw new Error("ハコログのCSVではありません（1行目に「日付」が必要です）");
    const records = [], errors = [];
    ls.slice(1).forEach((l, i) => {
      const c = l.split(",").map((x) => x.trim());
      const r = validate({ date: c[0], cycle: c[1], planned: c[2], cu: c[3], uta: c[4], nsl: c[5], bc: c[6], other: c[7] });
      typeof r === "string" ? errors.push(`${i + 2}行目：${r}`) : records.push(r);
    });
    return { records, cards: [], errors };
  }
  const csvText = () => "﻿" + ["日付,サイクル,配達予定数,CU,UTA,NSL,BC,その他未完了",
    ...Object.values(D().records).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.cycle - b.cycle)).map((r) => [r.date, "C" + r.cycle, r.planned, r.cu, r.uta, r.nsl, r.bc, r.other].join(","))].join("\r\n");
  const backupText = () => JSON.stringify({ app: "Hakolog", format: 1, exportedAt: new Date().toISOString(), settings: { ...D().settings },
    scorecards: Object.values(D().scorecards).sort((a, b) => (a.weekStart < b.weekStart ? -1 : 1)),
    records: Object.values(D().records).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.cycle - b.cycle)) }, null, 2);

  /* ---------- 画面の状態 ---------- */
  const UI = { month: null, range: "30d", aMonth: null, aYear: null, histMonth: "all" };
  function ui() {
    const t = today();
    if (!UI.month) UI.month = new Date(t.getFullYear(), t.getMonth(), 1);
    if (!UI.aMonth) UI.aMonth = new Date(t.getFullYear(), t.getMonth(), 1);
    if (UI.aYear == null) UI.aYear = t.getFullYear();
    return UI;
  }
  const SUBS = [["calendar", "📅", "カレンダー"], ["score", "🏅", "スコア"], ["analysis", "📈", "分析"], ["history", "🗂️", "履歴"], ["config", "⚙️", "設定"]];
  const subbar = (cur) => `<div class="subbar" role="tablist">${SUBS.map(([k, ic, t]) => `<button role="tab" aria-selected="${cur === k}" class="${cur === k ? "on" : ""}" data-act="seg" data-k="dcr" data-v="${k}">${ic} ${t}</button>`).join("")}</div>`;

  function view() {
    const sub = S.seg.dcr || "calendar";
    const body = sub === "score" ? viewScore() : sub === "analysis" ? viewAnalysis() : sub === "history" ? viewHistory() : sub === "config" ? viewConfig() : viewCalendar();
    return subbar(sub) + body;
  }

  const legend = () => { const s = D().settings; return `<div class="legend"><span>C1＝C1だけ／C2＝C1＋C2合算</span><span><i style="background:var(--g)"></i>良好 ${s.goodLimit.toFixed(1)}%以下</span><span><i style="background:var(--or)"></i>注意 ${s.warnLimit.toFixed(1)}%以下</span><span><i style="background:var(--r)"></i>要改善 ${s.warnLimit.toFixed(1)}%超</span></div>`; };

  function scoreChip(ws) {
    const c = D().scorecards[ws];
    if (!c) return `<button class="chip sm" data-act="modal" data-type="dcrScore" data-id="${ws}">＋ スコア入力</button>`;
    const r = scCalc(c);
    return `<button class="chip sm on" data-act="modal" data-type="dcrScore" data-id="${ws}">スコア <b>${decText(r.total)}点</b>${r.complete ? "" : " ⚠︎"}</button>`;
  }

  function viewCalendar() {
    const u = ui(), m = u.month, dates = monthDates(m);
    const first = new Date(m.getFullYear(), m.getMonth(), 1), last = new Date(m.getFullYear(), m.getMonth() + 1, 0);
    const start = weekStartOf(first), end = addDays(weekStartOf(last), 6), p = period(dates), L = level(p.dcr), t = ymd(today());
    let h = `<div class="monthnav"><button class="iconbtn" data-act="dcrMonth" data-v="-1" aria-label="前の月">‹</button><b>${m.getFullYear()}年${m.getMonth() + 1}月</b><button class="iconbtn" data-act="dcrMonth" data-v="1" aria-label="次の月">›</button><button class="btn sm" data-act="dcrMonth" data-v="0">今月</button></div>`;
    h += `<section class="card dcr-hero" style="--lv:${L.c}"><div><span class="muted small">${m.getMonth() + 1}月のDCR（未配達率）</span><div class="dcr-big">${pct(p.dcr)}</div><span class="lvpill">${p.workdays ? L.label : "記録なし"}</span></div>
      <div class="minis"><div class="mini"><span>配達予定</span><b>${n(p.planned)}</b></div><div class="mini"><span>完了</span><b>${n(p.comp)}</b></div><div class="mini"><span>未完了</span><b class="r">${n(p.inc)}</b></div><div class="mini"><span>C1のDCR</span><b>${pct(p.c1dcr)}</b></div><div class="mini"><span>稼働日数</span><b>${p.workdays}日</b></div><div class="mini"><span>多い理由</span><b>${p.top ? p.top.label + " " + p.reasons[p.top.k] + "件" : "なし"}</b></div></div></section>`;
    h += legend();
    h += `<section class="card dcal-card"><div class="dcal">${DOW.map((w, i) => `<div class="dow ${i === 0 ? "sun" : i === 6 ? "sat" : ""}">${w}</div>`).join("")}`;
    for (let w = start; w <= end; w = addDays(w, 7)) {
      const wd = daysBetween(w, addDays(w, 6));
      wd.forEach((s) => {
        const d = parseD(s), a = day(s), out = d.getMonth() !== m.getMonth(), lv = level(a.working ? a.dcr : null);
        h += `<button class="dday ${a.working ? "has" : ""} ${out ? "out" : ""} ${s === t ? "today" : ""}" style="--lv:${lv.c}" data-act="modal" data-type="dcrDay" data-id="${s}" aria-label="${jpDate(s)} ${a.working ? "C1 " + pct(a.c1dcr) + "、C2（合算）" + pct(a.c2dcr) + "、" + lv.label : "未入力"}">
          <span class="dn ${d.getDay() === 0 ? "sun" : d.getDay() === 6 ? "sat" : ""}">${d.getDate()}</span>${a.working ? `<span class="cv" style="--cc:${C1}">C1 ${short(a.c1dcr)}</span><span class="cv" style="--cc:${C2}">C2 ${short(a.c2dcr)}</span><span class="dq">予${a.planned}<b class="r"> 未${a.inc}</b></span>` : a.entered ? `<span class="dq">0件</span>` : ""}</button>`;
      });
      const wp = period(wd), wl = level(wp.dcr);
      h += `<div class="dweek">${scoreChip(ymd(w))}${wp.workdays ? `<span class="wchip" style="--lv:${wl.c}">週DCR <b>${pct(wp.dcr)}</b></span><span class="wchip">未完了 <b>${wp.inc}</b>/${wp.planned}</span><span class="wchip">稼働 <b>${wp.workdays}</b>日</span>` : `<span class="muted small">この週の記録なし</span>`}</div>`;
    }
    h += `</div></section>`;
    if (!Object.keys(D().records).length) h += card("はじめに", "👋", `<p>カレンダーの日付をタップして、C1・C2の配達予定数と未完了の件数（CU・UTA・NSL・BC・その他）を入れると、DCR（未配達率）が自動で計算されます。</p><p class="muted small">ハコログのアプリやウェブ版で記録していた人は、「設定」からバックアップファイルを読み込めます。</p>`);
    return h;
  }

  function rangeDates() {
    const u = ui(), t = today();
    if (u.range === "7d") return daysBetween(addDays(t, -6), t);
    if (u.range === "30d") return daysBetween(addDays(t, -29), t);
    if (u.range === "month") return monthDates(u.aMonth);
    return daysBetween(new Date(u.aYear, 0, 1), new Date(u.aYear, 11, 31));
  }
  function lineOf(labels, values, color, name) {
    const s = D().settings;
    const pts = values.map((v, i) => (v == null ? null : { x: i, y: v, tip: `${labels[i]} ${v.toFixed(2)}%` })).filter(Boolean);
    const step = Math.max(1, Math.ceil(labels.length / 6));
    return Chart.line({ series: [{ name, color, points: pts }], xMin: 0, xMax: Math.max(1, labels.length - 1), yMin: 0,
      xTicks: labels.map((l, i) => ({ v: i, label: l })).filter((x, i) => i % step === 0 && x.label),
      rules: [{ y: s.goodLimit, label: "良好", color: "var(--g)" }, { y: s.warnLimit, label: "注意", color: "var(--or)" }] });
  }
  function viewAnalysis() {
    const u = ui(), dates = rangeDates(), p = period(dates), L = level(p.dcr), yr = u.range === "year";
    let nav = "";
    if (u.range === "month") nav = `<div class="monthnav"><button class="iconbtn" data-act="dcrA" data-v="-1">‹</button><b>${u.aMonth.getFullYear()}年${u.aMonth.getMonth() + 1}月</b><button class="iconbtn" data-act="dcrA" data-v="1">›</button></div>`;
    if (yr) nav = `<div class="monthnav"><button class="iconbtn" data-act="dcrA" data-v="-1">‹</button><b>${u.aYear}年</b><button class="iconbtn" data-act="dcrA" data-v="1">›</button></div>`;
    let h = `<div class="seg">${[["7d", "7日"], ["30d", "30日"], ["month", "月別"], ["year", "年間"]].map(([k, l]) => `<button class="${u.range === k ? "on" : ""}" data-act="dcrRange" data-v="${k}">${l}</button>`).join("")}</div>${nav}`;
    h += card("", "", `<div class="minis"><div class="mini"><span>配達予定</span><b>${n(p.planned)}件</b></div><div class="mini"><span>完了</span><b class="g">${n(p.comp)}件</b></div><div class="mini"><span>未完了</span><b class="r">${n(p.inc)}件</b></div><div class="mini"><span>DCR${p.workdays ? "・" + L.label : ""}</span><b style="color:${L.c}">${pct(p.dcr)}</b></div><div class="mini"><span>C1のDCR</span><b>${pct(p.c1dcr)}</b></div><div class="mini"><span>稼働日数</span><b>${p.workdays}日</b></div></div>
      <p class="muted small">DCR＝未完了÷配達予定数。C1はC1だけ、C2はC1とC2を合算して計算します。週は日曜C1〜土曜C2、月・年も件数を合算してから計算します。</p>`);
    if (!p.workdays) return h + card("", "", `<p class="muted">この期間の記録はまだありません。</p>`);
    const dl = dates.map((s) => { const d = parseD(s); return yr ? (d.getDate() === 1 ? `${d.getMonth() + 1}月` : "") : `${d.getMonth() + 1}/${d.getDate()}`; });
    const weeks = []; dates.forEach((s) => { const w = ymd(weekStartOf(parseD(s))); let g = weeks.find((x) => x.k === w); if (!g) weeks.push((g = { k: w, d: [] })); g.d.push(s); });
    const months = []; dates.forEach((s) => { const k = s.slice(0, 7); let g = months.find((x) => x.k === k); if (!g) months.push((g = { k, d: [] })); g.d.push(s); });
    h += card("日別DCR（C1＋C2合算）", "📉", lineOf(dl, p.days.map((d) => (d.working ? d.dcr : null)), PURPLE, "DCR"));
    h += card("日別DCR（C1だけ）", "📉", lineOf(dl, p.days.map((d) => (d.working ? d.c1dcr : null)), C1, "C1"));
    h += card("週別DCR（日曜C1〜土曜C2）", "🗓️", lineOf(weeks.map((w) => { const d = parseD(w.k); return `${d.getMonth() + 1}/${d.getDate()}`; }), weeks.map((w) => period(w.d).dcr), PURPLE, "週DCR"));
    if (months.length > 1) h += card("月別DCR", "🗓️", lineOf(months.map((m) => +m.k.slice(5) + "月"), months.map((m) => period(m.d).dcr), PURPLE, "月DCR"));
    const total = p.inc || 1;
    h += card("未完了の理由", "🧾", p.inc ? REASONS.map((r) => `<div class="hbar"><span>${r.label}<small class="muted"> ${r.desc}</small></span><b>${p.reasons[r.k]}件</b><i style="--w:${(p.reasons[r.k] / total) * 100}%;--c:${r.color}"></i></div>`).join("") : `<p class="muted">この期間に未完了はありません。</p>`);
    h += card("C1・C2別のDCR", "🔀", `<div class="minis"><div class="mini"><span>C1だけ</span><b style="color:${C1}">${pct(p.c1dcr)}</b></div><div class="mini"><span>C2だけ</span><b style="color:${C2}">${pct(p.c2only)}</b></div><div class="mini"><span>C1＋C2</span><b style="color:${PURPLE}">${pct(p.dcr)}</b></div></div>`);
    return h;
  }

  function viewScore() {
    const t = today(), tw = ymd(weekStartOf(t)), lw = ymd(addDays(weekStartOf(t), -7));
    const list = Object.values(D().scorecards).sort((a, b) => (a.weekStart < b.weekStart ? -1 : 1)).map((c) => ({ c, r: scCalc(c) }));
    const cur = D().scorecards[tw] ? scCalc(D().scorecards[tw]) : null;
    let h = `<section class="card score-hero"><div class="ct"><span>📅 今週 ${weekLabel(tw)}</span>${cur ? `<span class="pill">${cur.complete ? "入力完了" : "未入力あり"}</span>` : ""}</div>
      <div class="dcr-big">${cur ? decText(cur.total) : "—"}<small> 点</small></div>
      <div class="row2"><button class="btn primary" data-act="modal" data-type="dcrScore" data-id="${tw}">${cur ? "今週のスコアを編集" : "今週のスコアを入力"}</button><button class="btn" data-act="modal" data-type="dcrScore" data-id="${lw}">先週 ${weekLabel(lw)}</button></div></section>`;
    if (!list.length) return h + card("まだスコアカードがありません", "🏅", `<p class="muted">Mentorスコア・DNR・持ち戻り率などを入れると、基本点100点に加点・減点して自動で計算します。カレンダーの週の行の「スコア入力」からも入れられます。</p>`);
    let total = { n: 0n, s: 0 }; list.forEach((x) => (total = decAdd(total, x.r.total)));
    const av = decNum(total) / list.length;
    const mx = list.reduce((a, b) => (decCmp(b.r.total, a.r.total) > 0 ? b : a)), mn = list.reduce((a, b) => (decCmp(b.r.total, a.r.total) < 0 ? b : a));
    const over = list.filter((x) => decCmp(x.r.total, { n: 100n, s: 0 }) >= 0).length;
    h += card("", "", `<div class="minis"><div class="mini"><span>平均点</span><b>${(Math.round(av * 100) / 100).toString().replace("-", "−")}点</b></div><div class="mini"><span>最高点</span><b class="g">${decText(mx.r.total)}点</b></div><div class="mini"><span>最低点</span><b class="${decCmp(mn.r.total, { n: 100n, s: 0 }) < 0 ? "r" : ""}">${decText(mn.r.total)}点</b></div><div class="mini"><span>100点以上</span><b>${over}/${list.length}週</b></div></div>`);
    const recent = list.slice(-26);
    h += card("スコアの推移", "📈", Chart.line({ series: [{ name: "週間スコア", color: C1, points: recent.map((x, i) => ({ x: i, y: decNum(x.r.total), tip: `${weekLabel(x.c.weekStart)} ${decText(x.r.total)}点` })) }],
      xMin: 0, xMax: Math.max(1, recent.length - 1), yMin: Math.min(0, ...recent.map((x) => decNum(x.r.total))), rules: [{ y: 100, label: "基本点100", color: "#888" }],
      xTicks: recent.map((x, i) => ({ v: i, label: weekLabel(x.c.weekStart).split("〜")[0] })).filter((_, i) => i % Math.max(1, Math.ceil(recent.length / 6)) === 0) }));
    h += card("週ごとのスコア", "🗂️", list.slice().reverse().map((x) => {
      const ws = x.c.weekStart, d = parseD(ws), wp = period(daysBetween(d, addDays(d, 6)));
      const good = decCmp(x.r.total, { n: 100n, s: 0 }) >= 0;
      const minus = x.r.lines.filter((l) => l.pts.n < 0n).sort((a, b) => decCmp(a.pts, b.pts))[0];
      return `<button class="row-btn" data-act="modal" data-type="dcrScore" data-id="${ws}"><span class="grow"><b>${weekLabel(ws)}</b>${x.r.complete ? "" : ` <span class="tag t-2">未入力あり</span>`}<br><span class="muted small">${wp.workdays ? "週DCR " + pct(wp.dcr) : "週DCR —"}${minus ? `　最大の減点：${minus.f.label} ${decSigned(minus.pts)}点` : ""}</span></span><b class="${good ? "g" : "r"} big">${decText(x.r.total)}点</b></button>`;
    }).join(""));
    return h;
  }

  function viewHistory() {
    const u = ui(), all = Object.values(D().records);
    const months = [...new Set(all.map((r) => r.date.slice(0, 7)))].sort().reverse();
    const rows = all.filter((r) => u.histMonth === "all" || r.date.startsWith(u.histMonth)).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.cycle - a.cycle));
    let h = `<div class="row2"><label>表示する月<select data-dcrhist>${[["all", "すべて"], ...months.map((m) => [m, `${m.slice(0, 4)}年${+m.slice(5)}月`])].map(([v, l]) => `<option value="${v}" ${u.histMonth === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <button class="btn" data-act="dcrCsv" style="align-self:end">CSVを書き出す</button></div>`;
    if (!rows.length) return h + card("", "", `<p class="muted">まだ記録がありません。カレンダーの日付をタップして入力してください。</p>`);
    h += card(`記録（${rows.length}件）`, "🗂️", rows.map((r) => {
      const c = cyc(r), lv = level(c.planned > 0 ? (r.cycle === 1 ? c.dcr : day(r.date).dcr) : null);
      return `<button class="row-btn" data-act="modal" data-type="dcrDay" data-id="${r.date}"><span class="tag" style="background:${r.cycle === 1 ? C1 : C2};color:#fff">C${r.cycle}</span><span class="grow"><b>${jpDate(r.date)}</b><br><span class="muted small">予定 ${r.planned}・未完了 ${c.inc}（${REASONS.filter((x) => r[x.k]).map((x) => x.label + r[x.k]).join("・") || "なし"}）</span></span><b style="color:${lv.c}">${pct(r.cycle === 1 ? c.dcr : day(r.date).c2dcr)}</b></button>`;
    }).join(""));
    return h;
  }

  function viewConfig() {
    const s = D().settings;
    return card("色分けの基準", "🎨", `<form data-form="dcrSettings" class="grid2">
        <label>良好（この値以下）<input type="number" name="goodLimit" step="0.1" min="0" max="100" value="${s.goodLimit}" inputmode="decimal"></label>
        <label>注意（この値以下）<input type="number" name="warnLimit" step="0.1" min="0" max="100" value="${s.warnLimit}" inputmode="decimal"></label>
        <label>小数点以下の桁数<select name="decimals">${[0, 1, 2, 3].map((v) => `<option value="${v}" ${s.decimals === v ? "selected" : ""}>${v}桁</option>`).join("")}</select></label>
        <button class="btn primary span2" type="submit">保存</button></form>`) +
      card("データ", "💾", `<p class="muted small">ハコログ（アプリ・ウェブ版）のバックアップ（JSON）やCSVを読み込めます。同じ日・同じ便の記録は、読み込んだ内容で上書きされます。</p>
        <div class="row2"><label class="btn filebtn">📥 読み込む<input type="file" accept=".json,.csv,application/json,text/csv" data-act="dcrImport" hidden></label><button class="btn" data-act="dcrBackup">📤 バックアップを書き出す</button></div>
        <button class="btn danger" data-act="dcrWipe">実績・DCRのデータをすべて削除</button>`);
  }

  /* ---------- 入力シート ---------- */
  function dayModal(m) {
    const date = m.id, d = parseD(date), a = day(date);
    const block = (c) => {
      const r = rec(date, c) || { planned: "", cu: 0, uta: 0, nsl: 0, bc: 0, other: 0 };
      const cc = a["c" + c];
      return `<fieldset class="span2"><legend><b style="color:${c === 1 ? C1 : C2}">C${c}</b>${cc && cc.planned ? `　DCR ${pct(c === 1 ? cc.dcr : a.c2dcr)}${c === 2 ? "（C1＋C2合算）" : ""}` : ""}</legend><div class="grid2">
        <label>配達予定数<input type="number" name="c${c}_planned" min="0" inputmode="numeric" value="${esc(r.planned)}" placeholder="0"></label>
        ${REASONS.map((x) => `<label>${x.label}<small> ${x.desc}</small><input type="number" name="c${c}_${x.k}" min="0" inputmode="numeric" value="${esc(r[x.k] || 0)}"></label>`).join("")}</div></fieldset>`;
    };
    return sheet(`${d.getMonth() + 1}月${d.getDate()}日（${DOW[d.getDay()]}）の実績`, `<form data-form="dcrDay" data-date="${date}" class="grid2">
      ${block(1)}${block(2)}
      <p class="muted small span2">配達予定数を空にすると、その便の記録は消えます。</p>
      <button class="btn primary big span2" type="submit">保存</button></form>`);
  }

  function scoreModal(m) {
    const ws = m.id;
    if (!m.draft) m.draft = D().scorecards[ws] ? { ...D().scorecards[ws] } : { weekStart: ws, targetMonth: monthChoices(ws).slice(-1)[0] };
    const dr = m.draft, months = monthChoices(ws), ml = +dr.targetMonth.slice(5) + "月";
    const row = (f, title) => `<label class="scrow"><span><b>${title || f.label}</b> <small class="muted">${f.rule}</small></span><span class="scin"><input data-sc="${f.k}" inputmode="${f.int ? "numeric" : "decimal"}" placeholder="${f.ph}" value="${esc(dr[f.k] ?? "")}" autocomplete="off"><em>${f.unit}</em></span></label>`;
    const g = (k) => SF.find((f) => f.k === k);
    return sheet(`週間スコアカード ${weekLabel(ws)}`, `<div class="score-hero card"><div class="dcr-big"><span id="sctotal"></span><small> 点</small></div><span class="muted small">基本点100点からの加点・減点で計算</span></div>
      <div id="scnotes"></div>
      ${["mentor", "dnr", "returnRate", "late", "accident", "follow", "morningAbsent"].map((k) => row(g(k))).join("")}
      <h3>対象月の数字（${ml}）</h3>
      ${months.length > 1 ? `<p class="muted small">この週は月をまたいでいます。稼働日数と希望休数の対象月を選んでください。</p><div class="seg">${months.map((mm) => `<button type="button" class="${dr.targetMonth === mm ? "on" : ""}" data-act="dcrScMonth" data-v="${mm}">${+mm.slice(0, 4)}年${+mm.slice(5)}月</button>`).join("")}</div>` : ""}
      ${row(g("workDays"), `稼働日数（${ml}）`)}${row(g("requestedOff"), `希望休数（${ml}）`)}
      <details open><summary>計算の内訳</summary><div id="scbreak"></div></details>
      <p class="muted small">新ルール：2026年9月6日〜の週から適用。計算の途中では丸めていません。</p>
      <button class="btn primary big" data-act="dcrScSave" id="scsave">保存</button>
      ${D().scorecards[ws] ? `<button class="btn danger" data-act="dcrScDel">この週のスコアカードを削除</button>` : ""}`);
  }
  function scoreRefresh() {
    const m = S.modal; if (!m || m.type !== "dcrScore") return;
    const r = scCalc(m.draft), tot = document.getElementById("sctotal"); if (!tot) return;
    tot.textContent = decText(r.total);
    let notes = "";
    if (m.id < RULE_START) notes += `<p class="alert blue">この週は新ルール（2026年9月6日〜の週）より前です。新ルールで計算した参考値です。</p>`;
    if (r.invalid.length) notes += `<p class="alert red">数字で入力してください：${r.invalid.map((f) => f.label).join("、")}</p>`;
    if (r.missing.length) notes += `<p class="alert yellow">未入力：${r.missing.map((f) => f.label).join("、")}（空欄は0点として仮計算）</p>`;
    document.getElementById("scnotes").innerHTML = notes;
    document.querySelectorAll("[data-sc]").forEach((inp) => inp.classList.toggle("bad", scParse(m.draft[inp.dataset.sc], SF.find((f) => f.k === inp.dataset.sc).int).st === "invalid"));
    document.getElementById("scbreak").innerHTML = `<div class="li"><b class="grow">基本点</b><b>100点</b></div>` + r.lines.map((l) => {
      const vt = l.p.st === "empty" ? `<span class="or">未入力</span>` : l.p.st === "invalid" ? `<span class="r">数字で入力</span>` : l.f.k === "mentor" ? `${decText(l.p.v)}点（${decCmp(l.p.v, { n: 800n, s: 0 }) < 0 ? "800未満" : "800以上"}）` : decText(l.p.v) + l.f.unit;
      const pt = l.p.st === "empty" ? "−" : l.p.st === "invalid" ? "?" : decSigned(l.pts) + "点";
      return `<div class="li"><span class="grow">${l.f.label}<br><span class="muted small">${vt}</span></span><b class="${l.pts.n > 0n ? "g" : l.pts.n < 0n ? "r" : "muted"}">${pt}</b></div>`;
    }).join("") + `<div class="li"><b class="grow big">合計</b><b class="big ${r.total.n < 0n ? "r" : ""}">${decText(r.total)}点</b></div>`;
    const sv = document.getElementById("scsave"); if (sv) sv.disabled = r.invalid.length > 0;
  }

  /* ---------- 登録 ---------- */
  Object.assign(MODALS, { dcrDay: dayModal, dcrScore: scoreModal });
  Object.assign(ACT, {
    dcrMonth(el) { const u = ui(), v = +el.dataset.v; const t = today(); u.month = v === 0 ? new Date(t.getFullYear(), t.getMonth(), 1) : new Date(u.month.getFullYear(), u.month.getMonth() + v, 1); render(); },
    dcrRange(el) { ui().range = el.dataset.v; render(); },
    dcrA(el) { const u = ui(), v = +el.dataset.v; if (u.range === "year") u.aYear += v; else u.aMonth = new Date(u.aMonth.getFullYear(), u.aMonth.getMonth() + v, 1); render(); },
    dcrScMonth(el) { S.modal.draft.targetMonth = el.dataset.v; render(); setTimeout(scoreRefresh, 0); },
    dcrScSave() {
      const m = S.modal, r = scCalc(m.draft); if (r.invalid.length) return;
      const ws = m.id; S.modal = null;
      mutate((d) => { if (cardEmpty(m.draft)) delete d.dcr.scorecards[ws]; else d.dcr.scorecards[ws] = cleanCard(m.draft); });
      toast("スコアカードを保存しました");
    },
    async dcrScDel() {
      const ws = S.modal.id;
      if (!await askConfirm(`${weekLabel(ws)}のスコアカードを削除しますか？（配達記録は消えません）`)) return;
      S.modal = null; mutate((d) => { delete d.dcr.scorecards[ws]; }); toast("スコアカードを削除しました");
    },
    dcrCsv() { download(`実績DCR_${ymd(today())}.csv`, csvText(), "text/csv"); },
    dcrBackup() { download(`ハコログ_バックアップ_${ymd(today())}.json`, backupText(), "application/json"); },
    async dcrWipe() {
      if (!await askConfirm("実績・DCRの記録とスコアカードをすべて削除しますか？元に戻せません。")) return;
      mutate((d) => { d.dcr.records = {}; d.dcr.scorecards = {}; }); toast("削除しました");
    }
  });
  Object.assign(FORM, {
    dcrDay(fd, form) {
      const date = form.dataset.date, out = {}, errs = [];
      for (const c of [1, 2]) {
        const pl = fd.get(`c${c}_planned`);
        if (pl === "" || pl == null) { out[c] = null; continue; }
        const r = { date, cycle: c, planned: Math.max(0, Math.floor(+pl || 0)) };
        REASONS.forEach((x) => (r[x.k] = Math.max(0, Math.floor(+fd.get(`c${c}_${x.k}`) || 0))));
        if (inc(r) > r.planned) errs.push(`C${c}：未完了の合計が配達予定数を超えています`);
        out[c] = r;
      }
      if (errs.length) { toast(errs[0]); return; }
      S.modal = null;
      mutate((d) => { for (const c of [1, 2]) { if (out[c]) d.dcr.records[key(date, c)] = out[c]; else delete d.dcr.records[key(date, c)]; } });
      toast("保存しました");
    },
    dcrSettings(fd) {
      const good = Math.min(100, Math.max(0, +fd.get("goodLimit") || 0)), warn = Math.max(good, Math.min(100, +fd.get("warnLimit") || 0));
      mutate((d) => { d.dcr.settings = { ...d.dcr.settings, goodLimit: Math.round(good * 10) / 10, warnLimit: Math.round(warn * 10) / 10, decimals: +fd.get("decimals") }; });
      toast("保存しました");
    }
  });
  Object.assign(CHANGE, {
    async dcrImport(el) {
      const f = el.files[0]; if (!f) return;
      try {
        const res = parseImport(await f.text());
        if (!res.records.length && !res.cards.length) { toast(res.errors[0] || "読み込める記録がありませんでした"); return; }
        if (!await askConfirm(`記録${res.records.length}件${res.cards.length ? `・スコアカード${res.cards.length}週` : ""}を読み込みますか？${res.errors.length ? `（読めない行が${res.errors.length}件あります）` : ""}`)) return;
        mutate((d) => { res.records.forEach((r) => (d.dcr.records[key(r.date, r.cycle)] = r)); res.cards.forEach((c) => (d.dcr.scorecards[c.weekStart] = c)); });
        toast("読み込みました");
      } catch (e) { toast(e.message || "読み込めませんでした"); }
    }
  });
  document.addEventListener("input", (ev) => {
    const el = ev.target;
    if (el.dataset && el.dataset.sc && S.modal && S.modal.type === "dcrScore") {
      if (el.value.trim()) S.modal.draft[el.dataset.sc] = el.value; else delete S.modal.draft[el.dataset.sc];
      scoreRefresh();
    }
  });
  document.addEventListener("change", (ev) => {
    const el = ev.target;
    if (el.matches && el.matches("[data-dcrhist]")) { ui().histMonth = el.value; render(); }
  });
  // シートを開いた直後に内訳を描く
  new MutationObserver(() => { if (S.modal && S.modal.type === "dcrScore" && document.getElementById("sctotal") && !document.getElementById("sctotal").textContent) scoreRefresh(); })
    .observe(document.getElementById("app"), { childList: true, subtree: true });

  return { view, migrate, defaults, period, level, pct, ymd, today };
})();
