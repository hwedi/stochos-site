/* Public pages: read the team from the database and show it instead of the copy in data.js.
   If anything fails, the page keeps showing data.js. This sends one read-only request to Google. */
(function () {
  "use strict";
  var c = window.STOCHOS_FIREBASE;
  if (!c || !window.STOCHOS_renderTeam || !window.fetch) return;

  function text(f) { return f && typeof f.stringValue === "string" ? f.stringValue : ""; }

  var url = "https://firestore.googleapis.com/v1/projects/" + encodeURIComponent(c.projectId) +
    "/databases/(default)/documents/members?pageSize=50&key=" + encodeURIComponent(c.apiKey);

  fetch(url)
    .then(function (r) { if (!r.ok) throw new Error("read failed"); return r.json(); })
    .then(function (j) {
      var list = (j.documents || []).map(function (d) {
        var f = d.fields || {};
        return { name: text(f.name), role: text(f.role), bio: text(f.bio), linkedin: text(f.linkedin), github: text(f.github) };
      }).filter(function (m) { return m.name && m.role; });
      if (!list.length) return;
      list.sort(function (a, b) { return a.name.localeCompare(b.name); });
      window.STOCHOS_renderTeam(list);
    })
    .catch(function () { /* keep the copy from data.js */ });
})();
