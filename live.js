/* Live wedstrijddata via de gratis ESPN-API (geen sleutel, CORS = *).
   mapScoreboard(json) is puur en testbaar; fetchMatch() doet de netwerk-call. */
(function (root) {
  "use strict";

  // WK 2026, Groep F — Nederland vs Japan, 14 juni 2026.
  var DATE = "20260614";
  var URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=" + DATE;

  function teamCode(t) {
    var ab = (t.team && t.team.abbreviation || "").toUpperCase();
    var nm = (t.team && t.team.displayName || "");
    if (ab === "NED" || /netherland|nederland|holland/i.test(nm)) return "NED";
    if (ab === "JPN" || /japan/i.test(nm)) return "JAP";
    return ab || "?";
  }

  function parseMinute(disp, value) {
    if (disp) { var m = String(disp).match(/(\d+)/); if (m) return parseInt(m[1], 10); }
    if (value != null) return Math.max(1, Math.ceil(value / 60));
    return null;
  }

  // Zoek het NED–JAP event en zet het om naar ons match-formaat.
  function mapScoreboard(sb) {
    var events = (sb && sb.events) || [];
    var ev = events.find(function (e) {
      var c = e.competitions && e.competitions[0];
      if (!c) return false;
      var codes = c.competitors.map(function (x) { return teamCode(x); });
      return codes.indexOf("NED") >= 0 && codes.indexOf("JAP") >= 0;
    });
    if (!ev) return null;
    var c = ev.competitions[0];
    var stateMap = { pre: "scheduled", in: "live", post: "finished" };
    var state = (c.status && c.status.type && c.status.type.state) || "pre";
    var status = stateMap[state] || "scheduled";

    var idToCode = {}, score = { ned: 0, jap: 0 };
    c.competitors.forEach(function (t) {
      var code = teamCode(t);
      idToCode[t.team.id] = code;
      var s = parseInt(t.score, 10) || 0;
      if (code === "NED") score.ned = s; else if (code === "JAP") score.jap = s;
    });

    var goals = (c.details || [])
      .filter(function (d) { return d.scoringPlay && d.type && /goal/i.test(d.type.text); })
      .map(function (d) {
        var a = (d.athletesInvolved && d.athletesInvolved[0]) || {};
        return {
          team: idToCode[d.team && d.team.id] || "NED",
          scorer: a.fullName || a.displayName || "?",
          scorerShort: a.shortName || a.displayName || "?",
          minute: parseMinute(d.clock && d.clock.displayValue, d.clock && d.clock.value),
          minuteText: (d.clock && d.clock.displayValue) || "",
          ownGoal: !!d.ownGoal, penalty: !!d.penaltyKick,
          type: (d.type && d.type.text) || "Goal"
        };
      })
      .sort(function (a, b) { return (a.minute || 0) - (b.minute || 0); });

    return {
      source: "espn",
      eventId: ev.id,
      status: status,
      score: score,
      minute: (c.status && c.status.type && (c.status.type.shortDetail || c.status.type.detail)) || "",
      goals: goals,
      kickoff: ev.date,
      updatedAt: Date.now()
    };
  }

  function fetchMatch() {
    return fetch(URL, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("ESPN " + r.status); return r.json(); })
      .then(mapScoreboard);
  }

  var api = { URL: URL, DATE: DATE, teamCode: teamCode, parseMinute: parseMinute, mapScoreboard: mapScoreboard, fetchMatch: fetchMatch };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LIVE = api;
})(typeof window !== "undefined" ? window : globalThis);
