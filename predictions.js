/* BLOW POULE — voorspellingen Nederland (NED) – Japan (JAP)
   scorer = 1e doelpuntenmaker, minute = minuut 1e doelpunt, h = NED, a = JAP.
   ⚠️ Uit handschrift overgenomen — controleer de namen met ⚠️. */
(function (root) {
  "use strict";
  var PREDICTIONS = [
    { name: "Martin",           scorer: "Gakpo",    minute: 23, h: 2, a: 0 },
    { name: "Simone",           scorer: "Dumfries", minute: 36, h: 2, a: 0 },
    { name: "Jacobus",          scorer: "Rijnders", minute: 19, h: 3, a: 1 },
    { name: "Rob",              scorer: "Malen",    minute: 35, h: 2, a: 1 }, // ⚠️ naam onzeker
    { name: "Chris",            scorer: "Malen",    minute: 18, h: 2, a: 1 },
    { name: "Daud",             scorer: "Rijnders", minute: 12, h: 4, a: 1 }, // ⚠️ naam onzeker
    { name: "Floris",           scorer: "Dumfries", minute: 30, h: 1, a: 1 },
    { name: "Lynn",             scorer: "Dumfries", minute: 28, h: 2, a: 1 },
    { name: "Team Colombia",    scorer: "Ueda",     minute: 10, h: 1, a: 2 },
    { name: "?",                scorer: "Gakpo",    minute: 53, h: 1, a: 1 }, // ⚠️ naam ontbrak
    { name: "Anthony (A-Team)", scorer: "Malen",    minute: 42, h: 2, a: 1 },
    { name: "Stella",           scorer: "Gakpo",    minute: 25, h: 1, a: 1 }  // ⚠️ naam onzeker
  ];

  var PLAYERS = {
    NED: ["Gakpo", "Dumfries", "Malen", "Reijnders", "Depay", "Xavi Simons", "Weghorst", "Frimpong", "Koopmeiners", "Bergwijn", "Gravenberch", "Gakpo"],
    JAP: ["Ueda", "Mitoma", "Kubo", "Doan", "Minamino", "Ito", "Endo", "Kamada", "Asano"]
  };

  var data = { PREDICTIONS: PREDICTIONS, PLAYERS: PLAYERS };
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  else { root.PREDICTIONS = PREDICTIONS; root.PLAYERS = PLAYERS; }
})(typeof window !== "undefined" ? window : globalThis);
