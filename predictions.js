/* BLOW POULE — seed-voorspellingen per ESPN-wedstrijd (event-id).
   Het briefje (handschrift) hoort bij NED–JAP = event 760425.
   Voor andere wedstrijden komen de voorspellingen volledig uit de inzendingen (n8n).
   scorer = 1e maker, minute = minuut 1e goal, h = NED, a = tegenstander. */
(function (root) {
  "use strict";

  var SEED = {
    "760425": [
      { name: "Martin",      scorer: "Gakpo",    minute: 23, h: 2, a: 0 },
      { name: "Simone",      scorer: "Dumfries", minute: 36, h: 2, a: 0 },
      { name: "Jacobus",     scorer: "Rijnders", minute: 19, h: 3, a: 1 },
      { name: "Rob",         scorer: "Malen",    minute: 35, h: 2, a: 1 },
      { name: "Chris",       scorer: "Malen",    minute: 18, h: 2, a: 1 },
      { name: "Daud",        scorer: "Rijnders", minute: 12, h: 4, a: 1 },
      { name: "Floris",      scorer: "Dumfries", minute: 30, h: 1, a: 1 },
      { name: "Lynn",        scorer: "Dumfries", minute: 28, h: 2, a: 1 },
      { name: "Team Colombia", scorer: "Ueda",   minute: 10, h: 1, a: 2 },
      { name: "A-Team",      scorer: "Gakpo",    minute: 53, h: 1, a: 1 },
      { name: "Anthony Das", scorer: "Malen",    minute: 42, h: 2, a: 1 },
      { name: "Stella",      scorer: "Gakpo",    minute: 25, h: 1, a: 1 }
    ]
  };

  // Spelers voor de keuzelijst bij 'doe mee' (hint; vrije invoer mag ook).
  var PLAYERS = {
    NED: ["Gakpo", "Dumfries", "Malen", "Reijnders", "Depay", "Xavi Simons", "Weghorst", "Frimpong", "Koopmeiners", "Bergwijn", "Gravenberch", "Van Dijk", "Memphis"],
    OPP: ["Ueda", "Mitoma", "Kubo", "Doan", "Minamino", "Ito", "Endo", "Nakamura", "Isak", "Gyökeres", "Forsberg", "Khazri", "Msakni"]
  };

  var data = { SEED: SEED, PLAYERS: PLAYERS };
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  else { root.SEED = SEED; root.PLAYERS = PLAYERS; }
})(typeof window !== "undefined" ? window : globalThis);
