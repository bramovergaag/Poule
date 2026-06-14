/* Live data via de gratis ESPN-API (geen sleutel, CORS = *) + n8n-koppeling
   voor inzendingen. mapEvent() is puur en testbaar. */
(function (root) {
  "use strict";

  var WK_RANGE = "20260611-20260712"; // hele WK 2026 (groeps- t/m knock-out)
  var SB = function (dates) {
    return "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=" + dates;
  };
  var N8N = "https://overgaagconsultancy.app.n8n.cloud/webhook";

  function isNL(t) {
    var ab = (t.team && t.team.abbreviation || "").toUpperCase();
    return ab === "NED" || /nether|nederl|holland/i.test(t.team && t.team.displayName || "");
  }
  function logo(t) {
    return (t.team && t.team.logo) || (t.team && t.team.logos && t.team.logos[0] && t.team.logos[0].href) || "";
  }
  function parseMinute(disp, value) {
    if (disp) { var m = String(disp).match(/(\d+)/); if (m) return parseInt(m[1], 10); }
    if (value != null) return Math.max(1, Math.ceil(value / 60));
    return null;
  }

  // Zet één ESPN-event om naar ons match-formaat (NED-slot = Nederland, JAP-slot = tegenstander).
  function mapEvent(ev) {
    if (!ev || !ev.competitions || !ev.competitions[0]) return null;
    var c = ev.competitions[0];
    var ned = c.competitors.filter(isNL)[0];
    var opp = c.competitors.filter(function (t) { return !isNL(t); })[0];
    if (!ned || !opp) return null;

    var stateMap = { pre: "scheduled", in: "live", post: "finished" };
    var state = (c.status && c.status.type && c.status.type.state) || "pre";
    var status = stateMap[state] || "scheduled";

    var slot = {}; slot[ned.team.id] = "NED"; slot[opp.team.id] = "JAP";
    var score = { ned: parseInt(ned.score, 10) || 0, jap: parseInt(opp.score, 10) || 0 };

    var goals = (c.details || [])
      .filter(function (d) { return d.scoringPlay && d.type && /goal/i.test(d.type.text); })
      .map(function (d) {
        var a = (d.athletesInvolved && d.athletesInvolved[0]) || {};
        return {
          team: slot[d.team && d.team.id] || "NED",
          scorer: a.fullName || a.displayName || "?",
          scorerShort: a.shortName || a.displayName || "?",
          minute: parseMinute(d.clock && d.clock.displayValue, d.clock && d.clock.value),
          minuteText: (d.clock && d.clock.displayValue) || "",
          ownGoal: !!d.ownGoal, penalty: !!d.penaltyKick, type: (d.type && d.type.text) || "Goal"
        };
      })
      .sort(function (a, b) { return (a.minute || 0) - (b.minute || 0); });

    return {
      source: "espn", eventId: ev.id, status: status, score: score,
      minute: (c.status && c.status.type && (c.status.type.shortDetail || c.status.type.detail)) || "",
      goals: goals, kickoff: ev.date,
      ned: { name: ned.team.displayName, abbr: ned.team.abbreviation, logo: logo(ned) },
      opp: { name: opp.team.displayName, abbr: opp.team.abbreviation, logo: logo(opp) },
      updatedAt: Date.now ? Date.now() : +new Date()
    };
  }

  // Alle Nederland-wedstrijden in het toernooi (voor de kiezer).
  function listNLMatches() {
    return fetch(SB(WK_RANGE), { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (sb) {
      return (sb.events || [])
        .filter(function (e) { return e.competitions && e.competitions[0].competitors.some(isNL); })
        .map(function (e) {
          var m = mapEvent(e);
          return m && { eventId: e.id, date: e.date, opp: m.opp, status: m.status, score: m.score, minute: m.minute };
        })
        .filter(Boolean)
        .sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    });
  }

  // Live data voor één wedstrijd (zoekt het event in het hele WK-bereik).
  function fetchMatch(eventId) {
    return fetch(SB(WK_RANGE), { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (sb) {
      var ev = (sb.events || []).filter(function (e) { return e.id === eventId; })[0];
      return ev ? mapEvent(ev) : null;
    });
  }

  // ---- n8n: inzendingen ophalen / insturen ----
  function getPredictions(matchKey) {
    return fetch(N8N + "/poule-get?match=" + encodeURIComponent(matchKey), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (j) { return (j && j.predictions) || []; })
      .catch(function () { return []; });
  }
  function submitPrediction(p) {
    return fetch(N8N + "/poule-submit", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p)
    }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }

  var api = {
    WK_RANGE: WK_RANGE, N8N: N8N, isNL: isNL, mapEvent: mapEvent,
    listNLMatches: listNLMatches, fetchMatch: fetchMatch,
    getPredictions: getPredictions, submitPrediction: submitPrediction
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LIVE = api;
})(typeof window !== "undefined" ? window : globalThis);
