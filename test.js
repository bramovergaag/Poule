/* Sanity-tests. Run: node test.js */
const fs = require("fs");
const cp = require("child_process");
const SCORING = require("./scoring.js");
const LIVE = require("./live.js");
const NARRATIVE = require("./narrative.js");
const { SEED, PLAYERS } = require("./predictions.js");
const PREDICTIONS = SEED["760425"];

let fails = 0;
function ok(name, cond) { console.log((cond ? "✓" : "✗ FOUT") + "  " + name); if (!cond) fails++; }

// 1) syntaxcheck van alle inline scripts (slot + app) + modules
const html = fs.readFileSync(__dirname + "/index.html", "utf8");
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((x) => x[1]).filter((s) => /\(function\s*\(\)\s*\{/.test(s));
ok("index.html bevat slot + app script", blocks.length >= 2);
blocks.forEach((b, i) => { fs.writeFileSync("/tmp/poule_block_" + i + ".js", b); cp.execSync("node --check /tmp/poule_block_" + i + ".js"); });
ok("alle inline scripts: syntax OK (" + blocks.length + ")", true);
["live.js", "scoring.js", "narrative.js", "predictions.js"].forEach(function (f) { cp.execSync("node --check " + __dirname + "/" + f); });
ok("modules: syntax OK", true);

// 2) naam-matching
ok("Gakpo ~ Cody Gakpo", SCORING.nameMatch("Gakpo", "Cody Gakpo"));
ok("Rijnders ~ Tijjani Reijnders (1 tikfout)", SCORING.nameMatch("Rijnders", "Tijjani Reijnders"));
ok("Ueda ~ Ayase Ueda", SCORING.nameMatch("Ueda", "Ayase Ueda"));
ok("Gakpo != Memphis Depay", !SCORING.nameMatch("Gakpo", "Memphis Depay"));

// 3) live-mapping op de échte ESPN-fixture (event 760425, NED-JAP)
const sb = JSON.parse(fs.readFileSync(__dirname + "/.fixture-scoreboard.json", "utf8"));
const ev = (sb.events || []).find((e) => e.id === "760425");
const mapped = LIVE.mapEvent(ev);
ok("mapEvent: eventId 760425", mapped && mapped.eventId === "760425");
ok("mapEvent: tegenstander = Japan", mapped && /japan/i.test(mapped.opp.name));
ok("mapEvent: NED-slot = Nederland", mapped && /nether/i.test(mapped.ned.name));
ok("mapEvent: score 0-0 (snapshot)", mapped && mapped.score.ned === 0 && mapped.score.jap === 0);

// 4) scoring met ESPN-stijl volledige namen
const espnMatch = { source: "espn", status: "finished", score: { ned: 2, jap: 1 },
  opp: { abbr: "JPN", name: "Japan" }, goals: [
    { team: "NED", scorer: "Denzel Dumfries", minute: 28 },
    { team: "JAP", scorer: "Ayase Ueda", minute: 40 },
    { team: "NED", scorer: "Cody Gakpo", minute: 75 }
  ]};
const rows = SCORING.standings(PREDICTIONS, espnMatch);
const lynn = rows.find((r) => r.name === "Lynn");
ok("Lynn = 15pt (maker+minuut+stand)", lynn.total === 15);

// 5) narratief
const nGoal = NARRATIVE.liveNarrative(PREDICTIONS, espnMatch, SCORING);
ok("narratief: maker → Dumfries-tippers", nGoal.lines.join(" ").includes("Lynn") && nGoal.lines.join(" ").includes("Simone"));
ok("narratief: gebruikt tegenstander-afkorting JPN", nGoal.lines.join(" ").includes("JPN"));
const nEmpty = NARRATIVE.liveNarrative([], { status: "scheduled", goals: [], opp: { abbr: "SWE" } }, SCORING);
ok("narratief: lege poule → 'doe mee'-oproep", nEmpty.lines.join(" ").toLowerCase().includes("inzendingen"));

// 6) seed + players aanwezig
ok("SEED 760425 heeft 12 inzendingen", PREDICTIONS.length === 12);
ok("A-Team en Anthony Das in seed", PREDICTIONS.some(p=>p.name==="A-Team") && PREDICTIONS.some(p=>p.name==="Anthony Das"));
ok("PLAYERS.NED gevuld", (PLAYERS.NED||[]).length > 5);

console.log("\n" + (fails ? (fails + " test(s) GEFAALD") : "Alle tests OK"));
process.exit(fails ? 1 : 0);
