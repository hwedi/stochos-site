(function () {
  "use strict";

  var D = window.STOCHOS || {};
  var NS = "http://www.w3.org/2000/svg";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- small helpers ---------- */
  function svgEl(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function htmlEl(tag, cls, text, parent) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  // seeded random numbers, so every drawing looks the same on every visit
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function pathFrom(points) {
    return points.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
  }

  /* ---------- theme ---------- */
  var root = document.documentElement;
  var themeBtn = document.getElementById("theme");
  function effectiveTheme() {
    var t = root.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = effectiveTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) { /* private mode: ignore */ }
    });
  }

  /* ---------- the coloured graph: four gas traces, then the estimate with its range ---------- */
  var hero = document.getElementById("gas-chart");
  if (hero) {
    var W = 760, H = 470, X0 = 36, X1 = 420, TOP = 70, BOT = 392;
    var svg = svgEl("svg", {
      viewBox: "0 0 " + W + " " + H, role: "img",
      "aria-label": "Illustration: four rising gas readings, then an estimate of remaining life shown as a point with a range around it."
    }, hero);

    // chart-paper grid
    for (var gx = 0; gx <= W; gx += 20) {
      svgEl("line", { x1: gx, y1: 0, x2: gx, y2: H, stroke: gx % 100 === 0 ? "var(--grid-major)" : "var(--grid)", "stroke-width": gx % 100 === 0 ? 1 : 0.6 }, svg);
    }
    for (var gy = 0; gy <= H; gy += 20) {
      svgEl("line", { x1: 0, y1: gy, x2: W, y2: gy, stroke: gy % 100 === 0 ? "var(--grid-major)" : "var(--grid)", "stroke-width": gy % 100 === 0 ? 1 : 0.6 }, svg);
    }

    // time axis for the readings
    svgEl("line", { x1: X0, y1: BOT + 12, x2: X1, y2: BOT + 12, stroke: "var(--ink)", "stroke-width": 1.4 }, svg);
    [0, 50, 100, 150, 200].forEach(function (d) {
      var x = X0 + (d / 210) * (X1 - X0);
      svgEl("line", { x1: x, y1: BOT + 12, x2: x, y2: BOT + 18, stroke: "var(--ink)", "stroke-width": 1.4 }, svg);
      var t = svgEl("text", { x: x, y: BOT + 34, "text-anchor": "middle", class: "chart-note" }, svg);
      t.textContent = d;
    });
    var ax = svgEl("text", { x: (X0 + X1) / 2, y: BOT + 58, "text-anchor": "middle", class: "chart-note" }, svg);
    ax.textContent = "days of readings";

    // the four traces
    var gases = [
      { name: "H2",   color: "var(--h2)",   a: 0.12, b: 0.36, seed: 11 },
      { name: "CO",   color: "var(--co)",   a: 0.16, b: 0.84, seed: 23 },
      { name: "C2H4", color: "var(--c2h4)", a: 0.10, b: 0.55, seed: 37 },
      { name: "C2H2", color: "var(--c2h2)", a: 0.05, b: 0.22, seed: 41 }
    ];
    var N = 110;
    gases.forEach(function (g, gi) {
      var r = rng(g.seed), wander = 0, pts = [];
      for (var i = 0; i < N; i++) {
        var t = i / (N - 1);
        wander = wander * 0.82 + (r() - 0.5) * 0.06;
        var v = g.a + (g.b - g.a) * Math.pow(t, 1.35) + wander * (0.6 + t);
        pts.push([X0 + t * (X1 - X0), BOT - Math.max(0.01, v) * (BOT - TOP)]);
      }
      var p = svgEl("path", { d: pathFrom(pts), class: "trace" + (reduceMotion ? "" : " draw"), pathLength: 1, stroke: g.color }, svg);
      if (!reduceMotion) p.style.animationDelay = (gi * 0.18) + "s";
      var last = pts[pts.length - 1];
      var lab = svgEl("text", { x: X1 + 8, y: last[1] + 5, class: "chart-label chart-late", fill: g.color }, svg);
      lab.textContent = g.name;
    });

    // "latest reading" line, then the estimate with its range
    var late = svgEl("g", { class: "chart-late" }, svg);
    svgEl("line", { x1: X1, y1: 44, x2: X1, y2: BOT + 12, stroke: "var(--ink)", "stroke-width": 1.2, "stroke-dasharray": "4 4" }, late);
    var tl = svgEl("text", { x: X1 - 6, y: 38, "text-anchor": "end", class: "chart-note" }, late);
    tl.textContent = "latest reading";

    var bx0 = 520, bx1 = 716, bm = 604;
    svgEl("rect", { x: bx0, y: 44, width: bx1 - bx0, height: BOT - 32, fill: "var(--ink)", opacity: 0.07 }, late);
    svgEl("line", { x1: bm, y1: 44, x2: bm, y2: BOT + 12, stroke: "var(--ink)", "stroke-width": 1.2 }, late);
    svgEl("circle", { cx: bm, cy: 214, r: 6, fill: "var(--ink)" }, late);
    // bracket under the band
    svgEl("path", { d: "M" + bx0 + " " + (BOT + 24) + " V" + (BOT + 12) + " H" + bx1 + " V" + (BOT + 24), fill: "none", stroke: "var(--ink)", "stroke-width": 1.4 }, late);
    var bt = svgEl("text", { x: (bx0 + bx1) / 2, y: BOT + 48, "text-anchor": "middle", class: "chart-label", fill: "var(--ink)" }, late);
    bt.textContent = "estimated remaining life";
    var bt2 = svgEl("text", { x: (bx0 + bx1) / 2, y: BOT + 66, "text-anchor": "middle", class: "chart-note" }, late);
    bt2.textContent = "the point, and the range around it";
  }

  /* ---------- team: one card per person, each with its own colour ---------- */
  var teamList = document.getElementById("team-list");
  var WHO = ["h2", "co", "c2h4", "c2h2", "c5", "c6"]; // colour tokens in css/site.css
  function renderTeam(people) {
    if (!teamList) return;
    teamList.textContent = "";
    people.forEach(function (m, idx) {
      var li = htmlEl("li", "member", "", teamList);
      li.style.setProperty("--who", "var(--" + WHO[idx % WHO.length] + ")");
      htmlEl("h3", "", m.name, li);
      var about = htmlEl("div", "about-me", "", li);
      htmlEl("p", "role", m.role, about);
      if (m.bio) htmlEl("p", "bio", m.bio, about);

      // a small trace, unique to each name
      var s = svgEl("svg", { viewBox: "0 0 170 36", "aria-hidden": "true", focusable: "false" }, li);
      var r = rng(hash(m.name)), y = 18, pts = [];
      for (var i = 0; i < 48; i++) {
        y += (r() - 0.5) * 9;
        y += (18 - y) * 0.12;
        pts.push([2 + i * (166 / 47), Math.min(32, Math.max(4, y))]);
      }
      svgEl("path", { d: pathFrom(pts) }, s);

      var links = htmlEl("div", "links", "", li);
      [["linkedin", "LinkedIn"], ["github", "GitHub"]].forEach(function (k) {
        // only real web addresses become links
        if (!m[k[0]] || !/^https:\/\//i.test(m[k[0]])) return;
        var a = htmlEl("a", "", k[1], links);
        a.href = m[k[0]];
        a.target = "_blank";
        a.rel = "noopener";
        var hidden = htmlEl("span", "sr-only", " (" + m.name + ", opens in a new tab)", a);
      });
    });
  }
  if (D.team) renderTeam(D.team);
  window.STOCHOS_renderTeam = renderTeam;

  /* ---------- results table ---------- */
  var record = document.getElementById("record");
  if (record && D.results) {
    var cap = htmlEl("caption", "", D.results.caption, record);
    var tb = htmlEl("tbody", "", "", record);
    D.results.rows.forEach(function (row) {
      var tr = htmlEl("tr", "", "", tb);
      htmlEl("th", "", row.label, tr).setAttribute("scope", "row");
      htmlEl("td", "", row.value, tr);
    });
    var note = document.getElementById("record-note");
    if (note) note.textContent = D.results.note || "";
  }

  /* ---------- project list ---------- */
  var projectList = document.getElementById("project-list");
  if (projectList && D.projects) {
    D.projects.forEach(function (p) {
      var sec = htmlEl("article", "project", "", projectList);
      var left = htmlEl("div", "", "", sec);
      htmlEl("h2", "", p.title, left);
      htmlEl("p", "status", p.status, left);
      htmlEl("p", "summary", p.summary, left);
      var tags = htmlEl("ul", "tags", "", left);
      (p.tags || []).forEach(function (t) { htmlEl("li", "", t, tags); });
      if (p.url) {
        var act = htmlEl("div", "actions", "", left);
        var a = htmlEl("a", "btn btn-primary", "Open the live demo", act);
        a.href = p.url; a.target = "_blank"; a.rel = "noopener";
        htmlEl("span", "sr-only", " (opens in a new tab)", a);
      }
      var right = htmlEl("div", "", "", sec);
      (p.details || []).forEach(function (d) {
        var box = htmlEl("div", "detail", "", right);
        htmlEl("h3", "", d.heading, box);
        htmlEl("p", "", d.text, box);
      });
    });
  }

  /* ---------- small bits ---------- */
  document.querySelectorAll("[data-demo-link]").forEach(function (a) { if (D.demoUrl) a.href = D.demoUrl; });
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();
})();
