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

  /* ---------- team ---------- */
  var WHO = ["h2", "co", "c2h4", "c2h2", "c5", "c6"]; // one colour per person, tokens in css/site.css
  function colourOf(idx) { return "var(--" + WHO[idx % WHO.length] + ")"; }
  function slugify(name) {
    return String(name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  // only real web addresses become links, and only small JPEG photos stored in the profile are shown
  function httpsOnly(u) { return typeof u === "string" && /^https:\/\/\S+$/i.test(u) ? u : ""; }
  function photoOf(m) { return typeof m.photo === "string" && /^data:image\/jpeg;base64,[A-Za-z0-9+\/]+=*$/.test(m.photo) ? m.photo : ""; }
  function profileUrl(m) { return "profile.html?u=" + encodeURIComponent(m.slug); }
  function linksOf(m, keys) {
    var names = { linkedin: "LinkedIn", github: "GitHub", website: "Website" };
    return keys.map(function (k) { return [names[k], httpsOnly(m[k])]; }).filter(function (l) { return l[1]; });
  }
  function outLink(parent, label, href, who, cls) {
    var a = htmlEl("a", cls || "", label, parent);
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    htmlEl("span", "sr-only", " (" + who + ", opens in a new tab)", a);
    return a;
  }
  // a line unique to each name; the same shape at any size
  function tracePoints(name, w, h) {
    var r = rng(hash(name)), mid = h / 2, y = mid, pts = [], n = 48;
    for (var i = 0; i < n; i++) {
      y += (r() - 0.5) * h * 0.25;
      y += (mid - y) * 0.12;
      pts.push([2 + i * ((w - 4) / (n - 1)), Math.min(h - 4, Math.max(4, y))]);
    }
    return pts;
  }
  function drawTrace(parent, name) {
    var s = svgEl("svg", { viewBox: "0 0 170 36", "aria-hidden": "true", focusable: "false", class: "trace-mini" }, parent);
    svgEl("path", { d: pathFrom(tracePoints(name, 170, 36)) }, s);
    return s;
  }

  function avatar(parent, m, idx, cls) {
    var box = htmlEl("span", "avatar" + (cls ? " " + cls : ""), "", parent);
    box.style.setProperty("--who", colourOf(idx));
    var pic = photoOf(m);
    if (pic) {
      var img = htmlEl("img", "", "", box);
      img.src = pic; img.alt = ""; img.decoding = "async";
    } else {
      var s = svgEl("svg", { viewBox: "0 0 64 64", "aria-hidden": "true", focusable: "false" }, box);
      for (var g = 16; g < 64; g += 16) {
        svgEl("line", { x1: g, y1: 0, x2: g, y2: 64, class: "grid" }, s);
        svgEl("line", { x1: 0, y1: g, x2: 64, y2: g, class: "grid" }, s);
      }
      var pts = tracePoints(m.name, 64, 28).map(function (p) { return [p[0], p[1] + 18]; });
      svgEl("path", { d: pathFrom(pts) }, s);
    }
    return box;
  }

  /* the team, small, at the top of the home page */
  var heroTeam = document.getElementById("hero-team");
  function renderHeroTeam(people) {
    if (!heroTeam) return;
    heroTeam.textContent = "";
    people.forEach(function (m, idx) {
      var li = htmlEl("li", "", "", heroTeam);
      var a = htmlEl("a", "", "", li);
      a.href = profileUrl(m);
      avatar(a, m, idx, "avatar-sm");
      htmlEl("span", "", String(m.name).split(" ")[0], a);
      a.setAttribute("aria-label", m.name);
    });
  }

  /* team cards on the home page */
  var teamList = document.getElementById("team-list");
  function renderTeam(people) {
    renderHeroTeam(people);
    if (!teamList) return;
    teamList.textContent = "";
    people.forEach(function (m, idx) {
      var li = htmlEl("li", "member", "", teamList);
      li.style.setProperty("--who", colourOf(idx));
      var top = htmlEl("div", "member-top", "", li);
      avatar(top, m, idx);
      var who = htmlEl("div", "member-who", "", top);
      var h = htmlEl("h3", "", "", who);
      htmlEl("a", "", m.name, h).href = profileUrl(m);
      if (m.role) htmlEl("p", "role", m.role, who);
      if (m.bio) htmlEl("p", "bio", m.bio, li);
      var links = htmlEl("div", "links", "", li);
      var pl = htmlEl("a", "profile-link", "View profile", links);
      pl.href = profileUrl(m);
      htmlEl("span", "sr-only", " of " + m.name, pl);
      linksOf(m, ["linkedin", "github"]).forEach(function (l) { outLink(links, l[0], l[1], m.name); });
    });
  }

  /* one person's own page: profile.html?u=their-name */
  var profileRoot = document.getElementById("profile");
  var wanted = "";
  try { wanted = (new URLSearchParams(location.search).get("u") || "").toLowerCase(); } catch (e) { /* old browser */ }
  var animatedOnce = false;
  function bigTrace(parent, name) {
    var S = 340, svg = svgEl("svg", { viewBox: "0 0 " + S + " " + S, "aria-hidden": "true", focusable: "false" }, parent);
    for (var g = 0; g <= S; g += 20) {
      var major = g % 100 === 0;
      svgEl("line", { x1: g, y1: 0, x2: g, y2: S, stroke: major ? "var(--grid-major)" : "var(--grid)", "stroke-width": major ? 1 : 0.6 }, svg);
      svgEl("line", { x1: 0, y1: g, x2: S, y2: g, stroke: major ? "var(--grid-major)" : "var(--grid)", "stroke-width": major ? 1 : 0.6 }, svg);
    }
    var pts = tracePoints(name, S, 72).map(function (p) { return [p[0], p[1] + (S - 72) / 2]; });
    svgEl("path", { d: pathFrom(pts), class: "trace" + (reduceMotion || animatedOnce ? "" : " draw"), pathLength: 1, stroke: "var(--who)", "stroke-width": 3 }, svg);
    animatedOnce = true;
  }
  function section(title) {
    var sec = htmlEl("section", "section", "", profileRoot);
    var wrap = htmlEl("div", "wrap", "", sec);
    htmlEl("div", "section-head", "", wrap).appendChild(htmlEl("h2", "", title));
    return wrap;
  }
  function renderProfile(people, state) {
    if (!profileRoot) return;
    var idx = -1;
    people.forEach(function (m, i) { if (m.slug === wanted) idx = i; });
    if (idx < 0 && state === "copy") return; // still waiting for the database
    profileRoot.textContent = "";

    if (idx < 0) {
      var nf = htmlEl("section", "page-head", "", profileRoot);
      var w0 = htmlEl("div", "wrap", "", nf);
      htmlEl("h1", "", "Profile not found", w0);
      htmlEl("p", "", "There is no team member at this address.", w0);
      var act = htmlEl("div", "actions", "", w0);
      var back = htmlEl("a", "btn btn-primary", "See the team", act);
      back.href = "index.html#team";
      document.title = "Profile not found | STOCHOS";
      return;
    }

    var m = people[idx];
    document.title = m.name + " | STOCHOS";
    profileRoot.style.setProperty("--who", colourOf(idx));

    var head = htmlEl("section", "profile-head", "", profileRoot);
    var grid = htmlEl("div", "wrap profile-grid", "", head);
    var picBox = htmlEl("div", "profile-pic", "", grid);
    var pic = photoOf(m);
    if (pic) {
      var img = htmlEl("img", "", "", picBox);
      img.src = pic; img.alt = "Photo of " + m.name; img.width = 320; img.height = 320;
    } else {
      bigTrace(picBox, m.name);
    }
    var info = htmlEl("div", "profile-info", "", grid);
    var crumb = htmlEl("p", "crumb", "", info);
    htmlEl("a", "", "The team", crumb).href = "index.html#team";
    htmlEl("h1", "", m.name, info);
    if (m.role) htmlEl("p", "lead", m.role, info);
    if (m.bio) htmlEl("p", "profile-bio", m.bio, info);
    var ls = linksOf(m, ["linkedin", "github", "website"]);
    if (ls.length) {
      var row = htmlEl("div", "actions profile-links", "", info);
      ls.forEach(function (l, i) { outLink(row, l[0], l[1], m.name, i === 0 ? "btn btn-primary" : "btn btn-line"); });
    }

    if (m.about) {
      var aw = section("About");
      var txt = htmlEl("div", "about-text", "", aw);
      m.about.split(/\n\s*\n/).forEach(function (para) { if (para.trim()) htmlEl("p", "", para.trim(), txt); });
    }
    var skills = String(m.skills || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 30);
    if (skills.length) {
      var sw = section("Skills");
      var ul = htmlEl("ul", "tags skills", "", sw);
      skills.forEach(function (t) { htmlEl("li", "", t, ul); });
    }

    if (people.length > 1) {
      var ow = section("The rest of the team");
      var others = htmlEl("ul", "others", "", ow);
      people.forEach(function (o, i) {
        if (i === idx) return;
        var li = htmlEl("li", "", "", others);
        li.style.setProperty("--who", colourOf(i));
        var a = htmlEl("a", "other", "", li);
        a.href = profileUrl(o);
        drawTrace(a, o.name);
        htmlEl("span", "other-name", o.name, a);
        if (o.role) htmlEl("span", "other-role", o.role, a);
      });
    }
  }

  /* show the copy in data.js now, then the database version when it arrives */
  var copy = (D.team || []).map(function (t) {
    var o = {}; for (var k in t) o[k] = t[k];
    o.slug = o.slug || slugify(o.name);
    return o;
  });
  renderTeam(copy);
  renderProfile(copy, "copy");
  window.STOCHOS_onTeam = function (list, state) {
    if (list && list.length) { renderTeam(list); renderProfile(list, "live"); }
    else renderProfile(copy, "failed");
  };

  /* ---------- our work, on the home page ---------- */
  var workList = document.getElementById("work-list");
  if (workList && D.projects) {
    D.projects.forEach(function (p) {
      var card = htmlEl("article", "work-card", "", workList);
      var left = htmlEl("div", "", "", card);
      var head = htmlEl("div", "work-head", "", left);
      htmlEl("h3", "", p.title, head);
      if (p.status) htmlEl("span", "status", p.status, head);
      htmlEl("p", "summary", p.summary, left);
      var tags = htmlEl("ul", "tags", "", left);
      (p.tags || []).forEach(function (t) { htmlEl("li", "", t, tags); });
      var act = htmlEl("div", "actions work-actions", "", card);
      if (httpsOnly(p.url)) {
        var demo = htmlEl("a", "btn btn-primary", "Open the live demo", act);
        demo.href = p.url; demo.target = "_blank"; demo.rel = "noopener";
        htmlEl("span", "sr-only", " (opens in a new tab)", demo);
      }
      htmlEl("a", "btn btn-line", "How it works", act).href = "projects.html";
    });
  }

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
