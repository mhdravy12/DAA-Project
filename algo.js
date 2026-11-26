/* ===== ALGORITMA ===== */
// Adjacency list: par = naik ke orang tua, kid = turun ke anak
function build(list) {
  const P = {}, par = {}, kid = {};
  list.forEach((p) => {
    P[p.id] = p;
    par[p.id] = [];
    kid[p.id] = [];
  });
  list.forEach((p) =>
    [p.ayah, p.ibu].forEach((x) => {
      if (x && P[x]) {
        par[p.id].push(x);
        kid[x].push(p.id);
      }
    })
  );
  return { P, par, kid };
}

function reindex() {
  ({ P, par, kid } = build(people));
}

// DFS 3 warna: 1 = sedang diproses, 2 = selesai. Bertemu node berwarna 1 berarti siklus.
function hasCycle(list) {
  const g = build(list), st = {};
  const dfs = (u) => {
    st[u] = 1;
    for (const v of g.kid[u]) {
      if (st[v] === 1) return true;
      if (!st[v] && dfs(v)) return true;
    }
    st[u] = 2;
    return false;
  };
  return list.some((p) => !st[p.id] && dfs(p.id));
}

// BFS multi-sumber: jarak (generasi) dan penunjuk balik untuk merekonstruksi jalur
function bfs(roots, adj) {
  const dist = new Map(), prev = new Map(), q = [];
  roots.forEach((r) => {
    dist.set(r, 0);
    q.push(r);
  });
  for (let i = 0; i < q.length; i++) {
    const u = q[i];
    for (const v of adj[u]) {
      if (!dist.has(v)) {
        dist.set(v, dist.get(u) + 1);
        prev.set(v, u);
        q.push(v);
      }
    }
  }
  return { dist, prev };
}

// Jalur dari leluhur `top` turun ke `from`
function chain(prev, from, top) {
  const out = [top];
  let x = top;
  while (x !== from) {
    x = prev.get(x);
    out.push(x);
  }
  return out;
}

// Leluhur bersama terdekat: leluhur bersama dengan jumlah jarak terpendek minimum.
// Kompleksitas O(V+E): dua BFS dan dua pemindaian linear atas leluhur yang terjangkau.
function relation(a, b) {
  const A = bfs([a], par), B = bfs([b], par);
  let sum = Infinity;
  for (const [id, da] of A.dist) {
    const db = B.dist.get(id);
    if (db !== undefined && da + db < sum) sum = da + db;
  }
  if (sum === Infinity) return null;
  const lcas = [...A.dist]
    .filter(([id, da]) => B.dist.has(id) && da + B.dist.get(id) === sum)
    .map(([id]) => id);
  const l = lcas[0], da = A.dist.get(l), db = B.dist.get(l);
  const ca = chain(A.prev, a, l), cb = chain(B.prev, b, l);
  return { lcas, da, db, ca, cb, text: describe(a, b, lcas, da, db, cb) };
}

/* ===== ISTILAH KEKERABATAN ===== */
const UP = ["", "Bapak/Ibu", "Simbah", "Mbah buyut", "Mbah canggah", "Mbah wareng", "Mbah udheg-udheg", "Mbah gantung siwur"];
const DOWN = ["", "Anak", "Putu (cucu)", "Buyut", "Canggah", "Wareng", "Udheg-udheg", "Gantung siwur"];
const up = (n, g) =>
  n === 1
    ? (g === "L" ? "Bapak" : "Ibu")
    : n === 2
      ? "Simbah " + (g === "L" ? "kakung" : "putri")
      : UP[n] || "leluhur " + n + " generasi di atas";
const down = (n) => DOWN[n] || "keturunan " + n + " generasi di bawah";

function describe(a, b, lcas, da, db, cb) {
  const A = P[a].nama, B = P[b].nama;
  if (a === b) return "Itu orang yang sama.";
  if (da === 0) return `${A} adalah ${up(db, P[a].gender)} dari ${B}.`;
  if (db === 0) return `${A} adalah ${down(da)} dari ${B}.`;
  if (da === 1 && db === 1) {
    if (lcas.length > 1) return `${A} dan ${B} adalah saudara kandung.`;
    return `${A} dan ${B} adalah saudara tiri (satu orang tua sama: ${P[lcas[0]].nama}).`;
  }
  if (da === 1) {
    const s = P[cb[1]], pa = P[a];
    if (db === 2) {
      const old = pa.tahun && s.tahun ? pa.tahun < s.tahun : null, L = pa.gender === "L";
      const t = old === null ? (L ? "Paman" : "Bibi") : L ? (old ? "Pakde" : "Paklik") : (old ? "Bude" : "Bulik");
      return `${A} adalah ${t} dari ${B}, saudara dari ${s.nama}.`;
    }
    return `${A} adalah saudara dari ${s.nama}, yaitu ${up(db - 1, s.gender).toLowerCase()} dari ${B}.`;
  }
  if (db === 1) return `${A} adalah ${da === 2 ? "keponakan" : da === 3 ? "cucu keponakan" : "keponakan jauh"} dari ${B}.`;
  if (da === db) {
    const t = ["", "", "sepupu", "misan (sepupu kedua)", "mindoan (sepupu ketiga)"][da] || "sepupu derajat " + (da - 1);
    return `${A} dan ${B} adalah ${t}.`;
  }
  return `${A} dan ${B} adalah kerabat jauh (sepupu derajat ${Math.min(da, db) - 1}, selisih ${Math.abs(da - db)} generasi).`;
}