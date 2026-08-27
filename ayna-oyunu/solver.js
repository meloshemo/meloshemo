// Ayna Oyunu - çözücü (tarayıcı ve Node için ortak)
// Yerleştirilebilir karelerin alt kümelerini artan derinlikte tarar, böylece
// bulunan ilk çözüm aynı zamanda en az aynayı kullanan çözümdür.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./engine.js"));
  else root.Solver = factory(root.Engine);
})(typeof self !== "undefined" ? self : this, function (Engine) {
  function solveWithDepth(board, cells, depth) {
    const placed = {};
    let found = null;
    function rec(index, left) {
      if (found) return;
      if (Object.keys(placed).length === depth) {
        if (Engine.trace(board, placed).solved) found = { ...placed };
        return;
      }
      // Kalan kare sayısı yetmiyorsa dallanmayı bırak.
      if (cells.length - index < left) return;
      for (let i = index; i < cells.length; i++) {
        const key = `${cells[i].x},${cells[i].y}`;
        for (const m of ["/", "\\"]) {
          placed[key] = m;
          rec(i + 1, left - 1);
          delete placed[key];
          if (found) return;
        }
      }
    }
    rec(0, depth);
    return found;
  }

  // En az aynayı kullanan çözümü döndürür; limit içinde çözüm yoksa null.
  function solve(board, limit) {
    const max = limit === undefined ? board.mirrors : limit;
    const cells = Engine.placeableCells(board);
    for (let depth = 0; depth <= max; depth++) {
      const found = solveWithDepth(board, cells, depth);
      if (found) return found;
    }
    return null;
  }

  return { solve };
});
