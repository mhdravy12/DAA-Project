/* ===== RENDER SVG ===== */
const CW = 140, RH = 110, NW = 116, NH = 44, LBL = 120;

function render(roots, hl) {
  const adj = mode === "up" ? par : kid;
  const back = mode === "up" ? kid : par;
  const { dist } = bfs(roots, adj);
  const rows = [];

  for (const [id, d] of dist) {
    (rows[d] = rows[d] || []).push(id);
  }

  const X = {};
  rows.forEach((row, d) => {
    const want = {};
    row.forEach((id) => {
      const n = d ? back[id].filter((k) => X[k] !== undefined) : [];
      want[id] = n.length ? n.reduce((s, k) => s + X[k], 0) / n.length : 0;
    });
    if (d) row.sort((u, v) => want[u] - want[v]);
    let prev = -Infinity;
    row.forEach((id) => {
      X[id] = Math.max(want[id], prev + CW);
      prev = X[id];
    });
  });

  const xs = Object.values(X);
  const off = LBL + NW / 2 + 10 - Math.min(...xs);
  for (const id in X) X[id] += off;

  const W = Math.max(...Object.values(X)) + NW / 2 + 20;
  const maxD = rows.length - 1;
  const H = maxD * RH + NH + 60;
  const Y = (id) => {
    const d = dist.get(id);
    return (mode === "up" ? maxD - d : d) * RH + 40;
  };

  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Diagram silsilah">`;
  const hlE = hl ? hl.edges : new Set();

  for (const id of dist.keys()) {
    for (const p of par[id]) {
      if (dist.has(p)) {
        const x1 = X[id];
        const y1 = Y(id) + (mode === "up" ? 0 : NH);
        const x2 = X[p];
        const y2 = Y(p) + (mode === "up" ? NH : 0);
        const m = (y1 + y2) / 2;
        const on = hlE.has(id + ">" + p);
        s += `<path d="M${x1},${y1} C${x1},${m} ${x2},${m} ${x2},${y2}" fill="none" stroke="${on ? "var(--hl)" : "var(--line)"}" stroke-width="${on ? 3.5 : 1.6}"/>`;
      }
    }
  }

  rows.forEach((row, d) => {
    const y = Y(row[0]) + NH / 2 + 4;
    const t = d === 0
      ? (roots.length > 1 ? "Titik awal" : "Fokus")
      : mode === "up"
        ? up(d, "L").replace("Simbah kakung", "Simbah").replace("Bapak", "Bapak/Ibu")
        : down(d);
    s += `<text x="10" y="${y}" font-size="13" fill="var(--muted)">${esc(t)}</text>`;
  });

  for (const id of dist.keys()) {
    const p = P[id];
    const x = X[id] - NW / 2;
    const y = Y(id);
    const isF = roots.includes(id);
    const on = hl && hl.nodes.has(id);
    const star = hl && hl.lcas.includes(id);
    const nm = p.nama.length > 15 ? p.nama.slice(0, 14) + "…" : p.nama;
    s += `<g class="n" tabindex="0" role="button" onclick="pick(${id})" onkeydown="if(event.key==='Enter')pick(${id})"><title>${esc(p.nama)}</title>
  <rect x="${x}" y="${y}" width="${NW}" height="${NH}" rx="8" fill="var(--${p.gender})" stroke="${on ? "var(--hl)" : isF ? "var(--accent)" : "var(--panel)"}" stroke-width="${on || isF ? 4 : 1}"/>
  <text x="${x + NW / 2}" y="${y + 19}" text-anchor="middle" font-size="13" font-weight="600" fill="#fff">${esc(nm)}${star ? " ★" : ""}</text>
  <text x="${x + NW / 2}" y="${y + 35}" text-anchor="middle" font-size="11" fill="#fff" opacity=".85">${p.tahun || "tahun ?"}</text></g>`;
  }

  $("graph").innerHTML = s + "</svg>";
}