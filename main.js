// What moves on the page. Nothing here is needed to read it: without this file (or with reduced
// motion asked for) the name reads PMNDRE, the P stands whole and the text is plain.

import { wake, tone, awake, isMuted, setMuted, drone, sphere, light as dawn, silence, crash, NAMES } from "./sound.js";

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
	// The place that is hovered keeps its size whatever the vowels do: a box that changed with them
	// would leave the pointer at its edge, and the name would open and shut over and over.
	giant.style.height = "";
	giant.style.height = `${giant.offsetHeight}px`;
	drawName();
}

function drawName() {
	const e = smooth(clamp(collapse));
	vowels.forEach((v, i) => {
		v.style.width = `${vowelWidths[i] * (1 - e)}px`;
		v.style.opacity = String(1 - e);
	});
}

if (!reduce) {
	let leaving = 0;
	const open = () => (clearTimeout(leaving), (holding = true), (collapseTo = 0));
	const shut = () => {
		clearTimeout(leaving);
		leaving = setTimeout(() => ((holding = false), (collapseTo = 1)), 180);
	};
	giant.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && open());
	giant.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && shut());
	giant.addEventListener("pointerup", (e) => e.pointerType !== "mouse" && (collapseTo > 0.5 ? open() : ((holding = false), (collapseTo = 1))));
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

// The characters a terminal has: all in JetBrains Mono, so nothing falls back to another font.
const GLYPHS = [..."!<>-_\\/[]{}=+*^?#$%&@~|:;01234567890xABCDEF"];
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

// ---------------------------------------------------------------- the fragments sound
// Each strip is a note, played by a press. Browsers allow sound only after a click, tap or key.

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII"];
// VIII IX X IX VIII VII VIII: up and back down, and a step below home. The ticker at the end says it.
const SECRET = [7, 8, 9, 8, 7, 6, 7];
const soundLabel = $("[data-sound]");
const played = [];
let lastTile = -1;

function label() {
	if (isMuted()) soundLabel.textContent = "♪ Sound off · click for on";
	else if (!played.length) soundLabel.textContent = "♪ Press the fragments, or hold and pass over them";
	else soundLabel.textContent = `♪ ${played.slice(-7).map((i) => ROMAN[i]).join(" · ")}`;
}

const tilesOf = () => $$("li", frags);
function number() {
	tilesOf().forEach((li, i) => {
		li.dataset.i = String(i);
		li.dataset.note = NAMES[i];
		li.style.setProperty("--i", String(i));
	});
}
number();

function strike(i) {
	const li = tilesOf()[i];
	if (!li) return;
	tone(i);
	// What sounds tears the names of the works, the higher the note the harder.
	for (const w of works) w.burst?.(rand(160, 380), 0.45 + (i / 17) * 0.55);
	li.classList.remove("hit", "jit");
	void li.offsetWidth;
	li.classList.add("hit");
	if (Math.random() < 0.25) li.classList.add("jit");
	if (i < 17 && played.at(-1) !== i) {
		played.push(i);
		if (played.length > 24) played.shift();
		if (SECRET.every((n, k) => played.at(k - SECRET.length) === n)) unlock();
	}
	label();
}

// A press plays a strip; held down, the button or the finger plays every strip it passes, as a
// hand on a keyboard would. A pointer that only hovers plays nothing.
const tileAt = (x, y) => document.elementFromPoint(x, y)?.closest(".frags li");
let pressed = false;
frags.addEventListener("pointerdown", (e) => {
	const li = e.target.closest("li");
	if (!li) return;
	const i = +li.dataset.i;
	if (i === 17) return ascend();
	pressed = true;
	lastTile = i;
	wake().then(() => strike(i));
});
addEventListener("pointermove", (e) => {
	if (!pressed || !e.buttons) return;
	const li = tileAt(e.clientX, e.clientY);
	if (!li || +li.dataset.i === lastTile || li.classList.contains("xviii")) return;
	lastTile = +li.dataset.i;
	strike(lastTile);
});
for (const type of ["pointerup", "pointercancel"]) addEventListener(type, () => ((pressed = false), (lastTile = -1)));

// The label turns the sound off and on. What it does depends on how the sound was before this
// press, not after the page-wide wake below has already started it.
let wasOn = false;
soundLabel.addEventListener("pointerdown", () => (wasOn = awake()));
soundLabel.addEventListener("click", () => {
	if (wasOn) {
		setMuted(true);
		drone(false);
	} else {
		setMuted(false);
		wake().then(() => (label(), ascending && ((shown = -2), drone(true))));
	}
	wasOn = awake();
	label();
});
// Any first click, tap or key wakes the sound; a hover cannot. Not a press on the label, which decides itself.
for (const type of ["pointerdown", "keydown", "touchend"]) {
	addEventListener(type, (e) => {
		if (e.target instanceof Element && e.target.closest("[data-sound]")) return;
		if (isMuted()) return;
		wake().then(() => (label(), ascending && ((shown = -2), drone(true))));
	}, { passive: true });
}

// ---------------------------------------------------------------- XVIII, the ascent
// The melody opens it. In the vision, the soul rises through seven spheres and gives back at each
// what it had taken of it, until it reaches the Eighth and is light. So: the page falls away, and
// scrolling climbs through seven turning rings, each a sphere named as Mead's translation (1906)
// names what is given back there. A ring is veiled until it is reached, decodes, adds its note to a
// chord, and swells past. After the seventh the window floods with light; the P stands in it, and
// the pointer is the light that throws its shadows.

const SPHERES = ["Growth and Waning", "Device of Evils", "Guile of the Desires", "Domineering Arrogance", "Unholy Daring", "Striving for Wealth", "Ensnaring Falsehood"];
const ascent = $("#ascent");
const stage = $(".stage", ascent);
const sky = $("canvas", ascent);
const brush = sky.getContext("2d");
const zoneLabel = $("[data-zone]", ascent);
const nameLine = $("[data-name]", ascent);
const subLine = $("[data-sub]", ascent);
let ascending = false;
let rise = 0;
let shown = -2;
let decoding = 0;
let tearUntil = 0;
const glow = { x: innerWidth / 2, y: innerHeight * 0.3 };

function unlock() {
	if (!tilesOf()[17]) {
		const li = document.createElement("li");
		li.className = "xviii";
		li.innerHTML = "<b>XVIII</b><span>The Ascent</span>";
		frags.append(li);
		frags.classList.add("eighteen");
		number();
	}
	ascend();
}

// The panels fall, each with its own delay, tilt and drift; then they are gone.
function fall() {
	const panels = $$("body > .panel");
	panels.forEach((p, i) => {
		const r = p.getBoundingClientRect();
		const seen = r.bottom > 0 && r.top < innerHeight;
		p.style.setProperty("--delay", `${seen ? rand(0, 0.35) : 0}s`);
		p.style.setProperty("--fr", `${rand(-9, 9).toFixed(1)}deg`);
		p.style.setProperty("--fx", `${rand(-80, 80).toFixed(0)}px`);
	});
	document.body.classList.remove("rising");
	document.body.classList.add("fallen");
}

function ascend() {
	if (ascending) return;
	ascending = true;
	rise = 0;
	shown = -2;
	ascent.hidden = false;
	ascent.scrollTop = 0;
	ascent.classList.remove("lit");
	document.documentElement.style.overflow = "hidden";
	crash();
	drone(true);
	tearUntil = performance.now() + 900;
	if (reduce) {
		document.body.classList.add("fallen");
		ascent.style.setProperty("--dark", "1");
		stage.style.setProperty("--show", "1");
	} else {
		fall();
		const t0 = performance.now();
		const fade = (now) => {
			const k = clamp((now - t0) / 1400);
			ascent.style.setProperty("--dark", ease(k).toFixed(3));
			stage.style.setProperty("--show", clamp((now - t0 - 700) / 900).toFixed(3));
			if (k < 1 || now - t0 < 1600) requestAnimationFrame(fade);
		};
		requestAnimationFrame(fade);
	}
	requestAnimationFrame(sky_);
	$("[data-descend]", ascent).focus({ preventScroll: true });
}

function descend() {
	if (!ascending) return;
	ascending = false;
	silence();
	const t0 = performance.now();
	const out = (now) => {
		const k = clamp((now - t0) / 700);
		ascent.style.setProperty("--dark", (1 - k).toFixed(3));
		stage.style.setProperty("--show", (1 - k).toFixed(3));
		if (k < 1) return requestAnimationFrame(out);
		ascent.hidden = true;
		document.documentElement.style.overflow = "";
	};
	requestAnimationFrame(out);
	// The page comes back, block by block.
	$$("body > .panel").forEach((p) => p.style.setProperty("--delay", `${rand(0.1, 0.5).toFixed(2)}s`));
	document.body.classList.add("rising");
	document.body.classList.remove("fallen");
	setTimeout(() => document.body.classList.remove("rising"), 1800);
}

$("[data-descend]", ascent).addEventListener("click", descend);
addEventListener("keydown", (e) => e.key === "Escape" && descend());
ascent.addEventListener("pointermove", (e) => {
	glow.x = e.clientX;
	glow.y = e.clientY;
});

// Which sphere one is in, the chord that goes with it, and the words for it.
function reach(zone) {
	if (zone === shown) return;
	const up = zone > shown;
	shown = zone;
	for (let k = 0; k < 7; k++) sphere(k, k < zone);
	dawn(zone >= 8);
	if (up && zone > 0) tearUntil = performance.now() + 380;
	ascent.classList.toggle("lit", zone >= 8);
	if (zone <= 0) say("", "Scroll to rise", "Seven spheres above");
	else if (zone <= 7) say(`Zone ${ROMAN[zone - 1]} of VII · given back · ${NAMES[zone - 1 + 7]}`, SPHERES[zone - 1], `Zone ${ROMAN[zone - 1]}`);
	else say("as they had been unfolded to him", "the secrets of the invisible", "The Eighth");
}

function say(sub, name, zone) {
	subLine.textContent = sub;
	zoneLabel.textContent = zone;
	const letters = [...name];
	const t0 = performance.now();
	const id = ++decoding;
	const step = (now) => {
		if (id !== decoding) return;
		const k = reduce ? letters.length : Math.floor(clamp((now - t0) / 650) * letters.length);
		nameLine.textContent = letters.slice(0, k).join("");
		if (k < letters.length) {
			const i = document.createElement("i");
			i.textContent = letters.slice(k).map((c) => (c === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join("");
			nameLine.append(i);
			requestAnimationFrame(step);
		} else inkAlign();
	};
	requestAnimationFrame(step);
}

// The drawing: rings that come toward one and swell past, a point of light that grows, then the light.
const P_BLOCKS = [[280, 560, 240, 240], [280, 280, 240, 240], [0, 280, 240, 240], [280, 0, 520, 240], [560, 240, 240, 280]];
function sky_(now) {
	if (!ascending && ascent.hidden) return;
	const dpr = Math.min(2, devicePixelRatio || 1);
	const W = sky.clientWidth;
	const H = sky.clientHeight;
	if (sky.width !== Math.round(W * dpr) || sky.height !== Math.round(H * dpr)) {
		sky.width = Math.round(W * dpr);
		sky.height = Math.round(H * dpr);
	}
	const max = ascent.scrollHeight - ascent.clientHeight;
	const target = max > 0 ? ascent.scrollTop / max : 0;
	rise += (target - rise) * 0.12;
	// Nine stages: below the first sphere, the seven, and the Eighth.
	const z = rise * 8.6;
	reach(z < 0.35 ? 0 : Math.min(8, Math.floor(z - 0.35) + 1));

	brush.setTransform(dpr, 0, 0, dpr, 0, 0);
	brush.clearRect(0, 0, W, H);
	const cx = W / 2;
	const cy = H * 0.44;
	const ref = Math.min(W, H) * 0.3;
	const white = smooth(clamp((z - 7.6) / 0.8));

	// The light at the centre, growing as one rises.
	const core = 2 + z ** 2.2 * 2.2;
	const g = brush.createRadialGradient(cx, cy, 0, cx, cy, core * 6);
	g.addColorStop(0, "rgba(242,242,240,0.95)");
	g.addColorStop(0.2, "rgba(242,242,240,0.35)");
	g.addColorStop(1, "rgba(242,242,240,0)");
	brush.fillStyle = g;
	brush.beginPath();
	brush.arc(cx, cy, core * 6, 0, Math.PI * 2);
	brush.fill();

	for (let k = 6; k >= 0; k--) {
		const d = z - (k + 1);
		const r = ref * Math.pow(2.3, d);
		if (r < 6 || r > Math.hypot(W, H) * 1.4) continue;
		const alpha = (d < 0 ? clamp(1 + d * 0.45) : clamp(1 - d * 0.9)) * (1 - white);
		if (alpha <= 0.01) continue;
		ring(cx, cy, r, k, clamp((d + 0.7) / 0.6), alpha, now);
	}

	if (white > 0) {
		brush.fillStyle = `rgba(242,242,240,${white})`;
		brush.fillRect(0, 0, W, H);
		if (white > 0.5) shadows(cx, cy, Math.min(W, H) * 0.22, (white - 0.5) * 2);
	}
	if (now < tearUntil && !reduce) tear(W, H, dpr);
	requestAnimationFrame(sky_);
}

// One sphere: its circle, ticks, and its name around it, veiled until it is reached.
function ring(cx, cy, r, k, decoded, alpha, now) {
	brush.save();
	brush.translate(cx, cy);
	brush.globalAlpha = alpha;
	brush.strokeStyle = "rgba(242,242,240,0.5)";
	brush.lineWidth = 1;
	brush.beginPath();
	brush.arc(0, 0, r, 0, Math.PI * 2);
	brush.stroke();
	brush.setLineDash([1, 9]);
	brush.lineWidth = 8;
	brush.strokeStyle = "rgba(242,242,240,0.25)";
	brush.beginPath();
	brush.arc(0, 0, r * 1.06, 0, Math.PI * 2);
	brush.stroke();
	brush.setLineDash([]);

	const fs = Math.max(9, Math.min(64, r * 0.07));
	brush.font = `500 ${fs}px "JetBrains Mono", monospace`;
	brush.textAlign = "center";
	brush.textBaseline = "middle";
	const text = `${ROMAN[k]} · ${SPHERES[k].toUpperCase()} · `;
	const step = (fs * 0.66) / (r * 0.98);
	const count = Math.min(260, Math.floor((Math.PI * 2) / step));
	const turn = now / 1000 * (0.05 + k * 0.012) * (k % 2 ? -1 : 1);
	const settled = Math.floor(decoded * count);
	for (let i = 0; i < count; i++) {
		const a = turn + i * step;
		const x = Math.cos(a) * r * 0.98;
		const y = Math.sin(a) * r * 0.98;
		if (Math.abs(x + cx - cx) > cx + 40 && Math.abs(y) > cy + 40) continue;
		const c = i < settled ? text[i % text.length] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
		brush.fillStyle = i < settled ? "rgba(242,242,240,0.95)" : "rgba(242,242,240,0.38)";
		brush.save();
		brush.translate(x, y);
		brush.rotate(a + Math.PI / 2);
		brush.fillText(c, 0, 0);
		brush.restore();
	}
	brush.restore();
}

// The light: the P stands in it, and the pointer, the source of the light, throws its shadow far.
function shadows(cx, cy, size, k) {
	const s = size / 800;
	const ox = cx - size / 2;
	const oy = cy - size / 2;
	const lx = glow.x;
	const ly = glow.y;
	brush.save();
	brush.globalAlpha = k;
	brush.fillStyle = "#c9c9c6";
	for (const [bx, by, bw, bh] of P_BLOCKS) {
		const pts = [[ox + bx * s, oy + by * s], [ox + (bx + bw) * s, oy + by * s], [ox + (bx + bw) * s, oy + (by + bh) * s], [ox + bx * s, oy + (by + bh) * s]];
		for (let i = 0; i < 4; i++) {
			const [ax, ay] = pts[i];
			const [bx2, by2] = pts[(i + 1) % 4];
			const far = 4000;
			const fa = Math.hypot(ax - lx, ay - ly) || 1;
			const fb = Math.hypot(bx2 - lx, by2 - ly) || 1;
			brush.beginPath();
			brush.moveTo(ax, ay);
			brush.lineTo(bx2, by2);
			brush.lineTo(bx2 + ((bx2 - lx) / fb) * far, by2 + ((by2 - ly) / fb) * far);
			brush.lineTo(ax + ((ax - lx) / fa) * far, ay + ((ay - ly) / fa) * far);
			brush.closePath();
			brush.fill();
		}
	}
	brush.fillStyle = "#141414";
	for (const [bx, by, bw, bh] of P_BLOCKS) brush.fillRect(ox + bx * s, oy + by * s, bw * s, bh * s);
	// The source itself.
	brush.fillStyle = "#f2f2f0";
	brush.beginPath();
	brush.arc(lx, ly, 5, 0, Math.PI * 2);
	brush.fill();
	brush.strokeStyle = "#141414";
	brush.lineWidth = 1;
	brush.stroke();
	brush.restore();
}

// Crossing a sphere tears the picture: strips of it shifted sideways for a moment.
function tear(W, H, dpr) {
	for (let n = 0; n < 7; n++) {
		const y = rand(0, H);
		const h = rand(2, 40);
		const dx = rand(-60, 60);
		brush.setTransform(1, 0, 0, 1, 0, 0);
		brush.drawImage(sky, 0, y * dpr, W * dpr, h * dpr, dx * dpr, y * dpr, W * dpr, h * dpr);
	}
	brush.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ---------------------------------------------------------------- the grid, to the ink
// A letter stands a little to the right of where its box begins, more the bigger it is. Big type
// is pulled left by that much, so that its ink, not its box, stands on the column's line.

const meter = document.createElement("canvas").getContext("2d");
const stretchWord = (p) => (p <= 56 ? "ultra-condensed" : p <= 68 ? "extra-condensed" : p <= 81 ? "condensed" : p <= 93 ? "semi-condensed" : p <= 106 ? "normal" : p <= 118 ? "semi-expanded" : p <= 137 ? "expanded" : "extra-expanded");
function inkAlign() {
	for (const el of $$("[data-ink]")) {
		const text = el.textContent.trim();
		if (!text || !el.offsetParent) continue;
		const cs = getComputedStyle(el);
		meter.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
		if ("fontStretch" in meter) meter.fontStretch = stretchWord(parseFloat(cs.fontStretch) || 100);
		const m = meter.measureText(text[0]);
		el.style.marginLeft = `${m.actualBoundingBoxLeft.toFixed(2)}px`;
	}
}

// The works' names: each slides sideways across its band as the band passes through the window,
// pine to the right and pinecone to the left; coming in and going out, the panel's edges cut them.
const works = $$(".work").map((el) => ({ el, wm: $(".wm", el), svg: $(".wm svg", el), dir: +el.dataset.dir, top: 0, h: 0, over: 0, swing: 0 }));
function measureWorks() {
	for (const w of works) {
		const box = w.el.getBoundingClientRect();
		const drawn = w.svg.getBoundingClientRect();
		w.top = box.top + scrollY;
		w.h = box.height;
		const room = box.width - 2 * parseFloat(getComputedStyle(vision).paddingLeft);
		// How far it runs past the band, if it does, and how far it swings around its place.
		w.over = Math.max(0, drawn.width - room);
		w.swing = box.width * 0.3;
		// A hairline whatever the scale: 1.2 pixels, in the units of the drawing.
		w.wm.style.setProperty("--sw", ((1.2 * 800) / drawn.height).toFixed(2));
	}
}
function driftWorks(vh) {
	for (const w of works) {
		const top = w.top - sy;
		if (top > vh || top + w.h < 0) continue;
		// t is ½ when the band stands in the middle of the window: there the name stands whole on the
		// column line (or, longer than the band, is carried from its first letter to its last).
		const t = clamp((vh - top) / (vh + w.h));
		const x = w.dir * (t - 0.5) * w.swing - w.over * clamp((t - 0.25) / 0.5);
		w.wm.style.setProperty("--x", `${x.toFixed(1)}px`);
	}
}

// The tear. Five copies of a name, solid and outline mixed, each shown as a slice of random height
// thrown sideways; now and then one leaps far or is stretched. Bars cross the band and invert what
// they cover, and the name itself jolts or drops out for a frame. Every frame is drawn at random, so
// it never repeats as a loop would. A burst comes when a fragment sounds, and only then.
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (p) => Math.random() < p;
function glitcher(w) {
	const base = w.svg;
	const layers = Array.from({ length: 5 }, (_, k) => {
		const copy = base.cloneNode(true);
		copy.removeAttribute("role");
		copy.removeAttribute("aria-label");
		copy.setAttribute("aria-hidden", "true");
		copy.classList.add("echo", (k % 2 === 0) === w.el.classList.contains("hollow") ? "solid" : "line");
		w.wm.append(copy);
		return copy;
	});
	const bars = Array.from({ length: 4 }, () => {
		const bar = document.createElement("i");
		bar.className = "bar";
		w.wm.append(bar);
		return bar;
	});
	let timer = 0;

	function shake(force) {
		const width = base.getBoundingClientRect().width;
		for (const layer of layers) {
			if (!pick(0.3 + 0.5 * force)) {
				layer.style.opacity = "0";
				continue;
			}
			const top = rand(-5, 95);
			const h = rand(1.5, 6 + 34 * force);
			let dx = (Math.random() - 0.5) * width * 0.12 * force;
			if (pick(0.18)) dx += (Math.random() - 0.5) * width * 0.6 * force;
			layer.style.clipPath = `inset(${top.toFixed(1)}% 0 ${Math.max(0, 100 - top - h).toFixed(1)}% 0)`;
			layer.style.translate = `${dx.toFixed(1)}px ${pick(0.15) ? rand(-6, 6).toFixed(1) : 0}px`;
			layer.style.scale = pick(0.22) ? `${rand(1.05, 1.6).toFixed(2)} 1` : "";
			layer.style.opacity = "1";
		}
		for (const bar of bars) {
			if (!pick(0.25 + 0.45 * force)) {
				bar.style.opacity = "0";
				continue;
			}
			const left = rand(-20, 80);
			bar.style.top = `${rand(0, 100).toFixed(1)}%`;
			bar.style.left = `${left.toFixed(1)}%`;
			bar.style.width = `${rand(10, 120).toFixed(1)}%`;
			bar.style.height = `${pick(0.3) ? rand(6, 22).toFixed(0) : rand(1, 3).toFixed(0)}px`;
			bar.style.opacity = "1";
		}
		base.style.translate = pick(0.45) ? `${((Math.random() - 0.5) * width * 0.04 * force).toFixed(1)}px 0` : "";
		base.style.opacity = pick(0.1 * force) ? "0" : "";
		base.style.clipPath = pick(0.12 * force) ? `inset(0 0 ${rand(20, 70).toFixed(0)}% 0)` : "";
	}
	function calm() {
		for (const layer of layers) layer.style.opacity = "0";
		for (const bar of bars) bar.style.opacity = "0";
		base.style.translate = base.style.opacity = base.style.clipPath = "";
	}
	function burst(length, force) {
		clearTimeout(timer);
		const end = performance.now() + length;
		const step = () => {
			if (performance.now() > end) {
				calm();
				return;
			}
			shake(force);
			timer = setTimeout(step, rand(24, 80));
		};
		step();
	}
	// It tears only when a fragment sounds (strike).
	w.burst = burst;
}
if (!reduce) works.forEach(glitcher);

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
let fast = 0;
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

	driftWorks(vh);

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

	// A word that is being decoded runs through new signs every few hundredths of a second; one that
	// stays veiled only now and then.
	fast -= dt;
	flicker -= dt;
	const tick = fast <= 0;
	const shuffle = flicker <= 0;
	if (tick) fast = 0.045;
	if (shuffle) flicker = 0.14;
	for (const w of words) {
		const onScreen = w.y > scrollY - 40 && w.y < scrollY + vh + 40;
		if (w.key && w.y < scrollY + vh * 0.55) w.floor = 1;
		const near = (over && Math.hypot(w.x - lx, w.y - ly) < R * 0.92) || (inPanel && Math.abs(w.y - band) < half);
		if (near) w.seen = now;
		const target = near || now - w.seen < 1400 ? 1 : w.floor;
		const moving = target !== w.a;
		w.a = target > w.a ? Math.min(target, w.a + dt * 2.4) : Math.max(target, w.a - dt * 0.55);
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
		} else if (onScreen && ((moving && tick) || (shuffle && Math.random() < 0.25))) {
			w.q.textContent = signs(n - k);
		}
	}
}

// ---------------------------------------------------------------- start

function layout() {
	inkAlign();
	measureWorks();
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
