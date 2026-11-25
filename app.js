/* ===== UI ===== */
function msg(t, err) {
	const m = $("msg");
	m.textContent = t || "";
	m.className = err ? "err" : "";
}
function opts(filter, empty) {
	return (
		(empty ? `<option value="">${empty}</option>` : "") +
		people
			.filter(filter)
			.map((p) => `<option value="${p.id}">${esc(p.nama)}${p.tahun ? " (" + p.tahun + ")" : ""}</option>`)
			.join("")
	);
}
function fillSelects() {
	const keep = (id) => $(id).value;
	const k = ["fa", "fi", "ra", "rb"].map(keep);
	$("fa").innerHTML = opts((p) => p.gender === "L", "(tidak diisi)");
	$("fi").innerHTML = opts((p) => p.gender === "P", "(tidak diisi)");
	$("ra").innerHTML = opts(() => true);
	$("rb").innerHTML = opts(() => true);
	["fa", "fi", "ra", "rb"].forEach((id, i) => {
		if ([...$(id).options].some((o) => o.value === k[i])) $(id).value = k[i];
	});
	if (!k[3] && people.length > 1) $("rb").selectedIndex = 1;
	$("ff").innerHTML = opts(() => true);
	$("ff").value = focus;
}
function refresh() {
	reindex();
	fillSelects();
	draw();
	info();
}
function draw() {
	if (!P[focus]) {
		focus = people[0] && people[0].id;
	}
	if (!people.length) {
		$("graph").innerHTML = "<p style='padding:20px'>Belum ada data. Tambahkan orang lewat form di kiri.</p>";
		return;
	}
	if (rel) {
		const hl = { nodes: new Set([...rel.ca, ...rel.cb]), lcas: rel.lcas, edges: new Set() };
		[rel.ca, rel.cb].forEach((c) => {
			for (let i = 0; i < c.length - 1; i++) hl.edges.add(c[i + 1] + ">" + c[i]);
		});
		render([rel.a, rel.b], hl);
	} else render([focus]);
}
function pick(id) {
	focus = id;
	rel = null;
	msg("");
	$("ff").value = id;
	draw();
	info();
}
function setMode(m) {
	mode = m;
	draw();
}
function addPerson() {
	const nama = $("fn").value.trim();
	if (!nama) return msg("Isi nama dulu.", 1);
	const id = people.reduce((m, p) => Math.max(m, p.id), 0) + 1;
	people.push({ id, nama, gender: $("fg").value, tahun: +$("fy").value || null, ayah: +$("fa").value || null, ibu: +$("fi").value || null });
	$("fn").value = "";
	$("fy").value = "";
	const np = people[people.length - 1],
		hasP = np.ayah || np.ibu;
	if (hasP) focus = id;
	rel = null;
	refresh();
	msg(
		nama + " ditambahkan" + (hasP ? "." : ", belum punya orang tua sehingga tampilan tidak berpindah. Pilih namanya di “Fokus ke” untuk menyambungkannya."),
	);
}
function findRel() {
	const a = +$("ra").value,
		b = +$("rb").value;
	if (!a || !b) return;
	const r = relation(a, b);
	if (!r) {
		rel = null;
		draw();
		info();
		return msg(P[a].nama + " dan " + P[b].nama + " tidak punya leluhur bersama dalam data ini.", 1);
	}
	rel = { ...r, a, b };
	msg("");
	mode = "up";
	document.querySelector("input[value=up]").checked = true;
	draw();
	info();
}
function saveParents() {
	const a = +$("eA").value || null,
		i = +$("eI").value || null;
	const test = people.map((p) => (p.id === focus ? { ...p, ayah: a, ibu: i } : { ...p }));
	if (hasCycle(test)) return msg("Tidak bisa: perubahan ini membuat seseorang menjadi leluhur dirinya sendiri.", 1);
	people = test;
	rel = null;
	refresh();
	msg("Orang tua " + P[focus].nama + " diperbarui.");
}
function info() {
	const el = $("info");
	if (rel) {
		const l = rel.lcas.map((i) => P[i].nama).join(" dan ");
		el.innerHTML = `<h2>Hasil hubungan</h2><div class="res">${esc(rel.text)}</div>
  <p>Leluhur bersama terdekat: <b>${esc(l)}</b> ★<br>${esc(P[rel.a].nama)}: ${rel.da} generasi ke atas. ${esc(P[rel.b].nama)}: ${rel.db} generasi ke atas.</p>
  <p style="color:var(--muted)">Jalur ke leluhur bersama disorot oranye. Klik nama untuk kembali ke tampilan biasa.</p>`;
		return;
	}
	const p = P[focus];
	if (!p) {
		el.innerHTML = "";
		return;
	}
	const anc = bfs([focus], par).dist,
		des = bfs([focus], kid).dist,
		g = {};
	for (const [id, d] of anc) if (d) (g[d] = g[d] || []).push(P[id].nama);
	const gl =
		Object.keys(g)
			.map((d) => `<div class="gen"><b>${esc(up(+d, "L").replace("Simbah kakung", "Simbah"))}</b>: ${g[d].map(esc).join(", ")}</div>`)
			.join("") || "<p>Tidak ada leluhur tercatat.</p>";
	const nm = (i) => (i ? esc(P[i].nama) : "-");
	el.innerHTML = `<h2>${esc(p.nama)}</h2><dl><dt>Kelamin</dt><dd>${p.gender === "L" ? "Laki-laki" : "Perempuan"}</dd><dt>Lahir</dt><dd>${p.tahun || "-"}</dd><dt>Ayah</dt><dd>${nm(p.ayah)}</dd><dt>Ibu</dt><dd>${nm(p.ibu)}</dd><dt>Leluhur</dt><dd>${anc.size - 1} orang</dd><dt>Keturunan</dt><dd>${des.size - 1} orang</dd></dl>
 <hr><h2>Leluhur per generasi</h2>${gl}
 <hr><h2>Ubah orang tua</h2>
 <label for="eA">Ayah</label><select id="eA">${opts((x) => x.gender === "L" && x.id !== focus, "(tidak diisi)")}</select>
 <label for="eI">Ibu</label><select id="eI">${opts((x) => x.gender === "P" && x.id !== focus, "(tidak diisi)")}</select>
 <button class="alt" onclick="saveParents()">Simpan orang tua</button>`;
	$("eA").value = p.ayah || "";
	$("eI").value = p.ibu || "";
}
function exportJSON() {
	$("json").value = JSON.stringify(people, null, 1);
	msg("JSON ditampilkan. Salin untuk menyimpan.");
}
function importJSON() {
	try {
		const d = JSON.parse($("json").value);
		if (!Array.isArray(d) || !d.length) throw "Data harus berupa daftar orang.";
		const ids = new Set(d.map((p) => p.id));
		if (ids.size !== d.length) throw "Ada id yang sama.";
		for (const p of d) {
			if (!p.nama || !["L", "P"].includes(p.gender)) throw "Setiap orang butuh nama dan gender L/P.";
			for (const x of [p.ayah, p.ibu]) if (x && !ids.has(x)) throw "Orang tua dengan id " + x + " tidak ada.";
		}
		if (hasCycle(d)) throw "Data ditolak: ada siklus (seseorang menjadi leluhur dirinya sendiri).";
		people = d.map((p) => ({ id: p.id, nama: p.nama, gender: p.gender, tahun: p.tahun || null, ayah: p.ayah || null, ibu: p.ibu || null }));
		focus = people[0].id;
		rel = null;
		refresh();
		msg("Data dimuat: " + people.length + " orang.");
	} catch (e) {
		msg(typeof e === "string" ? e : "JSON tidak valid. Periksa format datanya.", 1);
	}
}
function resetSample() {
	people = SAMPLE.map((p) => ({ ...p }));
	focus = 13;
	rel = null;
	refresh();
	msg("Data contoh dimuat.");
}
refresh();
