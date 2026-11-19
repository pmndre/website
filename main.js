// What moves on the page. Nothing here is needed to read it: without this file (or with reduced
// motion asked for) the name reads PMNDRE, the P stands whole and the text is plain.

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => 1 - (1 - t) ** 3;
const smooth = (t) => t * t * (3 - 2 * t);

const hero = $("#hero");
const vision = $("#vision");

// ---------------------------------------------------------------- the name
// POIMANDRE, which loses its vowels and is PMNDRE. It is fitted so that PMNDRE spans the panel;
// POIMANDRE runs past its edge.

const giant = $("[data-name]");
const name = $(".name", giant);
const vowels = $$(".x", giant);
let vowelWidths = vowels.map(() => 0);
let collapse = reduce ? 1 : 0;
let collapseTo = collapse;
let holding = false;

function fitName() {
	giant.style.setProperty("--fs", "100px");
	for (const v of vowels) v.style.width = "auto";
	const at100 = vowels.map((v) => v.getBoundingClientRect().width);
	for (const v of vowels) v.style.width = "0px";
	const w = name.getBoundingClientRect().width;
	const fs = (100 * hero.clientWidth * 1.03) / w;
	giant.style.setProperty("--fs", `${fs}px`);
	vowelWidths = at100.map((x) => (x * fs) / 100);
	drawName();
}

function drawName() {
	const e = smooth(clamp(collapse));
	vowels.forEach((v, i) => {
		v.style.width = `${vowelWidths[i] * (1 - e)}px`;
		v.style.opacity = String(1 - e);
		v.classList.toggle("glitch", e > 0.04 && e < 0.96);
	});
}

if (!reduce) {
	const open = () => ((holding = true), (collapseTo = 0));
	const shut = () => ((holding = false), (collapseTo = 1));
	giant.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && open());
	giant.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && shut());
	giant.addEventListener("click", () => (collapseTo > 0.5 ? open() : shut()));
	// Now and then the vowels come back for a moment, as if it was remembered.
	setInterval(() => {
		if (holding || document.hidden) return;
		collapseTo = 0;
		setTimeout(() => !holding && (collapseTo = 1), 1500);
	}, 11000);
}

// ---------------------------------------------------------------- the P
// Four pieces that come apart as the page scrolls, leaving their outline, and lean toward the pointer.

const mark = $(".mark");
const rings = $(".rings");
const ghost = $(".ghost");
const PIECES = [
	{ el: $(".piece.d"), dx: 0.16, dy: -0.14, rot: 3, depth: 10 },
	{ el: $(".piece.b"), dx: 0.03, dy: 0.12, rot: -9, depth: 22 },
	{ el: $(".piece.c"), dx: -0.24, dy: 0.05, rot: -14, depth: 30 },
	{ el: $(".piece.a"), dx: 0.07, dy: 0.3, rot: 11, depth: 16 },
];
const fill = $(".hatch .fill");
const light = $(".light");

// ---------------------------------------------------------------- the vision
// Every word of the text is veiled by signs. It is seen near the eye (the pointer's lens) and on
// the line the page scrolls through, and veils itself again a moment later. A few phrases, once
// passed, stay seen.

const GLYPHS = [..."░▒▓▖▗▘▝▚▞◆◇◈○◌●◐◑◒◓◢◣◤◥△▽☉☽☿♀♂♃♄∴∵⊕⊗⌖"];
const veil = $("[data-veil]");
const lens = $(".lens");
const lensLabel = $(".lens span");
const scan = $(".scan");
const scanPct = $(".scan .pct");
const big = $(".big span");
const words = [];

function wrap(node, key) {
	for (const child of [...node.childNodes]) {
		if (child.nodeType === Node.ELEMENT_NODE) {
			wrap(child, key || child.tagName === "EM");
			continue;
		}
		if (child.nodeType !== Node.TEXT_NODE) continue;
		const frag = document.createDocumentFragment();
		for (const part of child.textContent.split(/(\s+)/)) {
			if (!part) continue;
			if (/^\s+$/.test(part)) {
				frag.append(part);
				continue;
			}
			const el = document.createElement("span");
			el.className = key ? "w v k" : "w v";
			el.textContent = part;
			const s = document.createElement("s");
			s.setAttribute("aria-hidden", "true");
			const u = document.createElement("u");
			const q = document.createElement("q");
			s.append(u, q);
			el.append(s);
			frag.append(el);
			const letters = [...part];
			words.push({ el, u, q, letters, a: 0, floor: 0, seen: -1e9, key, shown: -1, x: 0, y: 0 });
		}
		child.replaceWith(frag);
	}
}

const signs = (n) => Array.from({ length: n }, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]).join("");

function measureWords() {
	for (const w of words) {
		const r = w.el.getBoundingClientRect();
		w.x = r.left + r.width / 2 + scrollX;
		w.y = r.top + r.height / 2 + scrollY;
	}
}

function fitBig() {
	big.style.setProperty("--vs", "100px");
	const h = big.getBoundingClientRect().height;
	big.style.setProperty("--vs", `${(100 * vision.clientHeight * 0.97) / h}px`);
}

if (!reduce) {
	wrap(veil, false);
	for (const w of words) w.q.textContent = signs(w.letters.length);
}

const frags = $(".frags");
$$("li", frags).forEach((li, i) => li.style.setProperty("--i", String(i)));
new IntersectionObserver((seen) => seen.forEach((e) => e.isIntersecting && frags.classList.add("lit")), { threshold: 0.35 }).observe(frags);

// ---------------------------------------------------------------- the loop

const pointer = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0, sx: 0, sy: 0, fine: false, at: -1e9 };
addEventListener("pointermove", (e) => {
	pointer.x = e.clientX;
	pointer.y = e.clientY;
	pointer.fine = e.pointerType === "mouse" || e.pointerType === "pen";
	pointer.at = performance.now();
}, { passive: true });

let sy = scrollY;
let lx = 0;
let ly = 0;
let last = performance.now();
let flicker = 0;
const pad = (n) => String(Math.max(0, Math.round(n))).padStart(4, "0");

function frame(now) {
	const dt = Math.min(0.05, (now - last) / 1000);
	last = now;
	const k = 1 - Math.exp(-dt * 7);
	sy += (scrollY - sy) * k;
	if (Math.abs(scrollY - sy) < 0.1) sy = scrollY;
	const vh = innerHeight;

	// The name.
	const c = collapse + (collapseTo - collapse) * (1 - Math.exp(-dt * 4.5));
	if (Math.abs(c - collapse) > 1e-4) {
		collapse = c;
		drawName();
	}

	// The P, the rings, the light.
	const heroH = hero.offsetHeight;
	const hp = ease(clamp(sy / (heroH * 0.85)));
	pointer.nx += ((pointer.x / innerWidth) * 2 - 1 - pointer.nx) * k;
	pointer.ny += ((pointer.y / vh) * 2 - 1 - pointer.ny) * k;
	const S = mark.offsetWidth;
	for (const p of PIECES) {
		const x = p.dx * S * hp + pointer.nx * p.depth;
		const y = p.dy * S * hp + pointer.ny * p.depth;
		p.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${(p.rot * hp).toFixed(2)}deg)`;
	}
	ghost.style.setProperty("--ghost", (clamp(hp * 4) * 0.9).toFixed(3));
	rings.style.transform = `rotate(${(sy * 0.05).toFixed(2)}deg) scale(${(1 + hp * 0.12).toFixed(3)})`;
	name.style.transform = `translate3d(${(-hp * hero.clientWidth * 0.1).toFixed(1)}px, 0, 0)`;
	const total = document.documentElement.scrollHeight - vh;
	fill.style.setProperty("--v", Math.max(0.04, total > 0 ? sy / total : 0).toFixed(4));
	const hr = hero.getBoundingClientRect();
	light.style.setProperty("--lx", `${pointer.x - hr.left}px`);
	light.style.setProperty("--ly", `${pointer.y - hr.top}px`);

	// The vision.
	const vr = vision.getBoundingClientRect();
	const top = vr.top + scrollY;
	const left = vr.left + scrollX;
	if (vr.bottom > 0 && vr.top < vh) {
		big.style.setProperty("--dy", `${((vr.top - vh / 2) * -0.16).toFixed(1)}px`);
		if (!reduce) see(now, dt, vh, vr, top, left);
	} else {
		lens.classList.remove("on");
		scan.classList.remove("on");
	}

	requestAnimationFrame(frame);
}

function see(now, dt, vh, vr, top, left) {
	const over = pointer.fine && now - pointer.at < 3000 && pointer.y > vr.top && pointer.y < vr.bottom;
	const R = innerWidth < 640 ? 90 : 130;
	lens.style.setProperty("--R", `${R}px`);
	const tx = pointer.x + scrollX;
	const ty = pointer.y + scrollY;
	if (!lens.classList.contains("on")) {
		lx = tx;
		ly = ty;
	}
	lx += (tx - lx) * (1 - Math.exp(-dt * 14));
	ly += (ty - ly) * (1 - Math.exp(-dt * 14));
	lens.classList.toggle("on", over);
	lens.style.transform = `translate3d(${(lx - left).toFixed(1)}px, ${(ly - top).toFixed(1)}px, 0)`;
	lensLabel.textContent = `Visio · X ${pad(lx - left)} · Y ${pad(ly - top)}`;

	// The line: the middle of the window, where the text passes.
	const band = scrollY + vh * 0.5;
	const half = vh * 0.06;
	const inPanel = band > top + 40 && band < top + vr.height - 40;
	scan.classList.toggle("on", inPanel);
	scan.style.transform = `translate3d(0, ${(band - top).toFixed(1)}px, 0)`;
	scanPct.textContent = `${pad(((band - top) / vr.height) * 1000)} / 1000`;

	flicker -= dt;
	const shuffle = flicker <= 0;
	if (shuffle) flicker = 0.09;
	for (const w of words) {
		const onScreen = w.y > scrollY - 40 && w.y < scrollY + vh + 40;
		if (w.key && w.y < scrollY + vh * 0.55) w.floor = 1;
		const near = (over && Math.hypot(w.x - lx, w.y - ly) < R * 0.92) || (inPanel && Math.abs(w.y - band) < half);
		if (near) w.seen = now;
		const target = near || now - w.seen < 1400 ? 1 : w.floor;
		w.a = target > w.a ? Math.min(target, w.a + dt * 3.2) : Math.max(target, w.a - dt * 0.55);
		const n = w.letters.length;
		const k = w.a >= 0.999 ? n : Math.floor(w.a * n);
		if (k === n) {
			if (w.shown !== n) {
				w.el.classList.remove("v");
				w.shown = n;
			}
			continue;
		}
		if (w.shown === n || w.shown === -1) w.el.classList.add("v");
		if (k !== w.shown) {
			w.u.textContent = w.letters.slice(0, k).join("");
			w.q.textContent = signs(n - k);
			w.shown = k;
		} else if (shuffle && onScreen && Math.random() < 0.3) {
			w.q.textContent = signs(n - k);
		}
	}
}

// ---------------------------------------------------------------- start

function layout() {
	fitName();
	fitBig();
	if (!reduce) measureWords();
}

document.fonts.ready.then(() => {
	layout();
	new ResizeObserver(() => layout()).observe(document.body);
	if (!reduce) {
		setTimeout(() => !holding && (collapseTo = 1), 1400);
		requestAnimationFrame((t) => ((last = t), frame(t)));
	}
});
