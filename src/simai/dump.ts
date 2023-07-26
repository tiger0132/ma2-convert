import { ok } from 'assert';

import { Slide as Ma2Slide, isHoldNote, isSlideNote, isTapNote } from '../ma2/Ma2Notes';
import { TouchEffectType, TouchSensorType } from '../ma2/Ma2Record';
import { OptionalFields, gcd, notVoid } from '../lib/utils';
import { Ma2File } from '../ma2';
import { BPM, Hold, Len, Modifier, Note, SimaiSlideType, Slide, Tap, TouchHold, TouchTap } from '.';
import { Def } from '@/ma2/NotesTypeId';
import { SlideType as Ma2SlideType } from '../ma2/RecordId';

export const modifierList = Object.freeze([
	0, 2, 1, 0, 1, 0, 8, 10, 9, 0, 0, 3, 2, 3, 2, 1, 3, 11, 0,
] satisfies Omit<Record<Def, number>, Def.Invalid>);

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
function getLen(ma2: Ma2File, tick: number, len: number): Len | undefined {
	if (!len) return;
	const bpmList = ma2.composition.bpmList;
	const curBpmIdx = bpmList.findLastIndex(x => x.tick < tick);

	let p = 0, q = ma2.header.resolutionTime * bpmList[curBpmIdx].bpm, d;
	for (let i = curBpmIdx; i < bpmList.length; i++) {
		const { bpm } = bpmList[i];
		const duration = i === bpmList.length - 1 ?
			Infinity :
			bpmList[i + 1].tick - bpmList[i].tick;
		const ticks = Math.min(len, duration);

		p += bpm * ticks;
		if (!(len -= ticks)) break;
	}
	d = gcd(p, q);
	p /= d, q /= d;

	return { denomi: q, num: p };
}

// TODO: 目前还有着每行只有开头一个分音标记的软限制
const fmtLen = (x?: Len) => x ? `[${x.denomi}:${x.num}]` : '';
const fmtMod = ({ mod }: { mod: number }) => [
	(mod & Modifier.Ex) && 'x',
	(mod & Modifier.Break) && 'b',
	(mod & Modifier.Firework) && 'f'
].filter(x => x).join('');

// TODO: 处理非默认等待时值
const fmtSlides = (slide: Slide) => [slide, ...(slide.subsequent ?? [])].map(x => [
	x.shape, x.midPos, x.endPos, fmtLen(x.shoot), fmtMod(slide)
]).flat().join('');
function fmtNotes(notes: Note[]) {
	ok(notes[0].type === 'measure');

	let result = '', cnt = notes[0].measure;
	let isNote = false; // 上一个是不是实 note；如果不是就不需要用 '/' 标记双押
	for (const note of notes) {
		if (note.pseudo)
			result += '`';
		else if (note.offset)
			result += ','.repeat(note.offset), cnt -= note.offset;
		else if (isNote)
			result += '/';

		isNote = true;
		switch (note.type) {
			case 'bpm':
				result += `(${note.bpm})`, isNote = false;
				break;
			case 'measure':
				result += `{${note.measure}}`, isNote = false;
				break;
			case 'tap': case 'touchtap':
				result += `${note.pos}${fmtMod(note)}`;
				if (note.type === 'tap') {
					const isStar = !!(note.mod & Modifier.Star);
					if (isStar && !note.children) result += '$'; // naked star
					if (note.children) {
						if (!isStar) result += '@'; // "unattached" tap
						result += note.children.map(fmtSlides).join('*');
					}
				}
				break;
			case 'hold': case 'touchhold':
				result += `${note.pos}${fmtMod(note)}h${fmtLen(note.len)}`;
				break;
			case 'slide':
				result += note.pos + '?';
				result += fmtSlides(note);
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
	for (let line = 0, i = 0; i < sortedMa2Notes.length - 1; line++) {
		const end = (line + 1) * resolution;
		const endIndex = sortedMa2Notes.findIndex(x => x.tick >= end, i);
		const ma2Notes = sortedMa2Notes.slice(i, endIndex);

		const ticks = [resolution];
		let pseudoEach = false;
		for (let j = 0; j < ma2Notes.length; j++) {
			if (j) {
				if (ma2Notes[j].tick - ma2Notes[j - 1].tick === config.pseudoEachTicks)
					pseudoEach = true;
				else if (ma2Notes[j].tick > ma2Notes[j - 1].tick)
					pseudoEach = false;
			}
			if (pseudoEach) continue;
			if ('parent' in ma2Notes[j]) continue;

			ticks.push(ma2Notes[j].tick);
		}
		const d = gcd(...ticks);
		if (d === 1)
			console.log(ticks);

		const notes = [{ type: 'measure', offset: 0, measure: resolution / d }] as Note[];
		let lastTick = 0, lastOffset = 0;
		for (const ma2Note of ma2Notes) {
			const tick = ma2Note.tick % resolution;
			const offset = (tick / d) | 0;

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
						note = bpm(ma2Note.bpm);
						break;
					case 'meter':
						break;
					case 'click':
						break;
				}
			} while (false);

			if (note) {
				const fullNote = note as Note;
				fullNote.pseudo = !!(tick % d) && lastTick < tick;
				fullNote.offset = offset - lastOffset;

				notes.push(fullNote);
			}
			lastTick = tick, lastOffset = offset;
		}

		chart.push(fmtNotes(notes));
		i = endIndex;
	}
	chart.push('E');
	return chart.join('\n');
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
		wait: getLen(ma2, ma2Note.tick, ma2Note.wait) ?? { denomi: 1, num: 0 },
		shoot: getLen(ma2, ma2Note.tick + ma2Note.wait, ma2Note.shoot) ?? { denomi: 1, num: 0 },
		mod: modifierList[ma2Note.type],
	};
	if (parent)
		parent.subsequent?.push(note);
	if (ma2Note.child) {
		if (!parent) note.subsequent = [];
		processSlide(ma2, ma2Note.child, note);
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
