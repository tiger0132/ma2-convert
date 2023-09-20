import { ok } from 'assert';
import debug from 'debug';

import { Slide as Ma2Slide, isHoldNote, isSlideNote, isTapNote } from '../ma2/Ma2Notes';
import { TouchEffectType, TouchSensorType } from '../ma2/Ma2Record';
import { OptionalFields, gcd, notVoid } from '../lib/utils';
import { Ma2File } from '../ma2';
import { BPM, Hold, Len, Modifier, Note, SimaiSlideType, Slide, Tap, TouchHold, TouchTap } from './index';
import { Def } from '@/ma2/NotesTypeId';
import { SlideType as Ma2SlideType } from '../ma2/RecordId';
import { inspect } from 'util';

export const modifierList = Object.freeze([
	0, 2, 1, 0, 1, 0, 8, 10, 9, 0, 0, 3, 2, 3, 2, 1, 3, 11, 0,
] satisfies Record<Def, number>);

const bpm = (bpm: number): BPM => ({ type: 'bpm', bpm });
const touchTap = (pos: string, mod: number): TouchTap => ({ type: 'touchtap', pos, mod });
const touchHold = (pos: string, len: Len | undefined, mod: number): TouchHold => ({ type: 'touchhold', pos, len, mod });

export interface Config {
	pseudoEachTicks?: number;
}
const defaultConfig = Object.freeze({
	pseudoEachTicks: 4,
} satisfies OptionalFields<Config>);

const getPos = (x: { sensor: number, pos: number }) => `${TouchSensorType[x.sensor]}${x.pos + 1}`;
const log = debug('dump');
function getLen(ma2: Ma2File, tick: number, len: number): Len | undefined {
	if (!len) return;
	const bpmList = ma2.composition.bpmList;
	const curBpmIdx = bpmList.findLastIndex(x => x.tick <= tick);

	// fuck
	// if (isInt(bpmList[curBpmIdx].bpm)) {
	// 	if (curBpmIdx < bpmList.length - 1 && bpmList[curBpmIdx + 1].tick < tick + len)
	// 		ok(false, 'fuck');

	// 	let p = len, q = ma2.header.resolutionTime, d;
	// 	d = gcd(p, q);
	// 	p /= d, q /= d;
	// 	return { denomi: q, num: p };
	// }

	log('');
	log({ tick, len });
	let p = 0, q = ma2.header.resolutionTime * (bpmList[curBpmIdx].bpm * 1e3 | 0), d;
	for (let i = curBpmIdx; i < bpmList.length; i++) {
		const { bpm } = bpmList[i];
		const duration = i === bpmList.length - 1 ?
			Infinity :
			bpmList[i + 1].tick - Math.max(tick, bpmList[i].tick);
		const ticks = Math.min(len, duration);

		log({ bpm, ticks });
		p += (bpm * 1e3 | 0) * ticks;
		if (!(len -= ticks)) break;
	}
	log({ p, q });
	d = gcd(p, q);
	p /= d, q /= d;
	log({ p, q });

	return { denomi: q, num: p };
}

function scale(len: Len, factor: Len): Len {
	const p = len.num * factor.num;
	const q = len.denomi * factor.denomi;
	const d = gcd(p, q);
	return { denomi: q / d, num: p / d };
}

// # 语法中后面的时值竟然是按照等待的 bpm 计算
// 纯纯有病行为
const fmtLen = (x?: Len, bpm?: number) => x ? `[${bpm !== undefined ? `${bpm}#` : ''}${x.denomi}:${x.num}]` : '';
const fmtMod = ({ mod }: { mod: number }) => [
	(mod & Modifier.Ex) && 'x',
	(mod & Modifier.Break) && 'b',
	(mod & Modifier.Firework) && 'f'
].filter(x => x).join('');
const fmtSlides = (slide: Slide, bpm: number) => [slide, ...(slide.subsequent ?? [])].map(x => [
	x.shape, x.midPos, x.endPos,
	x.waitFactor === 1 ? fmtLen(x.shoot) : fmtLen(scale(x.shoot, { denomi: bpm, num: bpm * x.waitFactor }), bpm * x.waitFactor),
	fmtMod(slide)
]).flat().join('');

// TODO: 现在每行仍然保证了只有一个 Measure（即 {...}）语句。得想办法支持更多的。
// 把 cnt 换成 resolution 可能就能支持了.jpg
function fmtNotes(notes: Note[], cnt: number, bpm: number) {
	let result = '', isNote = false; // 上一个是不是实 note；如果不是就不需要用 '/' 标记双押
	for (const note of notes) {
		if (note.pseudo)
			result += '`';
		else if (note.offset) {
			result += ','.repeat(note.offset);
			cnt -= note.offset;
		} else if (isNote)
			result += '/';

		isNote = true;
		switch (note.type) {
			case 'bpm':
				result += `(${bpm = note.bpm})`, isNote = false;
				break;
			case 'measure':
				result += `{${note.measure}}`, isNote = false; // TODO: 如果要支持多个 measure 这里得加东西
				break;
			case 'tap': case 'touchtap':
				result += `${note.pos}${fmtMod(note)}`;
				if (note.type === 'tap') {
					const isStar = !!(note.mod & Modifier.Star);
					if (isStar && !note.children) result += '$'; // naked star
					if (note.children) {
						if (!isStar) result += '@'; // "unattached" tap
						result += note.children.map(x => fmtSlides(x, bpm)).join('*');
					}
				}
				break;
			case 'hold': case 'touchhold':
				result += `${note.pos}${fmtMod(note)}h${fmtLen(note.len)}`;
				break;
			case 'slide':
				result += note.pos + '?';
				result += fmtSlides(note, bpm);
				break;
		}
	}
	ok(cnt >= 0);
	return result + ','.repeat(cnt);
}
export function dumpSimai(this: Ma2File, _config: Config = {}) {
	const config = { ...defaultConfig, ..._config };

	const chart = [] as string[];
	const sortedMa2Notes = [
		...this.composition.bpmList.map(x => ({ type: 'bpm', ...x }) as const),
		...this.composition.meterList.map(x => ({ type: 'meter', ...x }) as const),
		...this.composition.clickList.map(x => ({ type: 'click', ...x }) as const),
		...this.notes.notes,
		{ type: 'idk', tick: Infinity } as const,
	].sort((x, y) => x.tick - y.tick);

	const resolution = this.header.resolutionTime;
	let curBpm = 0;
	for (let line = 0, i = 0; i < sortedMa2Notes.length - 1; line++) {
		const end = (line + 1) * resolution;
		const endIndex = sortedMa2Notes.findIndex(x => x.tick >= end, i);
		const ma2Notes = sortedMa2Notes.slice(i, endIndex);

		const d = getMeasure(ma2Notes);

		const notes = [{ type: 'measure', offset: 0, measure: resolution / d }] as Note[];
		let lastTick = 0, lastMeasure = 0;
		for (const ma2Note of ma2Notes) {
			const tick = ma2Note.tick % resolution;
			const measure = (tick / d) | 0;

			let note: Omit<Note, 'offset' | 'pseudo'> | undefined = undefined;
			if ('parent' in ma2Note) continue;

			do {
				if ((note = processTap(this, ma2Note))) break;
				if ((note = processSlide(this, ma2Note))) break;
				if ((note = processHold(this, ma2Note))) break;

				switch (ma2Note.type) {
					case Def.TouchTap:
						note = touchTap(getPos(ma2Note), ma2Note.effect === TouchEffectType.Eff1 ? Modifier.Firework : 0);
						break;
					case Def.TouchHold:
						note = touchHold(getPos(ma2Note), getLen(this, ma2Note.tick, ma2Note.len), ma2Note.effect === TouchEffectType.Eff1 ? Modifier.Firework : 0);
						break;
					case 'bpm':
						note = bpm(curBpm = ma2Note.bpm);
						break;
					case 'meter':
						break;
					case 'click':
						break;
				}
			} while (false);

			if (note) {
				const fullNote = note as Note;
				fullNote.pseudo = note.type !== 'bpm' && lastTick + config.pseudoEachTicks === tick;
				if (fullNote.pseudo || tick === lastTick) // 能用 ` 和 / 就一直用，尽可能不更新 lastMeasure
					fullNote.offset = 0;
				else { // ` 和 / 不会更新 measure，所以要一路把之前的都补回来
					fullNote.offset = measure - lastMeasure;
					lastMeasure = measure;
				}
				lastTick = tick;
				if (note.type === 'bpm' && measure === 0)
					notes.unshift(fullNote);
				else
					notes.push(fullNote);
			}
		}

		chart.push(fmtNotes(notes, resolution / d, curBpm));
		i = endIndex;
	}
	chart.push('E');
	return chart.join('\n');

	function getMeasure(ma2Notes: typeof sortedMa2Notes) {
		const ticks = [resolution];
		let pseudoEach = false;
		for (let j = 0; j < ma2Notes.length; j++) {
			if (j) {
				if (ma2Notes[j].tick - ma2Notes[j - 1].tick === config.pseudoEachTicks &&
					ma2Notes[j].type !== 'bpm') // BPM 伪双押不当作伪双押。例子：000410_00.ma2
					pseudoEach = true;
				else if (ma2Notes[j].tick > ma2Notes[j - 1].tick)
					pseudoEach = false;
			}
			if (pseudoEach) continue;
			if ('parent' in ma2Notes[j]) continue;

			ticks.push(ma2Notes[j].tick);
		}
		return gcd(...ticks);
	}
}

function processTap(ma2: Ma2File, ma2Note: any): Tap | undefined {
	if (!isTapNote(ma2Note)) return;
	const note: Tap = { type: 'tap', pos: ma2Note.pos + 1, mod: modifierList[ma2Note.type] };
	if (ma2Note.children)
		note.children = ma2Note.children.map(x => processSlide(ma2, x)).filter(notVoid);
	return note;
}
function processHold(ma2: Ma2File, ma2Note: any): Hold | undefined {
	if (!isHoldNote(ma2Note)) return;
	return { type: 'hold', pos: ma2Note.pos + 1, len: getLen(ma2, ma2Note.tick, ma2Note.len), mod: modifierList[ma2Note.type] };
}
function processSlide(ma2: Ma2File, ma2Note: any, parent?: Slide): Slide | undefined {
	if (!isSlideNote(ma2Note)) return;
	const note: Slide = {
		type: 'slide',
		...getSimaiShape(ma2Note),
		pos: ma2Note.pos + 1, endPos: ma2Note.endPos + 1,
		waitFactor:
			ma2Note.type === Def.ConnectSlide ?
				1 : // ConnectSlide 的 wait 一定是 0
				ma2.header.resolutionTime / (ma2Note.wait * 4),
		shoot: getLen(ma2, ma2Note.tick + ma2Note.wait, ma2Note.shoot) ?? { denomi: 1, num: 0 },
		mod: modifierList[ma2Note.type],
	};
	if (parent)
		parent.subsequent?.push(note);
	if (ma2Note.child) {
		if (parent)
			processSlide(ma2, ma2Note.child, parent);
		else {
			note.subsequent = [];
			processSlide(ma2, ma2Note.child, note);
		}
	}
	return note;
}
function getSimaiShape(slide: Ma2Slide): { shape: SimaiSlideType, midPos?: number } {
	switch (slide.shape) {
		case Ma2SlideType.Slide_Straight: return { shape: '-' };
		case Ma2SlideType.Slide_Curve_L: return { shape: 'p' };
		case Ma2SlideType.Slide_Curve_R: return { shape: 'q' };
		case Ma2SlideType.Slide_Thunder_L: return { shape: 's' };
		case Ma2SlideType.Slide_Thunder_R: return { shape: 'z' };
		case Ma2SlideType.Slide_Corner: return { shape: 'v' };
		case Ma2SlideType.Slide_Bend_L: return { shape: 'pp' };
		case Ma2SlideType.Slide_Bend_R: return { shape: 'qq' };
		case Ma2SlideType.Slide_Fan: return { shape: 'w' };
		case Ma2SlideType.Slide_Circle_L: return { shape: [0, 1, 6, 7].includes(slide.pos) ? '<' : '>' };
		case Ma2SlideType.Slide_Circle_R: return { shape: [0, 1, 6, 7].includes(slide.pos) ? '>' : '<' };
		case Ma2SlideType.Slide_Skip_L: return { shape: 'V', midPos: (slide.pos + 6) % 8 + 1 };
		case Ma2SlideType.Slide_Skip_R: return { shape: 'V', midPos: (slide.pos + 2) % 8 + 1 };
		default: ok(false, `Unknown ma2 slide shape ${slide.shape}`);
	}
}
