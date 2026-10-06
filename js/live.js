/* Public pages: read the team's profiles from the database.
   If anything fails, the pages keep showing the copy in data.js. This sends one read-only request to Google. */
(function () {
  "use strict";
  var c = window.STOCHOS_FIREBASE;
  function done(list, state) { if (window.STOCHOS_onTeam) window.STOCHOS_onTeam(list, state); }
  if (!c || !window.fetch) { done(null, "failed"); return; }

  var FIELDS = ["name", "role", "bio", "about", "skills", "linkedin", "github", "website", "photo"];
  function text(f) { return f && typeof f.stringValue === "string" ? f.stringValue : ""; }

  var url = "https://firestore.googleapis.com/v1/projects/" + encodeURIComponent(c.projectId) +
    "/databases/(default)/documents/members?pageSize=50&key=" + encodeURIComponent(c.apiKey);

  fetch(url)
    .then(function (r) { if (!r.ok) throw new Error("read failed"); return r.json(); })
    .then(function (j) {
      var list = (j.documents || []).map(function (d) {
        var f = d.fields || {}, m = { slug: String(d.name || "").split("/").pop() };
        FIELDS.forEach(function (k) { m[k] = text(f[k]); });
        return m;
      }).filter(function (m) { return m.name && m.slug; });
      list.sort(function (a, b) { return a.name.localeCompare(b.name); });
      done(list, "live");
    })
    .catch(function () { done(null, "failed"); });
})();
