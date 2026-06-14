/* Sanity-tests. Run: node test.js */
const fs = require("fs");
const cp = require("child_process");
const SCORING = require("./scoring.js");
const LIVE = require("./live.js");
const { PREDICTIONS } = require("./predictions.js");

let fails = 0;
function ok(name, cond) { console.log((cond ? "✓" : "✗ FOUT") + "  " + name); if (!cond) fails++; }

// 1) syntaxcheck van alle inline scripts (slot + app) + live.js
const html = fs.readFileSync(__dirname + "/index.html", "utf8");
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((x) => x[1]).filter((s) => /\(function\s*\(\)\s*\{/.test(s));
ok("index.html bevat slot + app script", blocks.length >= 2);
blocks.forEach((b, i) => {
  fs.writeFileSync("/tmp/poule_block_" + i + ".js", b);
  cp.execSync("node --check /tmp/poule_block_" + i + ".js");
});
ok("alle inline scripts: syntax OK (" + blocks.length + ")", true);
cp.execSync("node --check " + __dirname + "/live.js");
ok("live.js: syntax OK", true);

// 2) naam-matching (ESPN volledige namen vs briefje-achternamen)
ok("Gakpo ~ Cody Gakpo",        SCORING.nameMatch("Gakpo", "Cody Gakpo"));
ok("Dumfries ~ Denzel Dumfries", SCORING.nameMatch("Dumfries", "Denzel Dumfries"));
ok("Malen ~ Donyell Malen",      SCORING.nameMatch("Malen", "Donyell Malen"));
ok("Rijnders ~ Tijjani Reijnders (1 tikfout)", SCORING.nameMatch("Rijnders", "Tijjani Reijnders"));
ok("Ueda ~ Ayase Ueda",          SCORING.nameMatch("Ueda", "Ayase Ueda"));
ok("Gakpo != Memphis Depay",     !SCORING.nameMatch("Gakpo", "Memphis Depay"));

// 3) live-mapping op de échte ESPN-fixture
const sb = JSON.parse(fs.readFileSync(__dirname + "/.fixture-scoreboard.json", "utf8"));
const mapped = LIVE.mapScoreboard(sb);
ok("mapScoreboard vindt NED-JAP event", mapped && mapped.eventId === "760425");
ok("status = live", mapped && mapped.status === "live");
ok("stand 0-0", mapped && mapped.score.ned === 0 && mapped.score.jap === 0);

// 4) scoring met ESPN-stijl volledige namen (Dumfries scoort 1e in 28', eind 2-1)
const espnMatch = { source: "espn", status: "finished", score: { ned: 2, jap: 1 }, goals: [
  { team: "NED", scorer: "Denzel Dumfries", minute: 28 },
  { team: "JAP", scorer: "Ayase Ueda", minute: 40 },
  { team: "NED", scorer: "Cody Gakpo", minute: 75 }
]};
const rows = SCORING.standings(PREDICTIONS, espnMatch);
const lynn = rows.find(r => r.name === "Lynn");
ok("Lynn = 15pt (maker+minuut+stand) ondanks volledige namen", lynn.total === 15);
const top = rows[0];
console.log("\nWinnaar in testscenario: " + top.name + " (" + top.total + "pt)");

// 5) live-narratief
const NARRATIVE = require("./narrative.js");
cp.execSync("node --check " + __dirname + "/narrative.js");
ok("narrative.js: syntax OK", true);

const nSched = NARRATIVE.liveNarrative(PREDICTIONS, { status: "scheduled", goals: [], minute: "" }, SCORING);
ok("scheduled: maker-kandidaten genoemd", nSched.lines.join(" ").includes("Dumfries") && nSched.lines.join(" ").includes("Gakpo"));
ok("share bevat link + wachtwoord", nSched.share.includes("github.io/Poule") && nSched.share.includes("BLOWWK"));

const nLive = NARRATIVE.liveNarrative(PREDICTIONS, { status: "live", goals: [], minute: "28'" }, SCORING);
ok("live 28e min: Lynn op de klok (exact)", nLive.lines.join(" ").includes("Lynn (28')"));

const nGoal = NARRATIVE.liveNarrative(PREDICTIONS, { status: "live", score: { ned: 1, jap: 0 },
  goals: [{ team: "NED", scorer: "Denzel Dumfries", scorerShort: "D. Dumfries", minute: 28 }], minute: "29'" }, SCORING);
ok("na 1e goal Dumfries: maker → Dumfries-tippers", nGoal.lines.join(" ").includes("Lynn") && nGoal.lines.join(" ").includes("Simone"));
ok("na 1e goal: vervolg-scenario NL/JP scoort", nGoal.lines.join(" ").includes("NL scoort") && nGoal.lines.join(" ").includes("JP scoort"));

console.log("\n--- voorbeeld live-bericht (1-0, Dumfries 28') ---\n" + nGoal.share);

console.log("\n" + (fails ? (fails + " test(s) GEFAALD") : "Alle tests OK"));
process.exit(fails ? 1 : 0);
