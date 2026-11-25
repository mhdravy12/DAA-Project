/* ===== DATA ===== */
const SAMPLE = [
	[1, "Mbah Wongso", "L", 1900],
	[2, "Mbah Sarinah", "P", 1905],
	[3, "Mbah Karto", "L", 1898],
	[4, "Mbah Painem", "P", 1903],
	[5, "Sastro", "L", 1925, 1, 2],
	[6, "Suminten", "P", 1928, 1, 2],
	[7, "Kartiman", "L", 1930, 3, 4],
	[8, "Parinem", "P", 1932, 3, 4],
	[9, "Slamet", "L", 1950, 5, 8],
	[10, "Siti", "P", 1952],
	[11, "Hadi", "L", 1955, 5, 8],
	[12, "Hartini", "P", 1954, 7],
	[13, "Budi", "L", 1978, 9, 10],
	[14, "Ani", "P", 1981, 9, 10],
	[15, "Dewi", "P", 1982, 11, 16],
	[16, "Lastri", "P", 1957],
	[17, "Agus", "L", 1979, null, 12],
].map((r) => ({ id: r[0], nama: r[1], gender: r[2], tahun: 2026 - r[3] || null, ayah: r[4] || null, ibu: r[5] || null }));
let people = SAMPLE.map((p) => ({ ...p })),
	P = {},
	par = {},
	kid = {},
	focus = 13,
	mode = "up",
	rel = null;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
