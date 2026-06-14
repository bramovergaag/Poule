/* Live "spanning"-generator: wie pakt punten bij welk scenario?
   Puur en testbaar. Browser: window.NARRATIVE · node: module.exports. */
(function (root) {
  "use strict";

  function firstGoal(m) {
    return (m.goals || []).slice().sort(function (a, b) { return (a.minute || 0) - (b.minute || 0); })[0] || null;
  }
  function curMinute(m) {
    if (typeof m.minute === "number") return m.minute;
    var x = String(m.minute || "").match(/(\d+)/);
    return x ? parseInt(x[1], 10) : null;
  }
  function uniq(a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }); }
  function nm(p) { return p.name; }
  function who(list) { return list.length ? list.join(", ") : "niemand"; }
  function groupBy(preds, keyFn) {
    var map = {}, order = [];
    preds.forEach(function (p) { var k = keyFn(p); if (!(k in map)) { map[k] = []; order.push(k); } map[k].push(p); });
    return order.map(function (k) { return { key: k, preds: map[k] }; });
  }
  function whoAt(preds, ned, jap, SC) {
    var o = SC.outcome(ned, jap);
    return {
      exact: preds.filter(function (p) { return p.h === ned && p.a === jap; }).map(nm),
      toto: preds.filter(function (p) { return !(p.h === ned && p.a === jap) && SC.outcome(p.h, p.a) === o; }).map(nm)
    };
  }

  function liveNarrative(PREDICTIONS, match, SC) {
    var lines = [], status = match.status || "scheduled";
    var first = firstGoal(match), sc = SC.liveScore(match);
    var OPP = (match.opp && match.opp.abbr) || "TEG";
    if (!PREDICTIONS.length) {
      lines.push("📝 Nog geen inzendingen voor deze wedstrijd — wees de eerste met 'Doe mee'!");
      return { lines: lines, share: "⚽ *BLOW Poule* · Nederland–" + OPP + "\nDoe mee: https://bramovergaag.github.io/Poule/ (🔑 BLOWWK)" };
    }
    var lead = SC.standings(PREDICTIONS, match)[0];

    if (status === "scheduled") {
      lines.push("⚽ Aftrap moet nog komen — de 1e doelpuntenmaker (5 pt) én de minuut (tot 4) liggen helemaal open.");
      lines.push("🎯 1e-maker-kandidaten: " + groupBy(PREDICTIONS, function (p) { return p.scorer; })
        .map(function (g) { return g.key + " → " + g.preds.map(nm).join(", "); }).join(" · "));
    } else if (!first) {
      var m = curMinute(match);
      lines.push("🔥 Nog 0-0" + (m != null ? " in de " + m + "e minuut" : "") + " — de 1e goal is goud waard (maker 5 + minuut tot 4).");
      if (m != null) {
        var exactNow = PREDICTIONS.filter(function (p) { return p.minute === m; }).map(function (p) { return p.name + " (" + p.minute + "')"; });
        var closeNow = PREDICTIONS.filter(function (p) { var d = Math.abs(p.minute - m); return d >= 1 && d <= 3; }).map(function (p) { return p.name + " (" + p.minute + "')"; });
        if (exactNow.length) lines.push("🎯 Valt 'ie NÚ? " + who(exactNow) + " pakt de minuut exact (+4)!");
        if (closeNow.length) lines.push("➕ Vlakbij bij een goal nu (+1/+2): " + who(closeNow));
        var alive = uniq(PREDICTIONS.filter(function (p) { return p.minute >= m - 3; }).map(function (p) { return p.name + " " + p.minute + "'"; }));
        var expired = uniq(PREDICTIONS.filter(function (p) { return p.minute < m - 3; }).map(function (p) { return p.name + " " + p.minute + "'"; }));
        if (expired.length) lines.push("⌛ Minuut-bonus verlopen (1e goal nog niet gevallen): " + who(expired));
        if (alive.length) lines.push("⏳ Nog kans op de minuut-bonus: " + who(alive));
      }
      lines.push("🥅 En de maker: scoort " + groupBy(PREDICTIONS, function (p) { return p.scorer; })
        .map(function (g) { return g.key + " → " + g.preds.map(nm).join("/"); }).join(" · "));
    } else {
      var rows = SC.standings(PREDICTIONS, match);
      var makerWin = PREDICTIONS.filter(function (p) { return SC.nameMatch(p.scorer, first.scorer); }).map(nm);
      var minWin = rows.filter(function (r) { return r.det.flags.minute; }).map(function (r) { return r.name + " (+" + r.det.minute + ")"; });
      lines.push("✅ 1e goal: " + (first.scorerShort || first.scorer) + " in de " + first.minute + "' (" + (first.team === "NED" ? "NL" : OPP) + "). " +
        "Maker → " + who(makerWin) + ". Minuut → " + who(minWin) + ".");
      var now = whoAt(PREDICTIONS, sc.ned, sc.jap, SC);
      lines.push("📊 Zou het NU eindigen (" + sc.ned + "-" + sc.jap + "): exact +6 → " + who(now.exact) + "; juiste uitslag +2 → " + who(now.toto) + ".");
      var nNED = whoAt(PREDICTIONS, sc.ned + 1, sc.jap, SC);
      var nJAP = whoAt(PREDICTIONS, sc.ned, sc.jap + 1, SC);
      lines.push("➕ 🟧 NL scoort (→" + (sc.ned + 1) + "-" + sc.jap + "): exact " + who(nNED.exact) +
        ".  " + OPP + " scoort (→" + sc.ned + "-" + (sc.jap + 1) + "): exact " + who(nJAP.exact) + ".");
    }

    if (status === "finished") {
      lines.unshift("🏁 Afgelopen! Winnaar: " + lead.name + " met " + lead.total + " pt. Eindstand " + sc.ned + "-" + sc.jap + ".");
    } else {
      lines.push("🥇 Leider nu: " + lead.name + " (" + lead.total + " pt).");
    }

    var head = "⚽ *BLOW Poule* · NL " + sc.ned + "-" + sc.jap + " " + OPP + (match.minute ? " (" + match.minute + ")" : "");
    var spice = lines.filter(function (l) { return /🎯|✅|🔥|🏁/.test(l); })[0] || lines[0];
    var share = head + "\n" + spice + "\n🥇 Leider: " + lead.name + " (" + lead.total + "pt)\n▶ https://bramovergaag.github.io/Poule/  (🔑 BLOWWK)";

    return { lines: lines, share: share };
  }

  var api = { liveNarrative: liveNarrative };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NARRATIVE = api;
})(typeof window !== "undefined" ? window : globalThis);
