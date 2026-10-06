/* Team sign-in page. This is the SOURCE file.
   The page loads js/account.js, which is built from this file:
     cd tools && npm install && npm run build
   Rebuild and commit js/account.js after every change here. */
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, getDocs, collection, setDoc, updateDoc, writeBatch } from "firebase/firestore";

var app = initializeApp(window.STOCHOS_FIREBASE);
var auth = getAuth(app);
var db = getFirestore(app);
var view = document.getElementById("view");
var D = window.STOCHOS || {};

/* ---------- small helpers ---------- */
function el(tag, cls, text, parent) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  if (parent) parent.appendChild(n);
  return n;
}
function clear() { view.textContent = ""; }
function slugify(name) {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function field(form, id, label, value, opts) {
  opts = opts || {};
  var wrap = el("div", "field", "", form);
  var l = el("label", "", label, wrap);
  l.setAttribute("for", id);
  var input = el(opts.multiline ? "textarea" : "input", "", "", wrap);
  input.id = id;
  if (!opts.multiline) input.type = opts.type || "text";
  if (opts.multiline) input.rows = opts.rows || 6;
  input.value = value || "";
  if (opts.placeholder) input.placeholder = opts.placeholder;
  if (opts.hint) {
    var h = el("p", "hint", opts.hint, wrap);
    h.id = id + "-hint";
    input.setAttribute("aria-describedby", h.id);
  }
  input.setAttribute("autocomplete", "off");
  input.setAttribute("spellcheck", "false");
  return input;
}
function messageBox(parent) {
  var m = el("p", "message", "", parent);
  m.setAttribute("role", "status");
  return m;
}
function say(box, text, isError) {
  box.textContent = (isError ? "Problem: " : "") + text;
  box.className = "message" + (isError ? " error" : " ok");
}
function button(parent, label, kind, onClick) {
  var b = el("button", "btn " + (kind || "btn-primary"), label, parent);
  b.type = "button";
  b.addEventListener("click", onClick);
  return b;
}
function friendly(err) {
  var code = err && err.code ? err.code : "";
  if (code === "permission-denied") return "The database refused this change. If you are on the team, tell the site maintainer.";
  if (code === "auth/unauthorized-domain") return "This web address is not allowed to sign in yet. The maintainer must add it in Firebase.";
  if (code === "auth/popup-blocked") return "Your browser blocked the sign-in window. Allow pop-ups for this site and try again.";
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return "The sign-in window was closed before it finished.";
  if (code === "unavailable" || code === "auth/network-request-failed") return "No connection to the database. Check your internet and try again.";
  return "Something went wrong (" + (code || "unknown") + ").";
}

/* A link must be a full https address on the right website, or empty. Same rule as the database. */
function checkLink(value, kind) {
  if (!value) return "";
  if (value.length > 200) return "That address is too long.";
  var re = kind === "linkedin" ? /^https:\/\/([a-z0-9-]+\.)?linkedin\.com\/.+$/ : /^https:\/\/(www\.)?github\.com\/.+$/;
  if (!re.test(value)) {
    return kind === "linkedin"
      ? "Paste the full address of your LinkedIn profile. It starts with https://www.linkedin.com/in/"
      : "Paste the full address of your GitHub profile. It starts with https://github.com/";
  }
  return "";
}

function checkWebsite(value) {
  if (!value) return "";
  if (value.length > 200) return "That website address is too long.";
  if (!/^https:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}(\/[^\s]*)?$/.test(value)) {
    return "Paste the full address of your website. It starts with https://";
  }
  return "";
}

/* A photo is cut to a square from the middle, made 320 pixels wide and saved as a small JPEG
   inside the profile itself. Nothing is uploaded anywhere else. */
function toPhoto(file) {
  return new Promise(function (resolve, reject) {
    if (!file || !/^image\//.test(file.type)) { reject(new Error("That file is not a picture.")); return; }
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var w = img.naturalWidth, h = img.naturalHeight, side = Math.min(w, h), S = 320;
      var c = document.createElement("canvas");
      c.width = c.height = S;
      var ctx = c.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, S, S);
      ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, S, S);
      URL.revokeObjectURL(url);
      var q = 0.86, out = c.toDataURL("image/jpeg", q);
      while (out.length > 140000 && q > 0.4) { q -= 0.1; out = c.toDataURL("image/jpeg", q); }
      if (out.length > 190000 || out.indexOf("data:image/jpeg;base64,") !== 0) { reject(new Error("That picture could not be made small enough.")); return; }
      resolve(out);
    };
    img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("That picture could not be opened.")); };
    img.src = url;
  });
}

function photoField(form, current, name) {
  var state = { value: current || "" };
  var wrap = el("div", "field photo-field", "", form);
  var l = el("label", "", "Photo", wrap);
  l.setAttribute("for", "f-photo");
  var row = el("div", "photo-row", "", wrap);
  var preview = el("div", "photo-preview", "", row);
  var controls = el("div", "photo-controls", "", row);
  var input = el("input", "", "", controls);
  input.type = "file";
  input.id = "f-photo";
  input.accept = "image/*";
  var rm = button(controls, "Remove photo", "btn-quiet", function () {
    state.value = "";
    input.value = "";
    show();
  });
  var hint = el("p", "hint", "Optional. A square is cut from the middle of the picture. Without a photo, the site shows your coloured line.", wrap);
  hint.id = "f-photo-hint";
  input.setAttribute("aria-describedby", hint.id);
  var box = messageBox(wrap);
  function show() {
    preview.textContent = "";
    if (state.value) {
      var img = el("img", "", "", preview);
      img.src = state.value;
      img.alt = "Your photo";
      rm.hidden = false;
    } else {
      el("span", "", "No photo", preview);
      rm.hidden = true;
    }
  }
  input.addEventListener("change", function () {
    var f = input.files && input.files[0];
    if (!f) return;
    box.textContent = "";
    box.className = "message";
    toPhoto(f).then(function (v) { state.value = v; show(); })
      .catch(function (err) { say(box, err.message, true); input.value = ""; });
  });
  show();
  return state;
}

/* ---------- screens ---------- */
function signedOut() {
  clear();
  el("h1", "", "Team sign-in", view);
  el("p", "lead", "Members of the team sign in with Google to create and edit their own profile.", view);
  var box = messageBox(view);
  var actions = el("div", "actions", "", view);
  button(actions, "Sign in with Google", "btn-primary", function () {
    var provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    signInWithPopup(auth, provider).catch(function (err) { say(box, friendly(err), true); });
  });
}

function header(user, slug, hasProfile) {
  el("h1", "", "Your profile", view);
  var p = el("p", "lead", "Signed in as " + user.email + ". ", view);
  if (slug && hasProfile) {
    var v = el("a", "", "View your profile", p);
    v.href = "profile.html?u=" + encodeURIComponent(slug);
    p.appendChild(document.createTextNode(" \u00b7 "));
  }
  var out = el("button", "linkbtn", "Sign out", p);
  out.type = "button";
  out.addEventListener("click", function () { signOut(auth); });
}

function profileForm(slug, member, isNew, done) {
  var sec = el("section", "panel", "", view);
  el("h2", "", isNew ? "Create your profile" : "Edit your profile", sec);
  el("p", "hint", isNew
    ? "This is your own page on the site. Fill in what you like. You can change it at any time."
    : "Changes show on the site as soon as you save.", sec);
  var form = el("form", "form", "", sec);
  var ph = photoField(form, member.photo, member.name);
  var nm = field(form, "f-name", "Name", member.name);
  var ro = field(form, "f-role", "Role", member.role, {
    hint: "One short line under your name."
  });
  var bi = field(form, "f-bio", "Short introduction", member.bio, {
    multiline: true, rows: 3,
    hint: "Shows on the team page and at the top of your profile. 300 letters at most."
  });
  var ab = field(form, "f-about", "About", member.about, {
    multiline: true, rows: 9,
    hint: "The longer text on your profile page. Leave an empty line between paragraphs. 3000 letters at most."
  });
  var sk = field(form, "f-skills", "Skills", member.skills, {
    placeholder: "Python, SQL, PyTorch",
    hint: "Separate them with commas. 300 letters at most."
  });
  var li = field(form, "f-linkedin", "LinkedIn address", member.linkedin, {
    type: "url", placeholder: "https://www.linkedin.com/in/your-name",
    hint: "Leave empty to show no LinkedIn link."
  });
  var gh = field(form, "f-github", "GitHub address", member.github, {
    type: "url", placeholder: "https://github.com/your-name",
    hint: "Leave empty to show no GitHub link."
  });
  var ws = field(form, "f-website", "Website", member.website, {
    type: "url", placeholder: "https://your-site.com",
    hint: "Optional. Your own site or portfolio."
  });
  var box = messageBox(form);
  var actions = el("div", "actions", "", form);
  var save = button(actions, isNew ? "Create profile" : "Save", "btn-primary", function () {});
  save.type = "submit";
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = {
      name: nm.value.trim(), role: ro.value.trim(), bio: bi.value.trim(), about: ab.value.trim(),
      skills: sk.value.trim(), linkedin: li.value.trim(), github: gh.value.trim(), website: ws.value.trim(),
      photo: ph.value
    };
    var bad = !d.name ? "Your name cannot be empty."
      : d.name.length > 80 ? "Your name is too long (80 letters at most)."
      : d.role.length > 200 ? "Your role is too long (200 letters at most)."
      : d.bio.length > 300 ? "Your short introduction is too long (300 letters at most)."
      : d.about.length > 3000 ? "Your About text is too long (3000 letters at most)."
      : d.skills.length > 300 ? "Your skills list is too long (300 letters at most)."
      : checkLink(d.linkedin, "linkedin") || checkLink(d.github, "github") || checkWebsite(d.website);
    if (bad) { say(box, bad, true); return; }
    save.disabled = true;
    setDoc(doc(db, "members", slug), d)
      .then(function () {
        say(box, isNew ? "Your profile is created." : "Saved. Your profile is updated.");
        var v = el("a", "", " View your profile", box);
        v.href = "profile.html?u=" + encodeURIComponent(slug);
        if (isNew && done) done();
      })
      .catch(function (err) { say(box, friendly(err), true); })
      .then(function () { save.disabled = false; });
  });
}

function adminPanel(refresh) {
  var sec = el("section", "panel", "", view);
  el("h2", "", "Maintainer tools", sec);

  /* 1. who is on the team */
  el("h3", "", "Team list", sec);
  el("p", "hint", "One person per line: full name, then the Google email they sign in with. Saving lets them sign in. Someone new creates their own profile the first time they sign in. Saving never changes an existing profile.", sec);
  var form = el("form", "form", "", sec);
  var area = field(form, "f-list", "People", "", {
    multiline: true, rows: 7, placeholder: "Full Name, name@gmail.com"
  });
  var box = messageBox(form);
  var actions = el("div", "actions", "", form);
  var save = button(actions, "Save team list", "btn-primary", function () {});
  save.type = "submit";
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var people = [], seen = {};
    var lines = area.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
    for (var i = 0; i < lines.length; i++) {
      var parts = lines[i].split(",");
      var email = (parts.pop() || "").trim().toLowerCase();
      var name = parts.join(",").trim();
      var slug = slugify(name);
      if (!name || !slug || !/^[^\s@\/]+@[^\s@\/]+\.[^\s@\/]+$/.test(email)) {
        say(box, "Line " + (i + 1) + " should look like: Full Name, name@gmail.com", true); return;
      }
      if (seen[email] || seen["s:" + slug]) { say(box, "Line " + (i + 1) + " repeats someone from an earlier line.", true); return; }
      seen[email] = seen["s:" + slug] = true;
      people.push({ name: name, email: email, slug: slug });
    }
    if (!people.length) { say(box, "Add at least one person.", true); return; }
    save.disabled = true;
    getDocs(collection(db, "members")).then(function (snap) {
      var have = {};
      snap.forEach(function (d) { have[d.id] = true; });
      var batch = writeBatch(db), added = 0;
      people.forEach(function (p) {
        batch.set(doc(db, "allowed", p.email), { slug: p.slug });
        if (have[p.slug]) return;
        // only start a profile when the site already has a copy of this person in data.js;
        // anyone else creates their own profile when they first sign in
        var seed = (D.team || []).filter(function (t) { return slugify(t.name) === p.slug; })[0];
        if (!seed) return;
        batch.set(doc(db, "members", p.slug), {
          name: p.name, role: seed.role || "", bio: "", linkedin: seed.linkedin || "", github: seed.github || ""
        });
        added++;
      });
      return batch.commit().then(function () {
        say(box, "Saved " + people.length + " people. " + added + " profiles started from the site's copy; anyone else creates their own when they sign in.");
        area.value = "";
        return refresh();
      });
    }).catch(function (err) { say(box, friendly(err), true); })
      .then(function () { save.disabled = false; });
  });

  /* 2. roles */
  el("h3", "", "Edit anyone's role", sec);
  el("p", "hint", "Everyone edits their own role above. Use this only if someone asks you to fix theirs.", sec);
  var list = el("div", "roles", "", sec);
  var rbox = messageBox(sec);
  getDocs(collection(db, "members")).then(function (snap) {
    var rows = [];
    snap.forEach(function (d) { rows.push({ id: d.id, data: d.data() }); });
    rows.sort(function (a, b) { return a.data.name.localeCompare(b.data.name); });
    if (!rows.length) { el("p", "hint", "No profiles yet.", list); return; }
    rows.forEach(function (r) {
      var f = el("form", "form role-row", "", list);
      var input = field(f, "role-" + r.id, r.data.name, r.data.role, { hint: "" });
      var b = button(f, "Save role", "btn-quiet", function () {});
      b.type = "submit";
      b.setAttribute("aria-label", "Save role for " + r.data.name);
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var v = input.value.trim();
        if (v.length > 200) { say(rbox, "That role is too long.", true); return; }
        b.disabled = true;
        updateDoc(doc(db, "members", r.id), { role: v })
          .then(function () { say(rbox, "Saved the role for " + r.data.name + "."); })
          .catch(function (err) { say(rbox, friendly(err), true); })
          .then(function () { b.disabled = false; });
      });
    });
  }).catch(function (err) { say(rbox, friendly(err), true); });
}

/* ---------- main flow ---------- */
function load(user) {
  var email = (user.email || "").toLowerCase();
  clear();
  el("p", "lead", "Loading...", view);

  var allowedP = getDoc(doc(db, "allowed", email)).then(function (s) { return s.exists() ? s.data().slug : ""; })
    .catch(function () { return ""; });
  // only the maintainer may read this document, so a refusal means "not the maintainer"
  var adminP = getDoc(doc(db, "meta", "admin")).then(function () { return true; }).catch(function () { return false; });

  return Promise.all([allowedP, adminP]).then(function (r) {
    var slug = r[0], isAdmin = r[1];
    var memberP = slug ? getDoc(doc(db, "members", slug)).then(function (s) { return s.exists() ? s.data() : null; }) : Promise.resolve(null);
    return memberP.then(function (member) {
      clear();
      header(user, slug, !!member);
      if (slug && member) profileForm(slug, member, false);
      if (slug && !member) {
        var seed = (D.team || []).filter(function (t) { return slugify(t.name) === slug; })[0] || {};
        profileForm(slug, { name: seed.name || user.displayName || "", role: seed.role || "" }, true, function () { load(user); });
      }
      if (isAdmin) adminPanel(function () { return load(user); });
      if (!slug && !isAdmin) {
        var sec = el("section", "panel", "", view);
        el("h2", "", "This account is not on the team list", sec);
        el("p", "", "Sign out and sign in with the Google account that the maintainer added. If you think this is a mistake, tell the maintainer which email you used.", sec);
      }
    });
  }).catch(function (err) {
    clear();
    header(user);
    var box = messageBox(view);
    say(box, friendly(err), true);
  });
}

onAuthStateChanged(auth, function (user) {
  if (user && user.email) load(user); else signedOut();
});
