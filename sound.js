// The sound of the seventeen strips: a small synthesiser in Web Audio. A browser lets a page make
// sound only after a click, a tap or a key, so nothing here starts until `wake()` is called from one.
//
// Each strip is a note of D Phrygian dominant (D Eb F# G A Bb C), the scale that sounds like an old
// temple, from D3 up. A note is a square and a saw a hair apart, an octave below in sine, through a
// resonant low-pass that closes as it fades, then a delay and a dark room. Now and then a note
// glitches: it stutters, jumps an octave for a moment, or loses its bits.

const SCALE = [0, 1, 4, 5, 7, 8, 10];
const D3 = 146.83;
export const NOTES = Array.from({ length: 18 }, (_, i) => D3 * 2 ** ((SCALE[i % 7] + 12 * Math.floor(i / 7)) / 12));
export const NAMES = Array.from({ length: 18 }, (_, i) => ["D", "E♭", "F♯", "G", "A", "B♭", "C"][i % 7] + (3 + Math.floor(i / 7) + (i % 7 === 6 ? 1 : 0)));

let ctx = null;
let master;
let bus;
let crushCurve;
let noise;
let droneNodes = null;
export let analyser = null;
let muted = false;

export const awake = () => !!ctx && ctx.state === "running" && !muted;
export const isMuted = () => muted;

/** Starts the sound; called from a click, a tap or a key. Resolves when it runs. */
export function wake() {
	if (!ctx && !build()) return Promise.resolve();
	return ctx.state === "running" ? Promise.resolve() : ctx.resume().catch(() => {});
}

function build() {
	const AC = window.AudioContext || window.webkitAudioContext;
	if (!AC) return false;
	ctx = new AC();

	master = ctx.createGain();
	master.gain.value = 0.16;
	const comp = ctx.createDynamicsCompressor();
	comp.threshold.value = -18;
	comp.ratio.value = 4;
	analyser = ctx.createAnalyser();
	analyser.fftSize = 2048;
	master.connect(comp).connect(analyser).connect(ctx.destination);

	// Everything goes into the bus: straight on, into an echo that darkens as it repeats, into a room.
	bus = ctx.createGain();
	bus.connect(master);

	const delay = ctx.createDelay(2);
	delay.delayTime.value = 0.36;
	const feedback = ctx.createGain();
	feedback.gain.value = 0.42;
	const dark = ctx.createBiquadFilter();
	dark.type = "lowpass";
	dark.frequency.value = 1600;
	const wet = ctx.createGain();
	wet.gain.value = 0.35;
	bus.connect(delay);
	delay.connect(dark).connect(feedback).connect(delay);
	dark.connect(wet).connect(master);

	const room = ctx.createConvolver();
	room.buffer = impulse(3.2, 2.6);
	const roomGain = ctx.createGain();
	roomGain.gain.value = 0.32;
	bus.connect(room).connect(roomGain).connect(master);

	// Fewer steps than a signal has: what "losing its bits" sounds like.
	crushCurve = new Float32Array(1024);
	for (let i = 0; i < 1024; i++) {
		const x = (i / 1023) * 2 - 1;
		crushCurve[i] = Math.round(x * 5) / 5;
	}

	noise = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
	const d = noise.getChannelData(0);
	for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
	return true;
}

function impulse(seconds, decay) {
	const len = Math.floor(ctx.sampleRate * seconds);
	const buf = ctx.createBuffer(2, len, ctx.sampleRate);
	for (let c = 0; c < 2; c++) {
		const d = buf.getChannelData(c);
		for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay;
	}
	return buf;
}

export function setMuted(m) {
	muted = m;
	if (!ctx) return;
	master.gain.setTargetAtTime(m ? 0 : 0.16, ctx.currentTime, 0.05);
}

/** Plays the note of strip `i` (0 to 17). */
export function tone(i) {
	if (!awake()) return;
	const f = NOTES[i];
	const t = ctx.currentTime + 0.005;
	const len = 1.5;

	const voice = ctx.createGain();
	voice.gain.setValueAtTime(0, t);
	voice.gain.linearRampToValueAtTime(0.5, t + 0.006);
	voice.gain.exponentialRampToValueAtTime(0.18, t + 0.18);
	voice.gain.exponentialRampToValueAtTime(0.0001, t + len);

	const filter = ctx.createBiquadFilter();
	filter.type = "lowpass";
	filter.Q.value = 7;
	filter.frequency.setValueAtTime(Math.min(5200, f * 14), t);
	filter.frequency.exponentialRampToValueAtTime(Math.max(180, f * 1.6), t + 0.9);

	const sq = ctx.createOscillator();
	sq.type = "square";
	sq.frequency.value = f;
	const saw = ctx.createOscillator();
	saw.type = "sawtooth";
	saw.frequency.value = f * 1.007;
	const sub = ctx.createOscillator();
	sub.type = "sine";
	sub.frequency.value = f / 2;
	const sqG = ctx.createGain();
	sqG.gain.value = 0.32;
	const sawG = ctx.createGain();
	sawG.gain.value = 0.22;
	const subG = ctx.createGain();
	subG.gain.value = 0.5;
	sq.connect(sqG).connect(filter);
	saw.connect(sawG).connect(filter);
	sub.connect(subG).connect(voice);

	let head = filter;
	const roll = Math.random();
	if (roll < 0.14) {
		// It loses its bits.
		const crush = ctx.createWaveShaper();
		crush.curve = crushCurve;
		head = filter.connect(crush);
	} else if (roll < 0.28) {
		// It stutters: cut three times, the last cut longest.
		const gate = ctx.createGain();
		for (let k = 0; k < 3; k++) {
			gate.gain.setValueAtTime(0, t + 0.05 + k * 0.07);
			gate.gain.setValueAtTime(1, t + 0.08 + k * 0.07 + k * 0.01);
		}
		head = filter.connect(gate);
	} else if (roll < 0.4) {
		// It jumps an octave for a moment.
		for (const o of [sq, saw]) {
			o.frequency.setValueAtTime(o.frequency.value * 2, t);
			o.frequency.setValueAtTime(o.frequency.value, t + 0.035);
		}
	}
	head.connect(voice);
	voice.connect(bus);

	// A dry digital tick at the start.
	const tick = ctx.createBufferSource();
	tick.buffer = noise;
	const hp = ctx.createBiquadFilter();
	hp.type = "highpass";
	hp.frequency.value = 5000;
	const tickG = ctx.createGain();
	tickG.gain.setValueAtTime(0.12, t);
	tickG.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
	tick.connect(hp).connect(tickG).connect(bus);
	tick.start(t, Math.random() * 0.2, 0.04);

	for (const o of [sq, saw, sub]) {
		o.start(t);
		o.stop(t + len + 0.1);
	}
}

/** A low drone on D and A whose filter breathes; for the hidden fragment. */
export function drone(on) {
	if (!ctx) return;
	const t = ctx.currentTime;
	if (on && !droneNodes) {
		const out = ctx.createGain();
		out.gain.setValueAtTime(0, t);
		out.gain.linearRampToValueAtTime(0.22, t + 3);
		const filter = ctx.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.value = 420;
		filter.Q.value = 9;
		const lfo = ctx.createOscillator();
		lfo.frequency.value = 0.07;
		const depth = ctx.createGain();
		depth.gain.value = 300;
		lfo.connect(depth).connect(filter.frequency);
		const oscs = [73.42, 73.42 * 1.004, 110, 146.83 * 0.998].map((f, i) => {
			const o = ctx.createOscillator();
			o.type = i % 2 ? "square" : "sawtooth";
			o.frequency.value = f;
			const g = ctx.createGain();
			g.gain.value = i === 3 ? 0.08 : 0.16;
			o.connect(g).connect(filter);
			o.start(t);
			return o;
		});
		lfo.start(t);
		filter.connect(out).connect(bus);
		droneNodes = { out, oscs: [...oscs, lfo] };
	} else if (!on && droneNodes) {
		const { out, oscs } = droneNodes;
		droneNodes = null;
		out.gain.cancelScheduledValues(t);
		out.gain.setValueAtTime(out.gain.value, t);
		out.gain.linearRampToValueAtTime(0, t + 1.5);
		for (const o of oscs) o.stop(t + 1.6);
	}
}
