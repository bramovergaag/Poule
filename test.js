/* Sanity-tests. Run: node test.js */
const fs = require("fs");
const cp = require("child_process");
const SCORING = require("./scoring.js");
const LIVE = require("./live.js");
const { PREDICTIONS } = require("./predictions.js");

let fails = 0;
function ok(name, cond) { console.log((cond ? "✓" : "✗ FOUT") + "  " + name); if (!cond) fails++; }

// 1) syntaxcheck van index.html app-script + live.js
const html = fs.readFileSync(__dirname + "/index.html", "utf8");
const m = html.match(/<script>\s*\(function\(\)\{([\s\S]*?)\}\)\(\);\s*<\/script>/);
ok("index.html bevat app-script", !!m);
if (m) {
  const stub =
    "const PLAYERS={NED:[],JAP:[]},PREDICTIONS=[]," +
    "SCORING={liveScore:()=>({ned:0,jap:0}),standings:()=>[],RULES:{}}," +
    "LIVE={fetchMatch:()=>Promise.resolve(null)};" +
    "const el={textContent:'',innerHTML:'',value:'',checked:false,style:{},classList:{toggle(){},add(){},remove(){}},focus(){},appendChild(){},addEventListener(){},closest(){return null},querySelector(){return null}};" +
    "const document={getElementById:()=>el,querySelectorAll:()=>[],createElement:()=>el,body:{classList:{toggle(){}}}};" +
    "const localStorage={getItem:()=>null,setItem(){},removeItem(){}};const confirm=()=>false;" +
    "const setInterval=()=>0;const setTimeout=()=>0;const fetch=()=>Promise.resolve({json:()=>({})});" +
    "const URL={createObjectURL:()=>'',revokeObjectURL(){}};const Blob=function(){};const location={reload(){}};const window={};";
  fs.writeFileSync("/tmp/poule_app.js", "(function(){" + stub + m[1] + "})();");
  cp.execSync("node --check /tmp/poule_app.js");
  ok("index.html app-script: syntax OK", true);
}
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

console.log("\n" + (fails ? (fails + " test(s) GEFAALD") : "Alle tests OK"));
process.exit(fails ? 1 : 0);
