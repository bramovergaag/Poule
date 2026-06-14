/* BLOW POULE — puntentelling.
   Werkt in de browser (window.SCORING) én in node (module.exports). */
(function (root) {
  "use strict";

  var RULES = {
    scorer: 5,          // eerste doelpuntenmaker exact goed
    minuteExact: 4,     // minuut 1e doelpunt exact
    minuteWithin1: 2,   // 1 minuut ernaast
    minuteWithin3: 1,   // 2-3 minuten ernaast
    scoreExact: 6,      // eindstand exact (bij afgelopen wedstrijd)
    outcome: 2          // juiste uitslag, verkeerde cijfers
  };

  function norm(s) { return (s || "").toString().toLowerCase().replace(/[^a-z]/g, ""); }
  function surname(s) { return norm((s || "").toString().trim().split(/\s+/).pop()); }

  // kleine Levenshtein voor 1 tikfout (Rijnders ~ Reijnders)
  function lev(a, b) {
    var m = a.length, n = b.length, i, j, prev = [], cur = [];
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur[0] = i;
      for (j = 1; j <= n; j++) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      prev = cur.slice();
    }
    return prev[n];
  }

  // voorspelde naam (achternaam op briefje) vs werkelijke naam (volledig van ESPN)
  function nameMatch(pred, actual) {
    if (!pred || !actual) return false;
    var p = norm(pred), a = norm(actual);
    if (!p || !a) return false;
    if (a.indexOf(p) >= 0 || p.indexOf(a) >= 0) return true; // achternaam zit in volledige naam
    var ps = surname(pred), as = surname(actual);
    if (ps === as) return true;
    if (ps.length >= 4 && as.length >= 4 && lev(ps, as) <= 1) return true; // 1 tikfout
    return false;
  }

  function outcome(h, a) { return h > a ? "NED" : h < a ? "JAP" : "DRAW"; }

  function goalsByMinute(match) {
    return (match.goals || []).slice().sort(function (a, b) { return a.minute - b.minute; });
  }

  // stand: gebruik ESPN-score als die meegegeven is, anders tel de goals
  function liveScore(match) {
    if (match.score && (match.score.ned != null || match.score.jap != null)) {
      return { ned: match.score.ned || 0, jap: match.score.jap || 0 };
    }
    var ned = 0, jap = 0;
    (match.goals || []).forEach(function (g) { if (g.team === "NED") ned++; else if (g.team === "JAP") jap++; });
    return { ned: ned, jap: jap };
  }

  function scoreEntry(pred, match) {
    var det = { scorer: 0, minute: 0, score: 0, total: 0,
      flags: { scorer: false, minute: null, score: null, scoreLive: false } };
    var ordered = goalsByMinute(match);
    var first = ordered[0] || null;

    if (first && pred.scorer && nameMatch(pred.scorer, first.scorer)) {
      det.scorer = RULES.scorer; det.flags.scorer = true;
    }
    if (first && pred.minute != null && first.minute != null) {
      var d = Math.abs(first.minute - pred.minute);
      if (d === 0) { det.minute = RULES.minuteExact; det.flags.minute = "exact"; }
      else if (d <= 1) { det.minute = RULES.minuteWithin1; det.flags.minute = "close"; }
      else if (d <= 3) { det.minute = RULES.minuteWithin3; det.flags.minute = "near"; }
    }
    var sc = liveScore(match);
    if (pred.h != null && pred.a != null) {
      var sameNumbers = pred.h === sc.ned && pred.a === sc.jap;
      det.flags.scoreLive = sameNumbers;
      if (match.status === "finished") {
        if (sameNumbers) { det.score = RULES.scoreExact; det.flags.score = "exact"; }
        else if (outcome(pred.h, pred.a) === outcome(sc.ned, sc.jap)) { det.score = RULES.outcome; det.flags.score = "outcome"; }
      }
    }
    det.total = det.scorer + det.minute + det.score;
    return det;
  }

  function standings(preds, match) {
    var rows = preds.map(function (p) { return Object.assign({}, p, { det: scoreEntry(p, match), total: 0 }); });
    rows.forEach(function (r) { r.total = r.det.total; });
    rows.sort(function (a, b) {
      if (b.total !== a.total) return b.total - a.total;
      if (a.det.flags.scorer !== b.det.flags.scorer) return a.det.flags.scorer ? -1 : 1;
      return (a.name || "").localeCompare(b.name || "");
    });
    var rank = 0, prev = null;
    rows.forEach(function (r, i) {
      if (prev === null || r.total !== prev) { rank = i + 1; prev = r.total; }
      r.rank = rank;
    });
    return rows;
  }

  var api = { RULES: RULES, norm: norm, nameMatch: nameMatch, outcome: outcome,
    liveScore: liveScore, scoreEntry: scoreEntry, standings: standings };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SCORING = api;
})(typeof window !== "undefined" ? window : globalThis);
