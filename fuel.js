/* =========================================================
   燃費・経費
   データは S.data.fuel に入り、ログインしていればクラウドに同期されます。
   ========================================================= */
"use strict";
const FUELM = (() => {
  const ACC = "#d95f30";
  const TAX = [
    { id: "sharyo", account: "車両費", label: "車両費", icon: "🚗", note: "配達で使う車のガソリン代・メンテナンス・タイヤ・補修など。",
      items: ["配達業務用車両燃料代（ガソリン）", "配達業務用車両メンテナンス費（オイル交換・フィルター交換）", "配達業務用車両補修費（シートカバー補修シール）", "配達業務用車両タイヤ購入", "軽貨物事業用登録費用（黒ナンバープレート発行）"] },
    { id: "shuzen", account: "修繕費", label: "修繕費", icon: "🔧", note: "車両の故障・破損を元の状態に戻すための修理代。", items: ["配達業務用車両維持費"] },
    { id: "ryohi", account: "旅費交通費", label: "旅費交通費", icon: "🛣️", note: "仕事の移動で払った高速料金・駐車料金・交通費。",
      items: ["配達業務移動高速料金（高速）", "YouTube撮影移動高速料金（高速）", "配達業務用駐車料金（駐車場）", "YouTube撮影用駐車料金（駐車場）", "事業用車両修理関連移動交通費"] },
    { id: "tsushin", account: "通信費", label: "通信費", icon: "📡", note: "仕事で使うネットサービス・配信登録・AIツールの利用料。", items: ["楽曲配信登録費（音楽配信サービス）", "動画制作AIツール利用料", "業務改善AIツール利用料"] },
    { id: "kenshu", account: "研修費", label: "研修費", icon: "🎓", note: "仕事のスキルを身につけるための教材・講座。", items: ["YouTube動画制作教材", "動画編集学習教材", "コンテンツ制作教材"] },
    { id: "tesuryo", account: "支払手数料", label: "支払手数料", icon: "🏧", note: "ATM引出手数料など。消費税は非課税。", items: ["ATM引出手数料（非課税）"] },
    { id: "shomo13", account: "消耗品費", label: "消耗品費1.3（営業・事務）", icon: "✏️", note: "仕事用の服・靴、事務用品、書類保管・データ保存用品など。",
      items: ["営業備品（服、靴）", "事業用事務用品（ボールペン）", "事業書類保管用", "事業用データバックアップ", "事業書類スキャン費用"] },
    { id: "shomo12", account: "消耗品費", label: "消耗品費1.2（配達用品）", icon: "📦", note: "配達で使う衛生用品・暑さ寒さ対策・保冷バッグ・梱包資材・スマホ固定など。",
      items: ["配達業務用衛生用品", "配達業務用熱中症対策装備", "配達業務用熱中症対策用品", "配達業務用防寒対策用品", "配達業務用安全装備", "軽貨物配達業務用保冷バッグ", "配達業務用梱包資材（養生テープ）", "配達資材保管用", "配達業務用スマホ固定吸盤・設置テープ", "配達業務用スマホ保護用品"] },
    { id: "shomo11", account: "消耗品費", label: "消耗品費1.1（YouTube撮影）", icon: "🎥", note: "YouTube撮影用の素材・備品・操作機器・保管用品など。",
      items: ["YouTube撮影用撮影素材・備品", "YouTube撮影用コンテンツ素材", "YouTube撮影用操作機器", "YouTube機材保管用", "YouTube撮影用スマホ保護用品", "撮影小道具保管用"] },
    { id: "settai", account: "接待交際費", label: "接待交際費", icon: "☕", note: "取引先との打ち合わせを兼ねた飲食など。", items: ["取引先様との打ち合わせ兼懇親"] },
    { id: "zappi", account: "雑費", label: "雑費", icon: "🗂️", note: "どの科目にも当てはまらない少額の経費。", items: ["その他"] }
  ];
  const cat = (id) => TAX.find((c) => c.id === id) || TAX[TAX.length - 1];
  const ACCOUNTS = [...new Set(TAX.map((c) => c.account))];
  const MTYPES = [["oil", "オイル交換", "💧"], ["filter", "オイルフィルター交換", "🧴"], ["tire", "タイヤ交換・購入", "🛞"], ["battery", "バッテリー交換", "🔋"], ["wiper", "ワイパー交換", "🌧️"], ["brake", "ブレーキ整備", "🛑"], ["inspection", "車検・点検", "📋"], ["repair", "修理", "🔧"], ["other", "その他", "•"]];
  const mtype = (k) => MTYPES.find((x) => x[0] === k) || MTYPES[MTYPES.length - 1];
  const mDefaultExpense = (k) => (k === "repair" ? ["shuzen", "配達業務用車両維持費"] : k === "tire" ? ["sharyo", "配達業務用車両タイヤ購入"] : ["sharyo", "配達業務用車両メンテナンス費（オイル交換・フィルター交換）"]);
  const GUESS = [
    [["ガソリン", "レギュラー", "ハイオク", "軽油", "給油", "ENEOS", "エネオス", "出光", "apollo", "コスモ", "COSMO", "キグナス"], "sharyo", "配達業務用車両燃料代（ガソリン）"],
    [["オイル", "エレメント", "フィルター"], "sharyo", "配達業務用車両メンテナンス費（オイル交換・フィルター交換）"],
    [["タイヤ"], "sharyo", "配達業務用車両タイヤ購入"],
    [["駐車", "パーキング", "PARKING", "Times", "タイムズ"], "ryohi", "配達業務用駐車料金（駐車場）"],
    [["高速", "NEXCO", "ネクスコ", "ETC", "首都高", "阪神高速"], "ryohi", "配達業務移動高速料金（高速）"],
    [["ATM", "引出", "手数料"], "tesuryo", "ATM引出手数料（非課税）"],
    [["保冷", "クーラーバッグ"], "shomo12", "軽貨物配達業務用保冷バッグ"],
    [["養生テープ", "テープ"], "shomo12", "配達業務用梱包資材（養生テープ）"],
    [["ボールペン", "文具", "ノート", "ファイル"], "shomo13", "事業用事務用品（ボールペン）"],
    [["修理", "板金", "整備"], "shuzen", "配達業務用車両維持費"]
  ];

  /* ---------- データ ---------- */
  const defaults = () => ({
    settings: { vehicleName: "配達車", tankCapacity: 34, gaugeSegments: 10, startOdometer: 0, oilIntervalKm: 5000, calcMethod: "gauge",
      platforms: ["Uber Eats", "出前館", "Rocket Now", "Amazon", "menu", "Wolt", "YouTube", "その他"], fuelTags: ["高速走行", "街乗り", "エアコン使用", "荷物多め", "雨天", "渋滞"] },
    fuels: [], maints: [], daily: [], meters: [], incomes: [], expenses: []
  });
  function migrate(d) {
    const base = defaults();
    d.fuel = d.fuel && typeof d.fuel === "object" ? d.fuel : base;
    for (const k of Object.keys(base)) if (d.fuel[k] == null) d.fuel[k] = base[k];
    d.fuel.settings = { ...base.settings, ...d.fuel.settings };
  }
  const F = () => S.data.fuel;
  const ST = () => F().settings;

  /* ---------- 表示用 ---------- */
  const pad = (v) => String(v).padStart(2, "0");
  const ymdOf = (d) => { const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
  const todayStr = () => ymdOf(new Date());
  const yen = (v) => "¥" + Math.round(v || 0).toLocaleString("ja-JP");
  const km = (v, dg = 0) => (v == null || !isFinite(v) ? "—" : Number(v).toLocaleString("ja-JP", { minimumFractionDigits: dg, maximumFractionDigits: dg }));
  const md = (s) => { const d = new Date(String(s).length === 10 ? s + "T00:00:00" : s); return `${d.getMonth() + 1}/${d.getDate()}`; };
  const mdhm = (s) => { const d = new Date(s); return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${pad(d.getMinutes())}`; };
  const localDT = (s) => { const d = s ? new Date(s) : new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const numv = (v) => (v === "" || v == null || isNaN(+v) ? 0 : +v);
  const mini = (label, value, unit = "", cls = "") => `<div class="mini"><span>${label}</span><b class="${cls}">${value}${unit ? `<small> ${unit}</small>` : ""}</b></div>`;

  /* ---------- 計算（アプリと同じ） ---------- */
  const sortedFuels = () => [...F().fuels].sort((a, b) => T(a.date) - T(b.date));
  function efficiencies() {
    const fs = sortedFuels(), s = ST(); if (fs.length < 2) return [];
    const per = s.gaugeSegments > 0 ? s.tankCapacity / s.gaugeSegments : 0, out = [];
    if (s.calcMethod === "full") {
      let lastFull = fs[0].isFull ? 0 : null, liters = 0;
      for (let i = 1; i < fs.length; i++) {
        liters += fs[i].liters;
        if (fs[i].isFull) {
          if (lastFull != null) { const dist = fs[i].odometer - fs[lastFull].odometer; if (dist > 0 && liters > 0) out.push({ rec: fs[i], dist, used: liters, kmpl: dist / liters }); }
          lastFull = i; liters = 0;
        }
      }
    } else {
      for (let i = 1; i < fs.length; i++) {
        const prev = fs[i - 1], cur = fs[i], dist = cur.odometer - prev.odometer, used = (prev.gaugeAfter - cur.gaugeBefore) * per;
        if (dist > 0 && used > 0) out.push({ rec: cur, dist, used, kmpl: dist / used });
      }
    }
    return out;
  }
  const effOf = (id) => efficiencies().find((e) => e.rec.id === id);
  function avgKmpl(list = efficiencies()) { const d = sum(list.map((e) => e.dist)), u = sum(list.map((e) => e.used)); return u > 0 ? d / u : null; }
  function currentOdo() {
    const f = F(), v = [...f.fuels.map((x) => x.odometer), ...f.maints.map((x) => x.odometer), ...f.daily.map((x) => x.end), ...f.meters.map((x) => x.total).filter((x) => x != null)].filter((x) => x > 0);
    return v.length ? Math.max(...v) : ST().startOdometer;
  }
  const lastOil = () => F().maints.filter((m) => m.type === "oil").sort((a, b) => (a.date < b.date ? 1 : -1))[0] || null;
  const newer = (a, b) => (a && b ? (T(a[0]) >= T(b[0]) ? a[1] : b[1]) : a ? a[1] : b ? b[1] : null);
  function sinceOil() {
    const lo = lastOil(), m = F().meters.filter((x) => x.tripOil != null).sort((a, b) => T(b.date) - T(a.date))[0];
    return newer(lo ? [lo.date + "T12:00:00", Math.max(0, currentOdo() - lo.odometer)] : null, m ? [m.date, m.tripOil] : null);
  }
  function sinceFuel() {
    const lf = sortedFuels().at(-1), m = F().meters.filter((x) => x.tripFuel != null).sort((a, b) => T(b.date) - T(a.date))[0];
    return newer(lf ? [lf.date, Math.max(0, currentOdo() - lf.odometer)] : null, m ? [m.date, m.tripFuel] : null);
  }
  const oilInterval = () => (lastOil() && lastOil().nextIntervalKm) || ST().oilIntervalKm;
  const oilRemaining = () => { const s = sinceOil(); return s == null ? null : oilInterval() - s; };
  const dist = (l) => Math.max(0, (l.end || 0) - (l.start || 0));
  function avgDaily() { const l = [...F().daily].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 30).filter((x) => dist(x) > 0); return l.length ? sum(l.map(dist)) / l.length : null; }
  const todayLog = () => F().daily.find((x) => x.date === todayStr());
  function range() {
    const lf = sortedFuels().at(-1), a = avgKmpl(), s = ST(); if (!lf || !a || !s.gaugeSegments) return null;
    return Math.max(0, (lf.gaugeAfter * s.tankCapacity / s.gaugeSegments) * a - Math.max(0, currentOdo() - lf.odometer));
  }
  function summary(from, to) {
    const f = F(), inR = (d) => d >= from && d <= to;
    const inc = f.incomes.filter((x) => inR(x.date)), exp = f.expenses.filter((x) => inR(x.date)), fu = f.fuels.filter((x) => inR(ymdOf(x.date))), logs = f.daily.filter((x) => inR(x.date));
    const s = { income: sum(inc.map((x) => x.amount)), expense: sum(exp.map((x) => x.amount)), deliveries: sum(inc.map((x) => x.deliveries || 0)), fuelCost: sum(fu.map((x) => x.totalPrice)), liters: sum(fu.map((x) => x.liters)), byPlatform: {}, byCat: {}, byAccount: {} };
    inc.forEach((x) => (s.byPlatform[x.platform] = (s.byPlatform[x.platform] || 0) + x.amount));
    exp.forEach((x) => { const c = cat(x.categoryId); s.byCat[c.label] = (s.byCat[c.label] || 0) + x.amount; s.byAccount[c.account] = (s.byAccount[c.account] || 0) + x.amount; });
    if (logs.length) { s.distance = sum(logs.map(dist)); s.workDays = new Set(logs.filter((x) => dist(x) > 0).map((x) => x.date)).size; }
    else { const o = [...fu.map((x) => x.odometer), ...f.maints.filter((x) => inR(x.date)).map((x) => x.odometer)].filter((x) => x > 0); s.distance = o.length ? Math.max(...o) - Math.min(...o) : 0; s.workDays = new Set(inc.map((x) => x.date)).size; }
    const ef = efficiencies().filter((e) => inR(ymdOf(e.rec.date))); s.kmpl = avgKmpl(ef);
    s.profit = s.income - s.expense; s.unit = s.liters > 0 ? s.fuelCost / s.liters : null; s.perKm = s.distance > 0 ? s.income / s.distance : null; s.perDay = s.workDays > 0 ? s.distance / s.workDays : null;
    return s;
  }
  const monthRange = (y, m) => { const a = new Date(y, m, 1), b = new Date(y, m + 1, 0); return [ymdOf(a), ymdOf(b)]; };
  const yearRange = (y) => [`${y}-01-01`, `${y}-12-31`];

  /* ---------- 保存 ---------- */
  function upsert(list, r) { const i = list.findIndex((x) => x.id === r.id); i >= 0 ? (list[i] = r) : list.push(r); }
  function linkExpense(d, src, srcId, on, exp) {
    const old = d.fuel.expenses.find((x) => x.source === src && x.sourceId === srcId);
    if (on && exp.amount > 0) upsert(d.fuel.expenses, { id: old ? old.id : uid(), source: src, sourceId: srcId, ...exp });
    else if (old) d.fuel.expenses = d.fuel.expenses.filter((x) => x !== old);
  }
  const hasLinked = (src, id) => F().expenses.some((x) => x.source === src && x.sourceId === id);

  /* ---------- 文字の読み取り（端末のブラウザ内で処理） ---------- */
  async function ensureWorker(progress) {
    if (!window.Tesseract) {
      progress && progress("文字認識の準備中（初回だけ少し時間がかかります）…");
      await new Promise((ok, ng) => { const sc = document.createElement("script"); sc.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"; sc.onload = ok; sc.onerror = () => ng(new Error("文字認識の部品を読み込めませんでした")); document.head.appendChild(sc); });
    }
    if (!OCR._worker) OCR._worker = await Tesseract.createWorker(["jpn", "eng"], 1);
    return OCR._worker;
  }
  function loadImg(file) { return new Promise((ok, ng) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { ok(im); setTimeout(() => URL.revokeObjectURL(u), 1000); }; im.onerror = ng; im.src = u; }); }
  /** 白黒・高コントラスト・拡大（invert で白黒反転） */
  function prep(im, invert, minW = 1400) {
    const sc = Math.min(4, Math.max(1, minW / im.naturalWidth), 2600 / Math.max(im.naturalWidth, im.naturalHeight) * Math.max(1, minW / im.naturalWidth));
    const c = document.createElement("canvas"); c.width = Math.round(im.naturalWidth * sc); c.height = Math.round(im.naturalHeight * sc);
    const x = c.getContext("2d"); x.drawImage(im, 0, 0, c.width, c.height);
    const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) { let g = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]; g = clamp((g - 128) * 1.7 + 128, 0, 255); if (invert) g = 255 - g; p[i] = p[i + 1] = p[i + 2] = g; }
    x.putImageData(d, 0, 0); return c;
  }
  function thumb(im) { const c = document.createElement("canvas"), s = Math.min(1, 520 / im.naturalWidth); c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); return c.toDataURL("image/jpeg", 0.7); }
  const LOOK = { O: "0", o: "0", D: "0", Q: "0", U: "0", I: "1", l: "1", i: "1", "|": "1", "!": "1", Z: "2", z: "2", S: "5", s: "5", G: "6", b: "6", T: "7", B: "8", g: "9", q: "9" };
  const half = (s) => String(s).replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/　/g, " ");
  /** 数字のかたまりに混ざった O・l・S・B などを数字に直す */
  function fixDigits(s) {
    return s.replace(/[A-Za-z0-9.,|!]+/g, (tok) => {
      const dg = (tok.match(/[0-9]/g) || []).length, lk = [...tok].filter((c) => LOOK[c]).length, other = [...tok].filter((c) => !/[0-9.,]/.test(c) && !LOOK[c]).length;
      return dg > 0 && other === 0 && lk <= dg ? [...tok].map((c) => LOOK[c] || c).join("") : tok;
    });
  }
  function meterNums(raw) {
    let s = half(raw);
    s = s.replace(/\d{1,2}\s*:\s*\d{2}/g, " ").replace(/\d+(?:[.,]\d+)?\s*(?:km\s*\/\s*[lℓ]|°\s*c?|℃|%|rpm)/gi, " ").replace(/trip\s*[ab]?|odo|total|km|miles?/gi, " ");
    s = fixDigits(s);
    s = s.includes(".") ? s.replace(/(\d) (?=\d{3}(?!\d))/g, "$1") : s.replace(/(\d) +(?=\d)/g, "$1");
    const out = [];
    for (let t of s.match(/\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:[.,]\d{1,2})?/g) || []) {
      t = /^\d{1,3}(?:,\d{3})+/.test(t) ? t.replace(/,/g, "") : t.replace(",", ".");
      const v = +t; if (!(v > 0)) continue;
      out.push({ v, dec: t.includes("."), d: Math.max(1, t.split(".")[0].replace(/^0+/, "").length) });
    }
    return out;
  }
  function interp(n, trip) {
    if (trip) {
      if (n.dec) return n.v < 10000 ? [[n.v, 1.4]] : [];
      if (n.v >= 10000) return n.d === 5 ? [[n.v / 10, 0.7]] : [];
      const l = [[n.v, n.d <= 1 ? 0.3 : 1]]; if (n.v >= 10) l.push([n.v / 10, 0.6]); return l;
    }
    if (n.dec) return [[Math.floor(n.v), 0.4]];
    const w = { 5: 1.3, 6: 1.3, 4: 1, 7: 1, 3: 0.5, 2: 0.15, 1: 0.15 }[n.d]; return w ? [[n.v, w]] : [];
  }
  function plaus(v, trip, e) {
    if (!(e > 0)) return 1;
    if (trip) return Math.abs(v - e) <= Math.max(80, e * 0.25) ? 2 : 0.7;
    if (v >= e - 1 && v <= e + 3000) return 3; if (v < e - 1) return 0.25; return v <= e + 15000 ? 0.8 : 0.3;
  }
  async function readMeter(file, trip, expected, progress) {
    const im = await loadImg(file), w = await ensureWorker(progress), totals = new Map(), votes = new Map();
    const variants = [prep(im, false), prep(im, true)];
    for (let pi = 0; pi < variants.length; pi++) {
      progress && progress(`読み取り中…（${pi + 1}/${variants.length}）`);
      const { data } = await w.recognize(variants[pi]);
      const ls = (data.lines || []).filter((l) => l.text.trim()), maxH = Math.max(1, ...ls.map((l) => l.bbox.y1 - l.bbox.y0));
      for (const l of ls) {
        const sizeW = 0.25 + 0.75 * ((l.bbox.y1 - l.bbox.y0) / maxH), confW = 0.5 + 0.5 * ((l.confidence || 50) / 100);
        for (const n of meterNums(l.text)) for (const [v, wt] of interp(n, trip)) {
          if (!(v > 0)) continue; const k = Math.round(v * 10);
          totals.set(k, (totals.get(k) || 0) + sizeW * confW * wt * plaus(v, trip, expected));
          if (!votes.has(k)) votes.set(k, new Set()); votes.get(k).add(pi);
        }
      }
    }
    const ranked = [...totals].map(([k, t]) => [k, t * (1 + 0.35 * (votes.get(k).size - 1))]).sort((a, b) => b[1] - a[1]);
    return { best: ranked.length ? ranked[0][0] / 10 : null, cands: ranked.slice(0, 6).map((r) => r[0] / 10), sure: ranked.length > 0 && votes.get(ranked[0][0]).size >= 2 && (ranked.length < 2 || ranked[0][1] >= ranked[1][1] * 1.6), thumb: thumb(im) };
  }
  async function readReceipt(file, progress) {
    const im = await loadImg(file); await ensureWorker(progress); progress && progress("読み取り中…");
    const { data } = await OCR._worker.recognize(prep(im, false, 1600));
    const ls = (data.lines || []).map((l) => fixDigits(half(l.text.trim())).replace(/￥/g, "¥")).filter(Boolean), text = ls.join("\n"), r = {};
    const dm = text.match(/(20\d{2})\s*[年\/.\-]\s*(\d{1,2})\s*[月\/.\-]\s*(\d{1,2})/); if (dm) r.date = `${dm[1]}-${pad(+dm[2])}-${pad(+dm[3])}`;
    const tm = text.match(/(\d{1,2}):(\d{2})/); if (tm && +tm[1] < 24) r.time = `${pad(+tm[1])}:${tm[2]}`;
    const nums = (s) => (s.match(/\d{1,3}(?:,\d{3})+|\d+/g) || []).map((x) => +x.replace(/,/g, "")).filter((x) => x > 0 && x < 1e6);
    for (let i = 0; i < ls.length && r.total == null; i++) if (/合計|お買上|お支払|領収金額|ご請求|総額|TOTAL/i.test(ls[i])) { const a = nums(ls[i]); if (a.length) r.total = Math.max(...a); else if (ls[i + 1] && nums(ls[i + 1]).length) r.total = Math.max(...nums(ls[i + 1])); }
    if (r.total == null) { const a = ls.filter((l) => /[¥円]/.test(l)).flatMap(nums); if (a.length) r.total = Math.max(...a); }
    const lm = text.match(/(\d+(?:\.\d+)?)\s*(?:L|ℓ|ﾘｯﾄﾙ|リットル)/); if (lm && +lm[1] > 0.5 && +lm[1] < 200) r.liters = +lm[1];
    r.store = ls.find((l) => l.length >= 2 && !/\d/.test(l));
    for (const [keys, c, item] of GUESS) if (keys.some((k) => text.toLowerCase().includes(k.toLowerCase()))) { r.cat = c; r.item = item; break; }
    return r;
  }

  /* ---------- 画面 ---------- */
  const SUBS = [["home", "🏠", "ホーム"], ["fuel", "⛽", "給油・燃費"], ["maint", "🔧", "整備・走行"], ["money", "¥", "収支"], ["report", "📊", "レポート"]];
  const subbar = (cur) => `<div class="subbar fuelbar" role="tablist">${SUBS.map(([k, ic, t]) => `<button role="tab" aria-selected="${cur === k}" class="${cur === k ? "on" : ""}" data-act="seg" data-k="fuel" data-v="${k}">${ic} ${t}</button>`).join("")}</div>`;
  const UI = { month: null, rMode: "month", rDate: null, maintSeg: "maint", moneySeg: "income" };
  function ui() { if (!UI.month) { const t = new Date(); UI.month = new Date(t.getFullYear(), t.getMonth(), 1); UI.rDate = new Date(t.getFullYear(), t.getMonth(), 1); } return UI; }

  function view() {
    const sub = S.seg.fuel || "home";
    const body = sub === "fuel" ? viewFuel() : sub === "maint" ? viewMaint() : sub === "money" ? viewMoney() : sub === "report" ? viewReport() : viewHome();
    return subbar(sub) + body;
  }

  function viewHome() {
    const f = F(), t = new Date(), [a, b] = monthRange(t.getFullYear(), t.getMonth()), s = summary(a, b);
    const empty = !f.fuels.length && !f.incomes.length && !f.expenses.length && !f.maints.length && !f.daily.length;
    let h = "";
    if (empty) h += card("はじめに", "👋", `<p>給油・整備・売上・経費を記録すると、燃費やオイル交換の時期、月ごとの収支が自動で分かります。</p><p class="muted small">まず右の「⚙️ 車の設定」で、タンク容量と燃料メーターのメモリー数を入れてください。</p>`);
    h += `<div class="fquick"><button class="prime" data-act="modal" data-type="fuelMeter">📷<span>メーター写真で読取</span></button><button data-act="modal" data-type="fuelEdit">⛽<span>給油を記録</span></button><button data-act="modal" data-type="incomeEdit">¥<span>売上を記録</span></button><button data-act="modal" data-type="expenseEdit">🧾<span>経費・レシート</span></button></div>`;
    h += card("走行距離", "🛞", `<div class="minis">${mini("総走行距離（ODO）", km(currentOdo()), "km")}${mini("乗り始めてから", km(Math.max(0, currentOdo() - ST().startOdometer)), "km")}${mini("今日", todayLog() ? km(dist(todayLog()), 1) : "—", "km")}${mini("1日平均", avgDaily() != null ? km(avgDaily(), 1) : "—", "km")}</div>`, `<button class="link" data-act="modal" data-type="fuelSettings">⚙️ 車の設定</button>`);
    const since = sinceOil(), rem = oilRemaining();
    if (rem != null) {
      const ratio = clamp(since / Math.max(1, oilInterval()), 0, 1), col = rem < 0 ? "var(--r)" : rem < 500 ? "var(--or)" : "var(--g)", ad = avgDaily();
      h += card("オイル交換", "💧", `<div class="minis">${mini("交換してから", km(since), "km")}${mini(rem >= 0 ? "次の交換まで" : "交換時期を過ぎています", `<span style="color:${col}">${km(Math.abs(rem))}</span>`, "km")}</div><div class="obar"><i style="width:${ratio * 100}%;background:${col}"></i></div>${ad > 0 && rem > 0 ? `<p class="muted small">このペースだと約${Math.round(rem / ad)}日後が交換の目安です。</p>` : ""}`);
    } else h += card("オイル交換", "💧", `<p class="muted small">「整備・走行」でオイル交換を記録すると、次の交換までの残り距離が出ます。</p>`);
    h += card("燃費", "⛽", `<div class="minis">${mini("平均燃費", avgKmpl() != null ? km(avgKmpl(), 1) : "—", "km/L")}${mini("給油してから", sinceFuel() != null ? km(sinceFuel()) : "—", "km")}${mini("走れる目安", range() != null ? km(range()) : "—", "km")}</div>`);
    h += card(`今月の収支（${t.getMonth() + 1}月）`, "¥", `<div class="minis">${mini("売上", yen(s.income))}${mini("経費", yen(s.expense))}${mini("利益", yen(s.profit), "", s.profit >= 0 ? "g" : "r")}</div>`);
    return h;
  }

  function viewFuel() {
    const ef = efficiencies(), s = ST();
    let h = card("", "", `<div class="minis">${mini("平均燃費", avgKmpl() != null ? km(avgKmpl(), 1) : "—", "km/L")}${mini("給油してから", sinceFuel() != null ? km(sinceFuel()) : "—", "km")}${mini("走れる目安", range() != null ? km(range()) : "—", "km")}</div><p class="muted small">計算方法：${s.calcMethod === "full" ? "満タン法" : "メモリー計算"}（タンク${km(s.tankCapacity)}L・メモリー${s.gaugeSegments}個）</p>`);
    h += `<div class="row2"><button class="btn primary" data-act="modal" data-type="fuelEdit">＋ 給油を記録</button><button class="btn" data-act="modal" data-type="fuelSettings">⚙️ 車の設定</button></div>`;
    if (ef.length >= 2) {
      const last = ef.slice(-20);
      h += card("燃費の推移", "📈", Chart.line({ series: [{ name: "燃費", color: ACC, points: last.map((e, i) => ({ x: i, y: e.kmpl, tip: `${mdhm(e.rec.date)} ${e.kmpl.toFixed(1)}km/L${(e.rec.tags || []).length ? "（" + e.rec.tags.join("・") + "）" : ""}` })) }], xMin: 0, xMax: Math.max(1, last.length - 1), yMin: 0,
        xTicks: last.map((e, i) => ({ v: i, label: md(e.rec.date) })).filter((_, i) => i % Math.max(1, Math.ceil(last.length / 6)) === 0) }) + `<p class="muted small">点をタップすると日付と走り方が出ます。</p>`);
    }
    const list = sortedFuels().reverse();
    h += card(`給油の記録（${list.length}件）`, "⛽", list.map((r) => {
      const e = effOf(r.id);
      return `<button class="row-btn" data-act="modal" data-type="fuelEdit" data-id="${r.id}"><span class="grow"><b>${mdhm(r.date)}</b><br><span class="muted small">${km(r.liters, 2)}L・${yen(r.totalPrice)}・${r.liters > 0 ? km(r.totalPrice / r.liters, 1) : "—"}円/L・残り${r.gaugeBefore}メモリーから</span>${(r.tags || []).length ? `<br><span class="small" style="color:${ACC}">${esc(r.tags.join(" / "))}</span>` : ""}</span><span style="text-align:right">${e ? `<b class="big">${e.kmpl.toFixed(1)}</b><br><span class="muted small">km/L・${km(e.dist)}km</span>` : `<span class="muted">—</span>`}</span></button>`;
    }).join("") || `<p class="muted">給油の記録がありません。レシートの写真からも入力できます。</p>`);
    return h;
  }

  function viewMaint() {
    const u = ui();
    let h = `<div class="seg"><button class="${u.maintSeg === "maint" ? "on" : ""}" data-act="fuelSeg" data-k="maintSeg" data-v="maint">整備記録</button><button class="${u.maintSeg === "daily" ? "on" : ""}" data-act="fuelSeg" data-k="maintSeg" data-v="daily">1日の走行距離</button></div>`;
    if (u.maintSeg === "daily") {
      const logs = [...F().daily].sort((a, b) => (a.date < b.date ? 1 : -1));
      h += card("1日の走行距離", "🛣️", `<div class="minis">${mini("今日", todayLog() ? km(dist(todayLog()), 1) : "—", "km")}${mini("1日平均（直近30日）", avgDaily() != null ? km(avgDaily(), 1) : "—", "km")}</div>` +
        (logs.length >= 2 ? Chart.bar({ items: logs.slice(0, 14).reverse().map((l) => ({ label: md(l.date), value: dist(l), color: ACC, tip: `${md(l.date)} ${km(dist(l), 1)}km` })) }) : "") + `<p class="muted small">朝と夜にメーターの写真を読み取ると自動で計算されます。</p>`);
      h += `<div class="row2"><button class="btn primary" data-act="modal" data-type="fuelMeter">📷 メーター写真で読取</button><button class="btn" data-act="modal" data-type="dailyEdit">＋ 手で入力</button></div>`;
      h += card("毎日の記録", "🗓️", logs.map((l) => `<button class="row-btn" data-act="modal" data-type="dailyEdit" data-id="${l.id}"><span class="grow"><b>${md(l.date)}</b><br><span class="muted small">朝 ${km(l.start)}km → 夜 ${km(l.end)}km</span></span><b>${km(dist(l), 1)} km</b></button>`).join("") || `<p class="muted">まだ記録がありません。</p>`);
      return h;
    }
    const since = sinceOil(), rem = oilRemaining(), lo = lastOil();
    h += card("オイル交換", "💧", rem != null ? `<div class="minis">${mini("交換してから", km(since), "km")}${mini("次の交換まで", `<span class="${rem < 0 ? "r" : rem < 500 ? "or" : "g"}">${km(rem)}</span>`, "km")}</div>${lo ? `<p class="muted small">前回：${md(lo.date)}（${km(lo.odometer)}km）・${km(oilInterval())}kmごと</p>` : ""}` : `<p class="muted small">オイル交換を記録すると、次の交換までの残り距離が分かります。</p>`);
    h += `<button class="btn primary" data-act="modal" data-type="maintEdit">＋ 整備・修理を記録</button>`;
    const list = [...F().maints].sort((a, b) => (a.date < b.date ? 1 : -1));
    h += card("整備・修理の記録", "🔧", list.map((m) => { const t = mtype(m.type); return `<button class="row-btn" data-act="modal" data-type="maintEdit" data-id="${m.id}"><span class="tile sm" style="background:${ACC}">${t[2]}</span><span class="grow"><b>${t[1]}</b><br><span class="muted small">${md(m.date)}・${km(m.odometer)}km${m.shop ? "・" + esc(m.shop) : ""}${m.memo ? "<br>" + esc(m.memo) : ""}</span></span><b>${m.cost > 0 ? yen(m.cost) : "—"}</b></button>`; }).join("") || `<p class="muted">オイル交換・タイヤ・バッテリー・修理などを記録できます。</p>`);
    return h;
  }

  function monthNav(act, label) { return `<div class="monthnav"><button class="iconbtn" data-act="${act}" data-v="-1" aria-label="前へ">‹</button><b>${label}</b><button class="iconbtn" data-act="${act}" data-v="1" aria-label="次へ">›</button></div>`; }
  function viewMoney() {
    const u = ui(), y = u.month.getFullYear(), m = u.month.getMonth(), [a, b] = monthRange(y, m), s = summary(a, b), f = F();
    let h = monthNav("fuelMonth", `${y}年${m + 1}月`) + card("", "", `<div class="minis">${mini("売上", yen(s.income))}${mini("経費", yen(s.expense))}${mini("利益", yen(s.profit), "", s.profit >= 0 ? "g" : "r")}</div>`);
    h += `<div class="seg"><button class="${u.moneySeg === "income" ? "on" : ""}" data-act="fuelSeg" data-k="moneySeg" data-v="income">売上</button><button class="${u.moneySeg === "expense" ? "on" : ""}" data-act="fuelSeg" data-k="moneySeg" data-v="expense">経費</button></div>`;
    const inR = (x) => x.date >= a && x.date <= b;
    if (u.moneySeg === "income") {
      const list = f.incomes.filter(inR).sort((x, z) => (x.date < z.date ? 1 : -1));
      h += `<button class="btn primary" data-act="modal" data-type="incomeEdit">＋ 売上を記録</button>`;
      const byP = Object.entries(s.byPlatform).sort((x, z) => z[1] - x[1]);
      if (byP.length) h += card("サービス別", "📊", byP.map(([k, v]) => `<div class="li"><span class="grow">${esc(k)}</span><b>${yen(v)}</b></div>`).join(""));
      h += card("売上の記録", "¥", list.map((r) => `<button class="row-btn" data-act="modal" data-type="incomeEdit" data-id="${r.id}"><span class="grow"><b>${esc(r.platform)}</b><br><span class="muted small">${md(r.date)}${r.deliveries ? "・" + r.deliveries + "件" : ""}${r.memo ? "・" + esc(r.memo) : ""}</span></span><b>${yen(r.amount)}</b></button>`).join("") || `<p class="muted">この月の売上はありません。</p>`);
    } else {
      const list = f.expenses.filter(inR).sort((x, z) => (x.date < z.date ? 1 : -1));
      h += `<div class="row2"><button class="btn primary" data-act="modal" data-type="expenseEdit">＋ 経費・レシート</button><button class="btn" data-act="modal" data-type="fuelGuide">❓ これは何費？</button></div>`;
      const byC = TAX.map((c) => [c, sum(list.filter((x) => x.categoryId === c.id).map((x) => x.amount))]).filter((x) => x[1] > 0).sort((x, z) => z[1] - x[1]);
      if (byC.length) h += card("カテゴリ別", "📊", byC.map(([c, v]) => `<div class="li"><span class="grow">${c.icon} ${esc(c.label)}</span><b>${yen(v)}</b></div>`).join(""));
      h += card("経費の記録", "🧾", list.map((r) => { const c = cat(r.categoryId); return `<button class="row-btn" data-act="modal" data-type="expenseEdit" data-id="${r.id}"><span class="tile sm" style="background:${ACC}">${c.icon}</span><span class="grow"><b>${esc(r.item || c.label)}</b><br><span class="muted small">${md(r.date)}・${c.account}${r.payee ? "・" + esc(r.payee) : ""}</span></span><b>${yen(r.amount)}</b></button>`; }).join("") || `<p class="muted">この月の経費はありません。レシートを撮ると金額・日付・カテゴリを自動で入れます。</p>`);
    }
    return h;
  }

  function hbars(entries, total, color) { return entries.map(([k, v]) => `<div class="hbar"><span>${esc(k)}</span><b>${yen(v)}<small class="muted"> ${total > 0 ? Math.round((v / total) * 100) : 0}%</small></b><i style="--w:${total > 0 ? (v / total) * 100 : 0}%;--c:${color}"></i></div>`).join(""); }
  function viewReport() {
    const u = ui(), y = u.rDate.getFullYear(), m = u.rDate.getMonth(), isY = u.rMode === "year";
    const [a, b] = isY ? yearRange(y) : monthRange(y, m), s = summary(a, b);
    let h = `<div class="seg"><button class="${!isY ? "on" : ""}" data-act="fuelSeg" data-k="rMode" data-v="month">月</button><button class="${isY ? "on" : ""}" data-act="fuelSeg" data-k="rMode" data-v="year">年（確定申告）</button></div>`;
    h += monthNav("fuelRep", isY ? `${y}年` : `${y}年${m + 1}月`);
    h += `<div class="row2"><button class="btn primary" data-act="modal" data-type="fuelCompare">⇄ 過去と比較</button><button class="btn" data-act="modal" data-type="fuelExport">📤 CSVを書き出す</button></div>`;
    h += card("収支", "¥", `<div class="minis">${mini("売上", yen(s.income))}${mini("経費", yen(s.expense))}${mini("利益", yen(s.profit), "", s.profit >= 0 ? "g" : "r")}</div>${s.deliveries ? `<p class="muted small">配達件数 ${s.deliveries}件・1件あたり ${yen(s.income / s.deliveries)}</p>` : ""}`);
    const byP = Object.entries(s.byPlatform).sort((x, z) => z[1] - x[1]);
    h += card("サービス別の売上", "📊", byP.length ? hbars(byP, s.income, ACC) : `<p class="muted">売上の記録がありません。</p>`);
    const byC = Object.entries(s.byCat).sort((x, z) => z[1] - x[1]);
    h += card("何にいくら使ったか", "🧾", byC.length ? hbars(byC, s.expense, "#7c4ddb") : `<p class="muted">経費の記録がありません。</p>`);
    h += card("走行・燃費", "🚗", `<div class="minis">${mini("走行距離", km(s.distance), "km")}${mini("平均燃費", s.kmpl != null ? km(s.kmpl, 1) : "—", "km/L")}${mini("ガソリン代", yen(s.fuelCost))}${mini("1日平均", s.perDay != null ? km(s.perDay, 1) : "—", "km")}${mini("平均単価", s.unit != null ? km(s.unit, 1) : "—", "円/L")}${mini("1kmあたり売上", s.perKm != null ? km(s.perKm, 1) : "—", "円")}</div>`);
    if (!isY) {
      const rows = [];
      for (let i = 5; i >= 0; i--) { const d = new Date(y, m - i, 1), [x, z] = monthRange(d.getFullYear(), d.getMonth()), ss = summary(x, z); rows.push({ label: `${d.getMonth() + 1}月`, inc: ss.income, exp: ss.expense }); }
      h += card("6か月の推移", "📈", Chart.line({ series: [{ name: "売上", color: ACC, points: rows.map((r, i) => ({ x: i, y: r.inc, tip: `${r.label} 売上 ${yen(r.inc)}` })) }, { name: "経費", color: "#888", points: rows.map((r, i) => ({ x: i, y: r.exp, tip: `${r.label} 経費 ${yen(r.exp)}` })) }],
        xMin: 0, xMax: 5, yMin: 0, xTicks: rows.map((r, i) => ({ v: i, label: r.label })) }));
    } else {
      const rows = ACCOUNTS.map((k) => [k, s.byAccount[k] || 0]).filter((x) => x[1] > 0);
      h += card("確定申告用 勘定科目別の合計", "📄", (rows.map(([k, v]) => `<div class="li"><span class="grow">${k}</span><b>${yen(v)}</b></div>`).join("") || `<p class="muted">この年の経費はありません。</p>`) + `<div class="li"><b class="grow">経費合計</b><b>${yen(s.expense)}</b></div>`);
    }
    h += `<p class="muted small">カテゴリは記帳の目安です。確定申告の最終判断は税務署・税理士に確認してください。</p>`;
    return h;
  }

  /* ---------- 入力シート ---------- */
  const tagChips = (tags, sel) => `<div class="chips">${tags.map((t) => `<label class="chip"><input type="checkbox" name="tags" value="${esc(t)}" ${sel.includes(t) ? "checked" : ""}>${esc(t)}</label>`).join("")}</div>`;
  const catSelect = (cid, item) => { const c = cat(cid), items = c.items.includes(item) || !item ? c.items : [...c.items, item]; return `<label>カテゴリ<select name="categoryId" data-fcat>${TAX.map((x) => `<option value="${x.id}" ${x.id === c.id ? "selected" : ""}>${x.icon} ${esc(x.label)}（${x.account}）</option>`).join("")}</select></label><label>内訳<select name="item">${items.map((x) => `<option ${x === item ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></label>`; };
  const receiptBox = (act) => `<div class="note span2">🧾 レシートの写真から自動入力<div class="row2" style="margin-top:6px"><label class="btn filebtn">🖼 写真を選ぶ<input type="file" accept="image/*" data-act="${act}" hidden></label><label class="btn filebtn">📷 撮影<input type="file" accept="image/*" capture="environment" data-act="${act}" hidden></label></div>${S.modal && S.modal.status ? `<p class="small">${esc(S.modal.status)}</p>` : `<p class="muted small">写真はこのブラウザの中で読み取り、保存しません。読み取った内容は保存前に直せます。</p>`}</div>`;

  function fuelEdit(m) {
    const s = ST(), r0 = m.id ? F().fuels.find((x) => x.id === m.id) : null, p = m.prefill || {};
    const r = { date: new Date().toISOString(), liters: "", totalPrice: "", odometer: "", gaugeBefore: 3, gaugeAfter: s.gaugeSegments, isFull: true, tags: [], station: "", memo: "", ...(r0 || {}), ...p };
    const per = s.gaugeSegments > 0 ? s.tankCapacity / s.gaugeSegments : 0;
    const gopt = (v) => Array.from({ length: s.gaugeSegments + 1 }, (_, i) => `<option value="${i}" ${+v === i ? "selected" : ""}>${i} / ${s.gaugeSegments}</option>`).join("");
    return sheet(r0 ? "給油を編集" : "給油を記録", `<form data-form="fuelEdit" data-id="${r0 ? r0.id : ""}" class="grid2">
      ${receiptBox("fuelReceipt")}
      <label class="span2">日時<input type="datetime-local" name="date" value="${localDT(r.date)}" required></label>
      <label>給油量（L）<input type="number" name="liters" step="0.01" min="0" inputmode="decimal" value="${esc(r.liters)}"></label>
      <label>金額（円）<input type="number" name="totalPrice" min="0" inputmode="numeric" value="${esc(r.totalPrice)}"></label>
      <label class="span2">メーター（ODO・km）<input type="number" name="odometer" min="0" step="0.1" inputmode="decimal" value="${esc(r.odometer)}" placeholder="${currentOdo() > 0 ? "前回 " + km(currentOdo()) : ""}"></label>
      <label>給油前の残りメモリー<select name="gaugeBefore">${gopt(r.gaugeBefore)}</select></label>
      <label>給油後のメモリー<select name="gaugeAfter">${gopt(r.gaugeAfter)}</select></label>
      <label class="check-l span2"><input type="checkbox" name="isFull" ${r.isFull ? "checked" : ""}> 満タンにした</label>
      <p class="muted small span2">1メモリー＝約${km(per, 1)}L。例：残り3メモリーから満タン → 前回の給油後から「使ったメモリー数 × 1メモリーの量」で燃費を計算します。</p>
      <fieldset class="span2"><legend>走り方（あてはまるものにチェック）</legend>${tagChips(s.fuelTags, r.tags || [])}</fieldset>
      <label>スタンド名<input name="station" value="${esc(r.station)}"></label>
      <label>メモ<input name="memo" value="${esc(r.memo)}"></label>
      <label class="check-l span2"><input type="checkbox" name="addExpense" ${!r0 || hasLinked("fuel", r0.id) ? "checked" : ""}> 経費（車両費・燃料代）にも記録</label>
      <button class="btn primary big span2" type="submit">保存</button>
      ${r0 ? `<button class="btn danger span2" type="button" data-act="fuelDel" data-kind="fuels" data-id="${r0.id}">この記録を削除</button>` : ""}</form>`);
  }
  function maintEdit(m) {
    const r0 = m.id ? F().maints.find((x) => x.id === m.id) : null;
    const r = r0 || { type: "oil", date: todayStr(), odometer: currentOdo() || "", cost: "", shop: "", memo: "", nextIntervalKm: ST().oilIntervalKm };
    const linked = r0 ? F().expenses.find((x) => x.source === "maint" && x.sourceId === r0.id) : null, [dc, di] = linked ? [linked.categoryId, linked.item] : mDefaultExpense(r.type);
    return sheet(r0 ? "整備を編集" : "整備・修理を記録", `<form data-form="maintEdit" data-id="${r0 ? r0.id : ""}" class="grid2">
      <label>種類<select name="type">${MTYPES.map(([k, l, ic]) => `<option value="${k}" ${r.type === k ? "selected" : ""}>${ic} ${l}</option>`).join("")}</select></label>
      <label>日付<input type="date" name="date" value="${esc(r.date)}" required></label>
      <label>メーター（ODO・km）<input type="number" name="odometer" min="0" step="0.1" inputmode="decimal" value="${esc(r.odometer)}"></label>
      <label>費用（円）<input type="number" name="cost" min="0" inputmode="numeric" value="${esc(r.cost)}"></label>
      <label>お店<input name="shop" value="${esc(r.shop)}"></label>
      <label>次のオイル交換まで（km）<input type="number" name="nextIntervalKm" min="0" inputmode="numeric" value="${esc(r.nextIntervalKm || ST().oilIntervalKm)}"></label>
      <label class="span2">メモ（交換した部品・修理内容など）<input name="memo" value="${esc(r.memo)}"></label>
      <label class="check-l span2"><input type="checkbox" name="addExpense" ${!r0 || linked ? "checked" : ""}> 経費にも記録</label>
      ${catSelect(dc, di)}
      <button class="btn primary big span2" type="submit">保存</button>
      ${r0 ? `<button class="btn danger span2" type="button" data-act="fuelDel" data-kind="maints" data-id="${r0.id}">この記録を削除</button>` : ""}</form>`);
  }
  function dailyEdit(m) {
    const r0 = m.id ? F().daily.find((x) => x.id === m.id) : null, r = r0 || { date: todayStr(), start: currentOdo() || "", end: "", memo: "" };
    return sheet("1日の走行距離", `<form data-form="dailyEdit" data-id="${r0 ? r0.id : ""}" class="grid2">
      <label class="span2">日付<input type="date" name="date" value="${esc(r.date)}" required></label>
      <label>朝・運転前（km）<input type="number" name="start" min="0" step="0.1" inputmode="decimal" value="${esc(r.start)}"></label>
      <label>夜・運転後（km）<input type="number" name="end" min="0" step="0.1" inputmode="decimal" value="${esc(r.end)}"></label>
      <label class="span2">メモ<input name="memo" value="${esc(r.memo)}"></label>
      <button class="btn primary big span2" type="submit">保存</button>
      ${r0 ? `<button class="btn danger span2" type="button" data-act="fuelDel" data-kind="daily" data-id="${r0.id}">この記録を削除</button>` : ""}</form>`);
  }
  function incomeEdit(m) {
    const r0 = m.id ? F().incomes.find((x) => x.id === m.id) : null, r = r0 || { date: todayStr(), platform: ST().platforms[0] || "その他", amount: "", deliveries: "", memo: "" };
    const pl = ST().platforms.includes(r.platform) ? ST().platforms : [...ST().platforms, r.platform];
    return sheet(r0 ? "売上を編集" : "売上を記録", `<form data-form="incomeEdit" data-id="${r0 ? r0.id : ""}" class="grid2">
      <label>サービス<select name="platform">${opt(pl, r.platform)}</select></label>
      <label>日付<input type="date" name="date" value="${esc(r.date)}" required></label>
      <label>金額（円）<input type="number" name="amount" min="0" inputmode="numeric" value="${esc(r.amount)}" required></label>
      <label>件数（任意）<input type="number" name="deliveries" min="0" inputmode="numeric" value="${esc(r.deliveries || "")}"></label>
      <label class="span2">メモ<input name="memo" value="${esc(r.memo)}"></label>
      <p class="muted small span2">サービスの種類は「⚙️ 車の設定」で追加・変更できます。</p>
      <button class="btn primary big span2" type="submit">保存</button>
      ${r0 ? `<button class="btn danger span2" type="button" data-act="fuelDel" data-kind="incomes" data-id="${r0.id}">この記録を削除</button>` : ""}</form>`);
  }
  function expenseEdit(m) {
    const r0 = m.id ? F().expenses.find((x) => x.id === m.id) : null, p = m.prefill || {};
    const r = { date: todayStr(), amount: "", categoryId: "sharyo", item: TAX[0].items[0], payee: "", memo: "", ...(r0 || {}), ...p };
    const c = cat(r.categoryId);
    return sheet(r0 ? "経費を編集" : "経費を記録", `<form data-form="expenseEdit" data-id="${r0 ? r0.id : ""}" class="grid2">
      ${receiptBox("expenseReceipt")}
      <label>日付<input type="date" name="date" value="${esc(r.date)}" required></label>
      <label>金額（円）<input type="number" name="amount" min="0" inputmode="numeric" value="${esc(r.amount)}" required></label>
      <label>支払先（お店など）<input name="payee" value="${esc(r.payee)}"></label>
      <label>メモ<input name="memo" value="${esc(r.memo)}"></label>
      ${catSelect(r.categoryId, r.item)}
      <p class="muted small span2" data-fnote>${esc(c.note)}</p>
      ${r0 && r0.source ? `<p class="note span2">この経費は${r0.source === "fuel" ? "給油" : "整備"}の記録と連動しています。</p>` : ""}
      <button class="btn primary big span2" type="submit">保存</button>
      ${r0 ? `<button class="btn danger span2" type="button" data-act="fuelDel" data-kind="expenses" data-id="${r0.id}">この記録を削除</button>` : ""}</form>`);
  }
  const SLOTS = [
    ["total", "① 総走行距離（ODO）", "車を乗り始めてからの距離の計算に使います。", false],
    ["oil", "② オイル交換してからの距離", "オイル交換でリセットしたトリップ（TRIP A など）。", true],
    ["fuel", "③ 最後に給油してからの距離", "給油でリセットしたトリップ（TRIP B など）。", true],
    ["morning", "④ 朝・運転前のメーター", "その日最初に運転する前のODO。", false],
    ["night", "⑤ 夜・運転後のメーター", "その日最後に運転した後のODO。", false]
  ];
  function expectedFor(slot, vals) {
    const odo = currentOdo() > 0 ? currentOdo() : null;
    return slot === "oil" ? sinceOil() : slot === "fuel" ? sinceFuel() : slot === "night" ? (vals.morning ?? odo) : odo;
  }
  function meterModal(m) {
    m.values ||= {}; m.info ||= {};
    if (!m.date) { m.date = todayStr(); const l = F().daily.find((x) => x.date === m.date); if (l) { if (l.start > 0) m.values.morning = l.start; if (l.end > l.start) m.values.night = l.end; } }
    const v = m.values;
    const res = [];
    if (v.total != null) res.push(`乗り始めてから <b>${km(Math.max(0, v.total - ST().startOdometer))} km</b>`);
    if (v.oil != null) res.push(`オイル交換まで残り <b>${km(oilInterval() - v.oil)} km</b>`);
    if (v.fuel != null) res.push(`給油してから <b>${km(v.fuel, 1)} km</b>`);
    if (v.morning != null && v.night != null) res.push(v.night >= v.morning ? `この日の走行距離 <b class="g">${km(v.night - v.morning, 1)} km</b>` : `<span class="r">夜の数字が朝より小さいです</span>`);
    return sheet("メーター読み取り", `<form data-form="fuelMeter" class="grid2">
      <label class="span2">日付<input type="date" name="date" value="${esc(m.date)}" data-fmdate></label>
      <p class="muted small span2">必要なものだけ読み取ればOKです。メーターが大きく写るように撮ると正確になります。写真はこのブラウザの中で読み取り、保存も送信もしません。</p>
      ${SLOTS.map(([k, t, hint, trip]) => {
        const info = m.info[k] || {}, e = expectedFor(k, v);
        return `<fieldset class="span2"><legend><b>${t}</b></legend><p class="muted small">${hint}</p>
          <div class="row2"><label class="btn filebtn">🖼 写真から<input type="file" accept="image/*" data-act="fuelMeterImg" data-slot="${k}" hidden></label><label class="btn filebtn">📷 撮影<input type="file" accept="image/*" capture="environment" data-act="fuelMeterImg" data-slot="${k}" hidden></label></div>
          ${info.thumb ? `<img src="${info.thumb}" alt="読み取った写真" class="mthumb">` : ""}
          ${info.status ? `<p class="small">${esc(info.status)}</p>` : ""}
          ${info.unsure ? `<p class="alert yellow">読み取りに自信がありません。写真と見比べて、違ったら候補から選ぶか直接直してください。</p>` : ""}
          ${v[k] != null && !trip && e && v[k] < e - 1 ? `<p class="alert yellow">これまでの記録（${km(e)}km）より小さい数字です。確認してください。</p>` : ""}
          ${(info.cands || []).length > 1 ? `<div class="chips"><span class="muted small">ほかの候補：</span>${info.cands.map((c) => `<button type="button" class="chip" data-act="fuelMeterPick" data-slot="${k}" data-v="${c}">${km(c, trip ? 1 : 0)}</button>`).join("")}</div>` : ""}
          <label>読み取った距離（km）<input type="number" step="0.1" min="0" inputmode="decimal" name="${k}" data-fmv="${k}" value="${v[k] ?? ""}"></label></fieldset>`;
      }).join("")}
      <div class="card span2"><b>この内容で記録されます</b>${res.length ? res.map((x) => `<div class="li">${x}</div>`).join("") : `<p class="muted">まだ何も読み取っていません。</p>`}</div>
      <button class="btn primary big span2" type="submit">保存</button></form>`);
  }
  function settingsModal() {
    const s = ST();
    return sheet("車と記録の設定", `<form data-form="fuelSettings" class="grid2">
      <label class="span2">車の名前<input name="vehicleName" value="${esc(s.vehicleName)}"></label>
      <label>タンク容量（L）<input type="number" name="tankCapacity" min="1" step="0.1" inputmode="decimal" value="${s.tankCapacity}"></label>
      <label>燃料メーターのメモリー数<input type="number" name="gaugeSegments" min="2" max="20" inputmode="numeric" value="${s.gaugeSegments}"></label>
      <label class="span2">燃費の計算方法<select name="calcMethod"><option value="gauge" ${s.calcMethod !== "full" ? "selected" : ""}>メモリー計算（残りメモリーから給油しても計算）</option><option value="full" ${s.calcMethod === "full" ? "selected" : ""}>満タン法（満タン〜満タンの給油量で計算）</option></select></label>
      <label>乗り始めたときのメーター（km）<input type="number" name="startOdometer" min="0" inputmode="decimal" value="${s.startOdometer}"></label>
      <label>オイル交換の目安（km）<input type="number" name="oilIntervalKm" min="100" inputmode="numeric" value="${s.oilIntervalKm}"></label>
      <label class="span2">売上のサービス（1行に1つ）<textarea name="platforms" rows="5">${esc(s.platforms.join("\n"))}</textarea></label>
      <label class="span2">給油の走り方チェック項目（1行に1つ）<textarea name="fuelTags" rows="4">${esc(s.fuelTags.join("\n"))}</textarea></label>
      <button class="btn primary big span2" type="submit">保存</button>
      <button class="btn danger span2" type="button" data-act="fuelWipe">燃費・経費の記録をすべて削除</button>
      <p class="muted small span2">カテゴリは記帳の目安です。どの科目にするか、どこまで経費にできるか（家事按分など）は人によって違います。確定申告の前に、税務署や税理士に確認してください。</p></form>`);
  }
  function guideModal() {
    return sheet("これは何費？", `<input type="search" class="search" placeholder="例：駐車場、ガソリン、保冷バッグ" data-fguide aria-label="経費を検索">
      <p class="muted small">このカテゴリは記帳の目安です。実際の扱いは、税務署や税理士に確認してください。</p>
      ${TAX.map((c) => `<section class="card" data-gcard data-text="${esc((c.label + c.note + c.items.join("")).toLowerCase())}"><div class="ct"><span>${c.icon} ${esc(c.label)}（${c.account}）</span></div><p class="muted small">${esc(c.note)}</p>${c.items.map((i) => `<div class="li" data-gitem data-text="${esc(i.toLowerCase())}">${esc(i)}</div>`).join("")}</section>`).join("")}`);
  }
  const PRESETS = [["mm", "今月と先月"], ["my", "今月と去年の同じ月"], ["yy", "今年と去年"], ["custom", "期間を選ぶ"]];
  function compareModal(m) {
    m.preset ||= "mm";
    const t = new Date(), y = t.getFullYear(), mo = t.getMonth();
    let A, B, la, lb;
    if (m.preset === "my") { A = monthRange(y, mo); B = monthRange(y - 1, mo); la = `${y}年${mo + 1}月`; lb = `${y - 1}年${mo + 1}月`; }
    else if (m.preset === "yy") { A = yearRange(y); B = yearRange(y - 1); la = `${y}年`; lb = `${y - 1}年`; }
    else if (m.preset === "custom") { A = m.A || monthRange(y, mo); B = m.B || monthRange(y, mo - 1); la = "期間A"; lb = "期間B"; }
    else { const p = new Date(y, mo - 1, 1); A = monthRange(y, mo); B = monthRange(p.getFullYear(), p.getMonth()); la = `${mo + 1}月`; lb = `${p.getMonth() + 1}月`; }
    const a = summary(...A), b = summary(...B);
    const row = (t, va, vb, fmt, good = true) => {
      const d = (va || 0) - (vb || 0), up = d > 0, cls = d === 0 ? "muted" : up === good ? "g" : "r";
      const pc = vb ? ` (${up ? "+" : ""}${((d / Math.abs(vb)) * 100).toFixed(1)}%)` : "";
      return `<div class="li"><span class="grow"><b>${t}</b><br><span class="small">${fmt(va)} <span class="muted">← ${fmt(vb)}</span></span></span><b class="${cls} small">${d === 0 ? "±0" : (up ? "↗ +" : "↘ −") + fmt(Math.abs(d)).replace("¥", "¥")}${pc}</b></div>`;
    };
    const Y = (v) => yen(v), K = (dg, u) => (v) => (v ? km(v, dg) + u : "—");
    const plats = [...new Set([...Object.keys(a.byPlatform), ...Object.keys(b.byPlatform)])], cats = [...new Set([...Object.keys(a.byCat), ...Object.keys(b.byCat)])];
    return sheet("過去と比較", `<div class="chips">${PRESETS.map(([k, l]) => `<button type="button" class="chip ${m.preset === k ? "on" : ""}" data-act="fuelPreset" data-v="${k}">${l}</button>`).join("")}</div>
      ${m.preset === "custom" ? `<form data-form="fuelCompare" class="grid2"><label>期間A 開始<input type="date" name="a1" value="${A[0]}"></label><label>期間A 終了<input type="date" name="a2" value="${A[1]}"></label><label>期間B 開始<input type="date" name="b1" value="${B[0]}"></label><label>期間B 終了<input type="date" name="b2" value="${B[1]}"></label><button class="btn span2" type="submit">この期間で比べる</button></form>` : ""}
      ${card(`${la} と ${lb}`, "⇄", Chart.bar({ items: [["売上", a.income, b.income], ["経費", a.expense, b.expense], ["利益", a.profit, b.profit]].flatMap(([l, x, z]) => [{ label: l + "・今", value: Math.max(0, x), color: ACC, tip: `${la} ${l} ${yen(x)}` }, { label: l + "・前", value: Math.max(0, z), color: "#9a9a9a", tip: `${lb} ${l} ${yen(z)}` }]) }) + `<div class="legend"><span><i style="background:${ACC}"></i>${la}</span><span><i style="background:#9a9a9a"></i>${lb}</span></div>`)}
      ${card("お金", "¥", row("売上", a.income, b.income, Y) + row("経費", a.expense, b.expense, Y, false) + row("利益", a.profit, b.profit, Y) + row("配達件数", a.deliveries, b.deliveries, K(0, "件")) + row("ガソリン代", a.fuelCost, b.fuelCost, Y, false))}
      ${card("走行・燃費", "🚗", row("走行距離", a.distance, b.distance, K(0, "km")) + row("平均燃費", a.kmpl, b.kmpl, K(1, "km/L")) + row("1日平均走行", a.perDay, b.perDay, K(1, "km")) + row("ガソリン単価", a.unit, b.unit, K(1, "円/L"), false) + row("1kmあたり売上", a.perKm, b.perKm, K(1, "円")))}
      ${plats.length ? card("サービス別の売上", "📊", plats.map((p) => row(esc(p), a.byPlatform[p] || 0, b.byPlatform[p] || 0, Y)).join("")) : ""}
      ${cats.length ? card("カテゴリ別の経費", "🧾", cats.map((c) => row(esc(c), a.byCat[c] || 0, b.byCat[c] || 0, Y, false)).join("")) : ""}`);
  }
  function exportModal(m) {
    m.year ||= new Date().getFullYear();
    const ys = [...new Set([new Date().getFullYear(), ...F().expenses.map((x) => +x.date.slice(0, 4)), ...F().incomes.map((x) => +x.date.slice(0, 4))])].sort((a, b) => b - a);
    const kinds = [["expenses", "経費（確定申告用）", "日付・勘定科目・内訳・金額"], ["accounts", "勘定科目別の合計", "確定申告の科目ごとの年間合計"], ["incomes", "売上", "日付・サービス・金額・件数"], ["fuels", "給油・燃費", "給油量・金額・メモリー・燃費"], ["maints", "整備記録", "オイル交換・修理など"], ["daily", "1日の走行距離", "朝・夜のメーターと距離"]];
    return sheet("CSVを書き出す", `<label>書き出す年<select data-fyear>${ys.map((y) => `<option value="${y}" ${y === m.year ? "selected" : ""}>${y}年</option>`).join("")}</select></label>
      <p class="muted small">ExcelやNumbers、Googleスプレッドシートで開けます。</p>
      ${kinds.map(([k, t, d]) => `<button class="row-btn" data-act="fuelCsv" data-kind="${k}"><span class="tile sm" style="background:${ACC}">📄</span><span class="grow"><b>${t}</b><br><span class="muted small">${d}</span></span><span class="chev">↓</span></button>`).join("")}`);
  }
  const csvEsc = (v) => { const t = String(v ?? "").replace(/"/g, '""'); return /[",\n]/.test(t) ? `"${t}"` : t; };
  const csv = (head, rows) => "﻿" + [head, ...rows].map((r) => r.map(csvEsc).join(",")).join("\r\n");
  const slash = (s) => String(s).slice(0, 10).replace(/-/g, "/");
  function makeCsv(kind, y) {
    const f = F(), inY = (d) => String(d).startsWith(String(y)), fy = (x) => ymdOf(x.date).startsWith(String(y));
    if (kind === "expenses") return csv(["日付", "勘定科目", "カテゴリ", "内訳", "支払先", "金額", "メモ"], f.expenses.filter((x) => inY(x.date)).sort((a, b) => (a.date < b.date ? -1 : 1)).map((x) => { const c = cat(x.categoryId); return [slash(x.date), c.account, c.label, x.item, x.payee, x.amount, x.memo]; }));
    if (kind === "accounts") { const s = summary(...yearRange(y)); return csv(["勘定科目", "金額"], [...ACCOUNTS.filter((k) => s.byAccount[k]).map((k) => [k, s.byAccount[k]]), ["経費合計", s.expense], ["売上合計", s.income], ["差引（売上−経費）", s.profit]]); }
    if (kind === "incomes") return csv(["日付", "サービス", "金額", "件数", "メモ"], f.incomes.filter((x) => inY(x.date)).sort((a, b) => (a.date < b.date ? -1 : 1)).map((x) => [slash(x.date), x.platform, x.amount, x.deliveries || 0, x.memo]));
    if (kind === "fuels") { const ef = new Map(efficiencies().map((e) => [e.rec.id, e])); return csv(["日時", "給油量(L)", "金額", "単価(円/L)", "ODO(km)", "給油前メモリー", "給油後メモリー", "満タン", "走り方", "前回からの距離(km)", "燃費(km/L)", "スタンド", "メモ"], sortedFuels().filter(fy).map((x) => { const e = ef.get(x.id); return [Fmt.csv(x.date), x.liters.toFixed(2), x.totalPrice, x.liters > 0 ? (x.totalPrice / x.liters).toFixed(1) : "", x.odometer, x.gaugeBefore, x.gaugeAfter, x.isFull ? "はい" : "いいえ", (x.tags || []).join("・"), e ? Math.round(e.dist) : "", e ? e.kmpl.toFixed(1) : "", x.station, x.memo]; })); }
    if (kind === "maints") return csv(["日付", "種類", "ODO(km)", "費用", "お店", "メモ"], f.maints.filter((x) => inY(x.date)).sort((a, b) => (a.date < b.date ? -1 : 1)).map((x) => [slash(x.date), mtype(x.type)[1], x.odometer, x.cost, x.shop, x.memo]));
    return csv(["日付", "朝のメーター(km)", "夜のメーター(km)", "走行距離(km)", "メモ"], f.daily.filter((x) => inY(x.date)).sort((a, b) => (a.date < b.date ? -1 : 1)).map((x) => [slash(x.date), x.start, x.end, dist(x).toFixed(1), x.memo]));
  }

  /* ---------- 登録 ---------- */
  Object.assign(MODALS, { fuelEdit, maintEdit, dailyEdit, incomeEdit, expenseEdit, fuelMeter: meterModal, fuelSettings: settingsModal, fuelGuide: guideModal, fuelCompare: compareModal, fuelExport: exportModal });
  Object.assign(ACT, {
    fuelSeg(el) { ui()[el.dataset.k] = el.dataset.v; render(); },
    fuelMonth(el) { const u = ui(); u.month = new Date(u.month.getFullYear(), u.month.getMonth() + +el.dataset.v, 1); render(); },
    fuelRep(el) { const u = ui(), v = +el.dataset.v; u.rDate = u.rMode === "year" ? new Date(u.rDate.getFullYear() + v, u.rDate.getMonth(), 1) : new Date(u.rDate.getFullYear(), u.rDate.getMonth() + v, 1); render(); },
    fuelPreset(el) { S.modal.preset = el.dataset.v; render(); },
    fuelMeterPick(el) { S.modal.values[el.dataset.slot] = +el.dataset.v; render(); },
    fuelCsv(el) { const y = (S.modal && S.modal.year) || new Date().getFullYear(), names = { expenses: "経費_確定申告用", accounts: "勘定科目別集計", incomes: "売上", fuels: "給油_燃費", maints: "整備記録", daily: "走行距離" }; download(`${names[el.dataset.kind]}_${y}.csv`, makeCsv(el.dataset.kind, y), "text/csv"); },
    async fuelDel(el) {
      if (!await askConfirm("この記録を削除しますか？")) return;
      const kind = el.dataset.kind, id = el.dataset.id; S.modal = null;
      mutate((d) => {
        const f = d.fuel; f[kind] = f[kind].filter((x) => x.id !== id);
        if (kind === "fuels") f.expenses = f.expenses.filter((x) => !(x.source === "fuel" && x.sourceId === id));
        if (kind === "maints") f.expenses = f.expenses.filter((x) => !(x.source === "maint" && x.sourceId === id));
      });
      toast("削除しました");
    },
    async fuelWipe() {
      if (!await askConfirm("給油・整備・走行距離・売上・経費の記録をすべて削除しますか？設定は残ります。元に戻せません。")) return;
      S.modal = null; mutate((d) => { const s = d.fuel.settings; d.fuel = defaults(); d.fuel.settings = s; }); toast("削除しました");
    }
  });
  const fdate = (s) => (s ? new Date(s).toISOString() : new Date().toISOString());
  Object.assign(FORM, {
    fuelEdit(fd, form) {
      const id = form.dataset.id || uid(), old = F().fuels.find((x) => x.id === id);
      const r = { ...(old || {}), id, date: fdate(fd.get("date")), liters: numv(fd.get("liters")), totalPrice: Math.round(numv(fd.get("totalPrice"))), odometer: numv(fd.get("odometer")) || currentOdo(),
        gaugeBefore: +fd.get("gaugeBefore"), gaugeAfter: +fd.get("gaugeAfter"), isFull: !!fd.get("isFull"), tags: fd.getAll("tags"), station: fd.get("station") || "", memo: fd.get("memo") || "" };
      if (r.liters <= 0 && r.totalPrice <= 0) { toast("給油量か金額を入れてください"); return; }
      S.modal = null;
      mutate((d) => { upsert(d.fuel.fuels, r); linkExpense(d, "fuel", id, !!fd.get("addExpense"), { date: ymdOf(r.date), amount: r.totalPrice, categoryId: "sharyo", item: "配達業務用車両燃料代（ガソリン）", payee: r.station, memo: `給油 ${r.liters.toFixed(2)}L` }); });
      toast("保存しました");
    },
    maintEdit(fd, form) {
      const id = form.dataset.id || uid(), old = F().maints.find((x) => x.id === id);
      const r = { ...(old || {}), id, type: fd.get("type"), date: fd.get("date"), odometer: numv(fd.get("odometer")), cost: Math.round(numv(fd.get("cost"))), shop: fd.get("shop") || "", memo: fd.get("memo") || "", nextIntervalKm: numv(fd.get("nextIntervalKm")) || ST().oilIntervalKm };
      S.modal = null;
      mutate((d) => { upsert(d.fuel.maints, r); linkExpense(d, "maint", id, !!fd.get("addExpense"), { date: r.date, amount: r.cost, categoryId: fd.get("categoryId"), item: fd.get("item"), payee: r.shop, memo: mtype(r.type)[1] }); });
      toast("保存しました");
    },
    dailyEdit(fd, form) {
      const id = form.dataset.id || uid(), start = numv(fd.get("start")), end = numv(fd.get("end")), date = fd.get("date");
      if (end && end < start) { toast("夜のメーターが朝より小さいです"); return; }
      S.modal = null;
      mutate((d) => { const same = d.fuel.daily.find((x) => x.date === date && x.id !== id); if (same && !form.dataset.id) { same.start = start; same.end = Math.max(end, start); same.memo = fd.get("memo") || same.memo; } else upsert(d.fuel.daily, { id, date, start, end: Math.max(end, start), memo: fd.get("memo") || "" }); });
      toast("保存しました");
    },
    incomeEdit(fd, form) {
      const id = form.dataset.id || uid(), amount = Math.round(numv(fd.get("amount")));
      if (amount <= 0) { toast("金額を入れてください"); return; }
      S.modal = null; mutate((d) => upsert(d.fuel.incomes, { id, date: fd.get("date"), platform: fd.get("platform"), amount, deliveries: Math.round(numv(fd.get("deliveries"))), memo: fd.get("memo") || "" })); toast("保存しました");
    },
    expenseEdit(fd, form) {
      const id = form.dataset.id || uid(), old = F().expenses.find((x) => x.id === id), amount = Math.round(numv(fd.get("amount")));
      if (amount <= 0) { toast("金額を入れてください"); return; }
      S.modal = null; mutate((d) => upsert(d.fuel.expenses, { ...(old || {}), id, date: fd.get("date"), amount, categoryId: fd.get("categoryId"), item: fd.get("item"), payee: fd.get("payee") || "", memo: fd.get("memo") || "" })); toast("保存しました");
    },
    fuelMeter(fd) {
      const m = S.modal, v = {}; SLOTS.forEach(([k]) => { const x = fd.get(k); if (x !== "" && x != null && +x > 0) v[k] = +x; });
      const date = fd.get("date") || todayStr();
      if (!Object.keys(v).length) { toast("読み取った数字がありません"); return; }
      S.modal = null; void m;
      mutate((d) => {
        if (v.total != null || v.oil != null || v.fuel != null) d.fuel.meters.push({ id: uid(), date: new Date(date + "T" + Fmt.inputTime(new Date())).toISOString(), total: v.total ?? null, tripOil: v.oil ?? null, tripFuel: v.fuel ?? null });
        if (v.morning != null || v.night != null) {
          let l = d.fuel.daily.find((x) => x.date === date);
          if (!l) { l = { id: uid(), date, start: v.morning ?? v.night, end: v.night ?? v.morning, memo: "" }; d.fuel.daily.push(l); }
          else { if (v.morning != null) l.start = v.morning; if (v.night != null) l.end = v.night; }
          if (l.end < l.start) l.end = l.start;
        }
      });
      toast("保存しました");
    },
    fuelSettings(fd) {
      const lines2 = (k) => String(fd.get(k) || "").split("\n").map((x) => x.trim()).filter(Boolean);
      S.modal = null;
      mutate((d) => { d.fuel.settings = { ...d.fuel.settings, vehicleName: fd.get("vehicleName") || "配達車", tankCapacity: numv(fd.get("tankCapacity")) || 34, gaugeSegments: clamp(Math.round(numv(fd.get("gaugeSegments")) || 10), 2, 20), calcMethod: fd.get("calcMethod"), startOdometer: numv(fd.get("startOdometer")), oilIntervalKm: numv(fd.get("oilIntervalKm")) || 5000, platforms: lines2("platforms").length ? lines2("platforms") : defaults().settings.platforms, fuelTags: lines2("fuelTags") }; });
      toast("保存しました");
    },
    fuelCompare(fd) { S.modal.A = [fd.get("a1"), fd.get("a2")].sort(); S.modal.B = [fd.get("b1"), fd.get("b2")].sort(); render(); }
  });
  /** 開いているシートの入力内容を prefill に残す（再描画で消えないように） */
  function keepForm() { const form = $("#modal form"); if (!form || !S.modal) return; const fd = new FormData(form), p = S.modal.prefill || {}; for (const [k, v] of fd.entries()) if (k !== "tags") p[k] = v; p.tags = fd.getAll("tags"); p.isFull = !!fd.get("isFull"); S.modal.prefill = p; }
  async function receipt(el, kind) {
    const f = el.files[0]; if (!f) return;
    keepForm(); S.modal.status = "読み取りの準備中…"; render();
    try {
      const r = await readReceipt(f, (t) => { if (S.modal) { S.modal.status = t; const n = $("#modal .note p"); if (n) n.textContent = t; } });
      if (!S.modal) return;
      const p = S.modal.prefill;
      if (kind === "fuel") { if (r.date) p.date = new Date(`${r.date}T${r.time || "12:00"}`).toISOString(); if (r.total) p.totalPrice = r.total; if (r.liters) p.liters = r.liters; if (r.store && !p.station) p.station = r.store; }
      else { if (r.date) p.date = r.date; if (r.total) p.amount = r.total; if (r.store && !p.payee) p.payee = r.store; if (r.cat) { p.categoryId = r.cat; p.item = r.item; } }
      S.modal.status = r.total || r.date ? "読み取った内容を入力しました。違うところは直してください。" : "文字を読み取れませんでした。明るい場所で真上から撮ってください。";
      render();
    } catch (e) { if (S.modal) { S.modal.status = "読み取れませんでした（" + e.message + "）。手で入力してください。"; render(); } }
  }
  Object.assign(CHANGE, {
    fuelReceipt: (el) => receipt(el, "fuel"),
    expenseReceipt: (el) => receipt(el, "expense"),
    async fuelMeterImg(el) {
      const f = el.files[0]; if (!f) return; const k = el.dataset.slot, m = S.modal, trip = SLOTS.find((x) => x[0] === k)[3];
      m.info[k] = { status: "読み取りの準備中…" }; render();
      try {
        const r = await readMeter(f, trip, expectedFor(k, m.values), (t) => { m.info[k].status = t; if (S.modal === m) render(); });
        m.info[k] = { thumb: r.thumb, cands: r.cands, unsure: r.best != null && !r.sure, status: r.best == null ? "数字を読み取れませんでした。メーターが大きく写るように撮るか、下に入力してください。" : "" };
        if (r.best != null) m.values[k] = r.best;
      } catch (e) { m.info[k] = { status: "読み取れませんでした（" + e.message + "）。下に入力してください。" }; }
      if (S.modal === m) render();
    }
  });
  document.addEventListener("input", (ev) => {
    const el = ev.target;
    if (el.dataset && el.dataset.fmv && S.modal && S.modal.type === "fuelMeter") { const v = el.value; if (v === "" || !(+v > 0)) delete S.modal.values[el.dataset.fmv]; else S.modal.values[el.dataset.fmv] = +v; }
    if (el.matches && el.matches("[data-fguide]")) {
      const q = el.value.trim().toLowerCase();
      document.querySelectorAll("[data-gcard]").forEach((c) => { const items = c.querySelectorAll("[data-gitem]"); let any = !q || c.dataset.text.includes(q); items.forEach((i) => { const hit = q && i.dataset.text.includes(q); i.classList.toggle("hit", !!hit); if (hit) any = true; }); c.hidden = !any; });
    }
  });
  document.addEventListener("change", (ev) => {
    const el = ev.target;
    if (el.matches && el.matches("[data-fcat]")) {
      const c = cat(el.value), sel = el.form && el.form.querySelector('select[name="item"]');
      if (sel) sel.innerHTML = c.items.map((x) => `<option>${esc(x)}</option>`).join("");
      const note = el.form && el.form.querySelector("[data-fnote]"); if (note) note.textContent = c.note;
    }
    if (el.matches && el.matches("[data-fyear]") && S.modal) S.modal.year = +el.value;
    if (el.matches && el.matches("[data-fmdate]") && S.modal && S.modal.type === "fuelMeter") {
      S.modal.date = el.value; const l = F().daily.find((x) => x.date === el.value); delete S.modal.values.morning; delete S.modal.values.night;
      if (l) { if (l.start > 0) S.modal.values.morning = l.start; if (l.end > l.start) S.modal.values.night = l.end; } render();
    }
  });

  return { view, migrate, defaults };
})();
