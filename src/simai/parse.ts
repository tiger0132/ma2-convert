// 由于可能出现的大量变 bpm，中间结果可能非常大。所以这个文件中的所有 tick 都使用 bigint。
// 具体例子：000312_00.ma2

import { SimaiSlideType } from './index';
import { SlideType as Ma2SlideType, SlideType } from '../ma2/RecordId';
import { Ma2File, SimaiLoadConfig } from '@/ma2';
import { gcd, max, notVoid } from '@/lib/utils';
import { ok } from 'assert';
import { Def } from '@/ma2/NotesTypeId';
import { TouchEffectType, TouchSensorType, getSensorType } from '@/ma2/Ma2Record';
import debug from 'debug';
import { Ma2 } from '@/ma2/Ma2Notes';
import { BPMChangeData, ClickData, MeterChangeData } from '@/ma2/Ma2Composition';

type Chars<S extends string> = S extends `${infer C}${infer R}` ? C | Chars<R> : never;
class Reader {
	i = 0;
	get finished() { return this.i >= this.str.length; }
	constructor(private str: string) { }

	peek() { return this.str[this.i]; }
	readChar() {
		const result = [this.str[this.i], this.str.charCodeAt(this.i)] as const;
		return this.i++, result;
	}
	readCharset<const T extends string>(charset: T) {
		let result: Partial<Record<Chars<T>, true>> = {};
		for (; this.i < this.str.length; this.i++) {
			const char = this.str[this.i];
			if (!charset.includes(char)) break;
			result[char as Chars<T>] = true;
		}
		return result;
	}
	readRegex(regex: RegExp) {
		const match = this.str.slice(this.i).match(regex);
		ok(match?.index === 0, `Expect "${regex}", but the string "${this.str.slice(this.i)}" ("${this.str}") didn't match`);
		this.i += match[0].length;
		return match;
	}
	isRegex(regex: RegExp) { return regex.test(this.str.slice(this.i)); }
	expect(s: string) {
		const t = this.str.slice(this.i, this.i + s.length);
		ok(s === t, `Expect "${s}", but found "${t}"`);
		this.i += s.length;
	}
}

type Replace<T extends object, U extends keyof T> = Omit<T, U> & Record<U, bigint>;
type ExtTap = Replace<Ma2.Tap, 'tick'>;
type ExtHold = Replace<Ma2.Hold, 'tick' | 'len'>;
type ExtSlide = Replace<Ma2.Slide, 'tick' | 'wait' | 'shoot'>
type ExtTouchTap = Replace<Ma2.TouchTap, 'tick'>
type ExtTouchHold = Replace<Ma2.TouchHold, 'tick' | 'len'>
type ExtNote = ExtTap | ExtHold | ExtSlide | ExtTouchTap | ExtTouchHold;

type Ma2Cache = {
	notes: (ExtNote & { offsetPseudo?: number })[];
	bpms: Replace<BPMChangeData, 'tick'>[];
	meters: Replace<MeterChangeData, 'tick'>[];
	clicks: Replace<ClickData, 'tick'>[];
};

export const defMap = Object.freeze({
	tap: [Def.Tap, Def.ExTap, Def.Break, Def.ExBreakTap, null, null, null, null, Def.Star, Def.ExStar, Def.BreakStar, Def.ExBreakStar],
	hold: [Def.Hold, Def.ExHold, Def.BreakHold, Def.ExBreakHold],
	slide: [Def.Slide, Def.ExSlide, Def.BreakSlide, Def.ExBreakSlide],
} satisfies Record<string, (Def | null)[]>);

const log = debug('parse');
const BPM_FACTOR = 1e6; // FIXME: 对延迟星星 BPM 误差的处理 workaround。

function getTicks(ma2: Ma2Cache, tick: bigint, denomi: bigint, num: bigint, resolution: bigint): bigint {
	const bpmList = ma2.bpms;
	const curBpmIdx = bpmList.findLastIndex(x => x.tick <= tick);

	// 通分成分母为 res*bpm 的形式
	// num / denomi -> (num*q/denomi) / q
	const q = resolution * BigInt(bpmList[curBpmIdx].bpm * BPM_FACTOR | 0);
	let p = num * q / denomi;
	ok(num * q % denomi === 0n, `${num}/${denomi} cannot be represented as p/${q})}`);

	log('');
	log({ tick, p, q });
	let len = 0n;
	for (let i = curBpmIdx; i < bpmList.length; i++) {
		const { bpm } = bpmList[i];
		const dt = i === bpmList.length - 1 ? // duration as ticks
			null :
			bpmList[i + 1].tick - max(tick, bpmList[i].tick);

		// duration of 1 tick in p/q format
		// bpm2 / (bpm1*res)
		log({ bpm, dt });
		const dp = BigInt(bpm * BPM_FACTOR | 0);
		if (dt !== null && p > dt * dp) {
			p -= dt * dp;
			len += dt;
		} else {
			ok(p % dp === 0n, `wtf ${p} ${dp}`);
			len += p / dp;
			break;
		}
	}
	return len;
}

export function parseSimai(ma2File: Ma2File, str: string, config: Required<SimaiLoadConfig>) {
	str = str.replaceAll(/\s/g, '');

	const ma2: Ma2Cache = {
		notes: [],
		bpms: [],
		meters: [],
		clicks: [],
	};
	let resolution = getResolution();
	parseBPMList(ma2, str, config, resolution); // 提前解析 BPM 以应对跨 BPM hold / slide

	const tickValues: bigint[] = []; // 最后再试图把变 bpm 导致的 resolution 膨胀降下去……
	let tick = 0n, measure = 0n, curBpm = 0, offsetPseudo = 0; // offsetPseudo: 伪双押用的 offset
	for (const section of str.split(',')) {
		if (section === 'E') break;

		const reader = new Reader(section);
		let lastPos = -1, slideFlag = false, sf2 = false; // slideFlag: 判断是不是可能的 fes slide
		while (!reader.finished) {
			const [char, charCode] = reader.readChar();
			slideFlag = sf2, sf2 = false;

			if (char === '*') {
				ok(lastPos !== -1);
				parseSlide({ '!': true }, 0, reader, lastPos), sf2 = true;
				continue;
			}
			if (49 <= charCode && charCode <= 56) { // 1~8
				const pos = charCode - 49; // convert to 0~7
				const modSet = reader.readCharset('bx\$@!?h');
				let mod = (modSet.x ? 1 : 0) | (modSet.b ? 2 : 0) | (modSet.$ ? 8 : 0);

				if (modSet.h)  // Hold
					parseHold(reader, mod, pos);
				else if (reader.isRegex(/^(-|<|>|\^|p|q|s|z|w|v|pp|qq|V)/)) // Slide
					parseSlide(modSet, mod, reader, pos), sf2 = true;
				else // Tap
					parseTap(mod, pos);

				lastPos = pos;
				continue;
			}
			if (65 <= charCode && charCode <= 69) { // A~E
				const pos = parseInt(reader.readRegex(char === 'C' ? /^[12]?/ : /^[12345678]/)[0] ?? '1', 0) - 1;
				const sensor = getSensorType(char);
				const modSet = reader.readCharset('fh');

				if (modSet.h) // Touch Hold
					parseTouchHold(reader, pos, sensor, modSet);
				else  // Touch Tap
					parseTouchTap(pos, sensor, modSet);
				continue;
			}
			switch (char) {
				case '/': // 双押线
					break;
				case '`': // 伪双押
					offsetPseudo += config.pseudoEachTicks;
					break;
				case '(': // BPM
					ok(config.strict && reader.i === 1, 'BPM should be at frontmost');
					curBpm = +reader.readRegex(/\d+(\.\d*)?/)[0]; reader.expect(')');
					tickValues.push(tick);
					break;
				case '{': // Measure
					measure = BigInt(reader.readRegex(/\d+/)[0]); reader.expect('}');
					break;
				default:
					if (slideFlag && '-<>^pqszwvV'.includes(char)) { // ConnectSlide
						reader.i--;

						const pos = (ma2.notes[ma2.notes.length - 1] as ExtSlide).endPos; // convert to 0~7
						parseSlide({}, 0, reader, pos, true), sf2 = true;
					} else {
						if (config.strict) ok(false, `Unexpected character "${char}" from "${section}"`);
					}
			}
		}
		ok(measure !== 0n, 'Measure cannot be 0');

		tick += resolution / measure;
		offsetPseudo = 0;
	}
	const d = gcd(...tickValues, resolution / BigInt(config.resolution));
	resolution /= d;
	ok(Number.isSafeInteger(Number(resolution)), `Resolution too high: ${resolution} is not a safe integer`);
	ma2File.header.resolutionTime = Number(resolution);

	for (const note of ma2.notes) {
		const op = note.offsetPseudo ?? 0;
		note.tick = Number(note.tick / d) + op as any;
		if ('len' in note) note.len = Math.max(0, Number(note.len / d)) as any;
		if ('wait' in note) note.wait = Math.max(0, Number(note.wait / d)) as any;
		if ('shoot' in note) note.shoot = Number(note.shoot / d) as any;
		ma2File.notes.notes.push(note as any);
	}
	ma2File.notes.notes.sort((x, y) => x.tick - y.tick); // 似乎不是必要的，其实只要能认上爹就行
	for (const bpm of ma2.bpms) {
		bpm.tick = Number(bpm.tick / d) as any;
		ma2File.composition.bpmList.push(bpm as any);
	}
	for (const click of ma2.clicks) {
		click.tick = Number(click.tick / d) as any;
		ma2File.composition.clickList.push(click as any);
	}
	for (const met of ma2.meters) {
		met.tick = Number(met.tick / d) as any;
		ma2File.composition.meterList.push(met as any);
	}
	// console.log(...tickValues, resolution / config.resolution);
	// console.log(d);
	// console.log(`Reduced resolution: ${resolution} -> ${ma2.header.resolutionTime}`);

	function getResolution() {
		let resolution = BigInt(config.resolution);
		for (const match of str.matchAll(/\{\d+\}|\[\d+:/g)) {
			const measure = BigInt(match[0].slice(1, -1));
			resolution = resolution * measure / gcd(resolution, measure);
		}
		return resolution;
	}
	function parseTap(mod: number, pos: number) {
		const type = defMap.tap[mod]; ok(notVoid(type), `Unknown tap type "${type}"`);
		ma2.notes.push({ type, pos, tick, offsetPseudo });
		tickValues.push(tick);
	}
	function parseHold(reader: Reader, mod: number, pos: number) {
		let denomi = '1', num = '0';
		if (reader.isRegex(/^\[(\d+):(\d+)\]/))
			[, denomi, num] = reader.readRegex(/^\[(\d+):(\d+)\]/);
		const type = defMap.hold[mod]; ok(notVoid(type), `Unknown hold type "${type}"`);
		const len = getTicks(ma2, tick, BigInt(denomi), BigInt(num), resolution);
		ma2.notes.push({ type, pos, len, tick, offsetPseudo });
		tickValues.push(len, tick);
	}
	function parseTouchTap(pos: number, sensor: TouchSensorType, modSet: Partial<Record<"h" | "f", true>>) {
		ma2.notes.push({
			type: Def.TouchTap,
			pos, sensor,
			tick,
			effect: modSet.f ? TouchEffectType.Eff1 : TouchEffectType.None,
			size: config.touchSize,
			offsetPseudo,
		});
		tickValues.push(tick);
	}
	function parseTouchHold(reader: Reader, pos: number, sensor: TouchSensorType, modSet: Partial<Record<"h" | "f", true>>) {
		let denomi = '1', num = '0';
		if (reader.isRegex(/^\[(\d+):(\d+)\]/))
			[, denomi, num] = reader.readRegex(/^\[(\d+):(\d+)\]/);
		const len = getTicks(ma2, tick, BigInt(denomi), BigInt(num), resolution);
		ma2.notes.push({
			type: Def.TouchHold,
			pos, sensor,
			len,
			tick,
			effect: modSet.f ? TouchEffectType.Eff1 : TouchEffectType.None,
			size: config.touchSize,
			offsetPseudo,
		});
		tickValues.push(len, tick);
	}
	/**
	 * 处理星星
	 * @param modSet 星星头的 mod
	 * @param mod 星星头的 mod 的 bitmap
	 * @param reader
	 * @param pos 星星起点，0~7
	 * @param connect fes 星星
	 */
	function parseSlide(modSet: Partial<Record<Chars<'bx$@!?h'>, true>>, mod: number, reader: Reader, pos: number, connect?: boolean) {
		if (!connect && !modSet['!'] && !modSet['?']) mod |= 8; // star
		const [, shape, midPos, endPos, , bpm, , denomi, num] = reader.readRegex(/^(-|<|>|\^|p|q|s|z|w|v|pp|qq|V(\d))(\d)\[((\d+(\.\d*)?)##)?(\d+):(\d+)\]/);
		const modSet2 = reader.readCharset('bx');
		const mod2 = (modSet2.x ? 1 : 0) | (modSet2.b ? 2 : 0);
		const slideType = connect ? Def.ConnectSlide : defMap.slide[mod2];
		ok(notVoid(slideType), `Unknown slide type "${slideType}"`);

		let realTick = tick;
		if (connect) {
			const lastSlide = ma2.notes[ma2.notes.length - 1] as ExtSlide;
			realTick = lastSlide.tick + lastSlide.wait + lastSlide.shoot;
		}
		if (mod & 8) { // Star
			const starType = defMap.tap[mod]; ok(notVoid(starType), `Unknown star type "${starType}"`);
			ma2.notes.push({ type: starType, pos, tick, offsetPseudo });
		}
		// 我要杀了 js number 和 brenden eich 的妈妈
		// 我真不知道怎么想到把 ieee754 double 和 int32 塞在一起的。
		const wait = connect ? 0n : BigInt(Math.ceil((+bpm || curBpm) * BPM_FACTOR)) * resolution / BigInt(4 * BPM_FACTOR * curBpm); // TODO: 这个其实很奇怪，它到底会不会受变 BPM 影响？需要测试一下
		log('wait:', wait);
		const shoot = getTicks(ma2, tick + wait, BigInt(denomi), BigInt(num), resolution);
		ma2.notes.push({
			type: slideType,
			pos, endPos: +endPos - 1,
			shape: getMa2Shape(shape.replace(/\d/, '') as SimaiSlideType, pos, midPos ? +midPos - 1 : undefined, +endPos - 1),
			wait,
			shoot,
			tick: realTick,
			offsetPseudo,
		});
		tickValues.push(wait, shoot, tick);
	}
}

function parseBPMList(ma2: Ma2Cache, str: string, config: Required<SimaiLoadConfig>, resolution: bigint) {
	let tick = 0n, measure = 0n;
	ma2.meters.push({ denomi: 4, num: 4, tick: 0n });
	for (const section of str.split(',')) {
		const bpmMatch = section.match(config.strict ? /^\((\d+(\.\d*)?)\)/ : /\((\d+(\.\d*)?)\)/);
		if (bpmMatch)
			ma2.bpms.push({ tick, bpm: +bpmMatch[1] });

		const measureMatch = section.match(/\{(\d+)\}/);
		if (measureMatch)
			measure = BigInt(measureMatch[1]);

		tick += resolution / measure;
	}
}

function getMa2Shape(shape: SimaiSlideType, pos: number, midPos: number | undefined, endPos: number): Ma2SlideType {
	switch (shape) {
		case '-': return Ma2SlideType.Slide_Straight;
		case 'p': return Ma2SlideType.Slide_Curve_L;
		case 'q': return Ma2SlideType.Slide_Curve_R;
		case 's': return Ma2SlideType.Slide_Thunder_L;
		case 'z': return Ma2SlideType.Slide_Thunder_R;
		case 'v': return Ma2SlideType.Slide_Corner;
		case 'pp': return Ma2SlideType.Slide_Bend_L;
		case 'qq': return Ma2SlideType.Slide_Bend_R;
		case 'w': return Ma2SlideType.Slide_Fan;

		case '<': return [0, 1, 6, 7].includes(pos) ? Ma2SlideType.Slide_Circle_L : Ma2SlideType.Slide_Circle_R;
		case '>': return [0, 1, 6, 7].includes(pos) ? Ma2SlideType.Slide_Circle_R : Ma2SlideType.Slide_Circle_L;
		case '^':
			ok(Math.abs(endPos - pos) !== 4);
			return (endPos - pos + 8) % 8 < 4 ? Ma2SlideType.Slide_Circle_R : Ma2SlideType.Slide_Circle_L;

		case 'V':
			ok(notVoid(midPos));
			return (pos + 6) % 8 === midPos ? Ma2SlideType.Slide_Skip_L : Ma2SlideType.Slide_Skip_R;

		default: ok(false, `Unknown simai slide shape ${shape}`);
	}
}
