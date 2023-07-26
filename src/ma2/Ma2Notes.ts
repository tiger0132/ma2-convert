import { Def as Ma2RecordDef, SlideType, fmt, data as recordData, slideNames, totalRecordKeys } from './RecordId';
import { Def as Ma2NotesDef, defNames, recordDefNames, slidePrefixes } from './NotesTypeId';
import { Ma2File } from '.';
import { Ma2Record, TouchNoteSize, TouchEffectType, TouchSensorType } from './Ma2Record';
import { ok } from 'assert';

const tapTypes = Object.freeze([Ma2NotesDef.Tap, Ma2NotesDef.Break, Ma2NotesDef.ExTap, Ma2NotesDef.Star, Ma2NotesDef.BreakStar, Ma2NotesDef.ExStar, Ma2NotesDef.ExBreakTap, Ma2NotesDef.ExBreakStar] as const);
const holdTypes = Object.freeze([Ma2NotesDef.Hold, Ma2NotesDef.ExHold, Ma2NotesDef.BreakHold, Ma2NotesDef.ExBreakHold] as const);
const slideTypes = Object.freeze([Ma2NotesDef.Slide, Ma2NotesDef.BreakSlide, Ma2NotesDef.ExSlide, Ma2NotesDef.ExBreakSlide, Ma2NotesDef.ConnectSlide] as const);
const starTypes = Object.freeze([Ma2NotesDef.Star, Ma2NotesDef.BreakStar, Ma2NotesDef.ExStar, Ma2NotesDef.ExBreakStar] as const);

type Common = { pos: number, tick: number };
export type Tap = {
	type: typeof tapTypes[number];
	children?: Slide[];
} & Common;
type Hold = { type: typeof holdTypes[number], len: number } & Common;
export type Slide = {
	type: typeof slideTypes[number];
	shape: SlideType,
	wait: number;
	shoot: number;
	endPos: number;
	parent?: Tap | Slide;
	child?: Slide;
} & Common;
type TouchTap = {
	type: Ma2NotesDef.TouchTap;
	sensor: TouchSensorType;
	effect: TouchEffectType;
	size: TouchNoteSize;
} & Common;
type TouchHold = {
	type: Ma2NotesDef.TouchHold;
	len: number;
	sensor: TouchSensorType;
	effect: TouchEffectType;
	size: TouchNoteSize;
} & Common;
type Note = Tap | Hold | Slide | TouchTap | TouchHold;
// const isEach = (x: NoteData, y: NoteData) => {
// 	if (x.type === Ma2NotesDef.ConnectSlide || y.type === Ma2NotesDef.ConnectSlide) return false;
// 	return x.type
// }

const isTap = (x: Ma2NotesDef): x is typeof tapTypes[number] => tapTypes.includes(x as any);
const isHold = (x: Ma2NotesDef): x is typeof holdTypes[number] => holdTypes.includes(x as any);
const isSlide = (x: Ma2NotesDef): x is typeof slideTypes[number] => slideTypes.includes(x as any);
const isStar = (x: Ma2NotesDef): x is typeof starTypes[number] => starTypes.includes(x as any);
export const isTapNote = (x: Note | { type: any }): x is Tap => isTap(x.type);
export const isHoldNote = (x: Note | { type: any }): x is Hold => isHold(x.type);
export const isSlideNote = (x: Note | { type: any }): x is Slide => isSlide(x.type);
export const isStarNote = (x: Note | { type: any }): x is Tap => isStar(x.type);

const concat = <S extends string, T extends string>(s: S, t: T) => (s + t) as `${S}${T}`;

export class Ma2Notes {
	notes: Note[] = [];
	stats = {} as Record<typeof totalRecordKeys[keyof typeof totalRecordKeys][number], number>;

	constructor(private ma2File: Ma2File) { }
	load(rec: Ma2Record) {
		const type = recordData[rec.recId].typeId;
		const tick = this.ma2File.calcTick(rec.getBar(), rec.getGrid());
		const pos = this.ma2File.mirror.tap(rec.getPos());

		if (isTap(type))
			this.notes.push({ type, pos, tick });
		else if (isHold(type))
			this.notes.push({ type, len: rec.getHoldLen(), pos, tick });
		else if (isSlide(type))
			this.notes.push({
				type,
				shape: recordData[rec.recId].slideType,
				wait: rec.getSlideWaitLen(),
				shoot: rec.getSlideShootLen(),
				endPos: this.ma2File.mirror.tap(rec.getSlideEndPos()),
				pos, tick,
			});
		else if (type === Ma2NotesDef.TouchTap)
			this.notes.push({
				type,
				sensor: rec.getTouchTapSensorType(),
				effect: rec.getTouchTapEffType(),
				size: rec.getTouchTapNoteSize(),
				pos, tick,
			});
		else if (type === Ma2NotesDef.TouchHold)
			this.notes.push({
				type,
				len: rec.getHoldLen(),
				sensor: rec.getTouchHoldSensorType(),
				effect: rec.getTouchHoldEffType(),
				size: rec.getTouchHoldNoteSize(),
				pos, tick,
			});
		else
			return false;
		return true;
	}
	calcEach() { }
	calcSlide() {
		for (let i = 0; i < this.notes.length; i++) {
			const p = this.notes[i];
			// TODO: simai 里有 1@-5 这样的语法，似乎可以通过让 Slide 认 Tap 做爹来实现，可以作为一个可开关的逻辑加入。
			if (isStarNote(p))
				for (const q of this.notes.slice(i + 1)) {
					if (q.tick > p.tick) break;
					if (isSlideNote(q) && p.pos == q.pos) { // Slide 认 Star 做爹
						if (!p.children) p.children = [];
						q.parent = p, p.children.push(q);
					}
				}
			if (isSlideNote(p)) {
				const end = p.tick + p.wait + p.shoot;
				for (const q of this.notes.slice(i + 1)) {
					if (q.tick > end) break;
					if (q.type === Ma2NotesDef.ConnectSlide && p.endPos == q.pos && !q.parent) { // ConnectSlide 认 Slide 做爹
						q.parent = p, p.child = q;
						break; // 这保证了 fes 星星一定是链形
					}
				}
			}
		}
		for (const note of this.notes)
			ok(note.type !== Ma2NotesDef.ConnectSlide || note.parent, 'Found unchained ConnectSlide.');
	}
	calcTotal() {
		const version = this.ma2File.header.version[1];
		ok(version === '1.02.00' || version === '1.03.00' || version === '1.04.00');
		for (const k of totalRecordKeys[version])
			this.stats[k] = 0;

		for (const { type } of this.notes) {
			const name = recordDefNames[type];

			// 物件类型
			if (name)
				this.stats[concat('T_REC_', name)]++;

			// 计分意义上的 TAP BRK HLD SLD
			switch (type) {
				case Ma2NotesDef.Tap:
				case Ma2NotesDef.ExTap:
				case Ma2NotesDef.Star:
				case Ma2NotesDef.ExStar:
				case Ma2NotesDef.TouchTap:
					this.stats['T_NUM_TAP']++;
					break;

				case Ma2NotesDef.Break:
				case Ma2NotesDef.BreakStar:
				case Ma2NotesDef.ExBreakTap:
				case Ma2NotesDef.ExBreakHold:
				case Ma2NotesDef.BreakSlide:
				case Ma2NotesDef.ExBreakSlide:
				case Ma2NotesDef.ExBreakStar:
				case Ma2NotesDef.BreakHold:
					this.stats['T_NUM_BRK']++;
					break;

				case Ma2NotesDef.Hold:
				case Ma2NotesDef.ExHold:
				case Ma2NotesDef.TouchHold:
					this.stats['T_NUM_HLD']++;
					break;

				case Ma2NotesDef.Slide:
				case Ma2NotesDef.ExSlide:
					// case Ma2NotesDef.ConnectSlide:
					this.stats['T_NUM_SLD']++;
					break;
			}

			// 判定意义上的 TAP HLD SLD
			if (isTap(type) || type === Ma2NotesDef.TouchTap) this.stats['T_JUDGE_TAP']++;
			// if (isHold(type) || type === Ma2NotesDef.TouchHold) this.stats['T_JUDGE_HLD']++;
			if (isSlide(type) && type !== Ma2NotesDef.ConnectSlide) this.stats['T_JUDGE_SLD']++;

			if (type !== Ma2NotesDef.ConnectSlide) {
				this.stats['T_REC_ALL']++;
				this.stats['T_NUM_ALL']++;
			}
		}
		this.stats['T_JUDGE_HLD'] = (this as any).T_JUDGE_HLD ?? 0;
		this.stats['TTM_EACHPAIRS'] = (this as any).TTM_EACHPAIRS ?? 0;

		this.stats['T_JUDGE_ALL'] = this.stats['T_JUDGE_TAP'] + this.stats['T_JUDGE_HLD'] + this.stats['T_JUDGE_SLD'];

		let all = 0;
		all += this.stats['TTM_SCR_TAP'] = this.stats['T_NUM_TAP'] * 500;
		all += this.stats['TTM_SCR_BRK'] = this.stats['T_NUM_BRK'] * 2600;
		all += this.stats['TTM_SCR_HLD'] = this.stats['T_NUM_HLD'] * 1000;
		all += this.stats['TTM_SCR_SLD'] = this.stats['T_NUM_SLD'] * 1500;
		this.stats['TTM_SCR_ALL'] = all;

		const sss = all - this.stats['T_NUM_BRK'] * 100;
		this.stats['TTM_SCR_S'] = Math.ceil(sss * .97 / 50) * 50;
		this.stats['TTM_SCR_SS'] = sss; // RESULT, FANTASTIC CLEAR!
		this.stats['TTM_RAT_ACV'] = Math.floor(all / sss * 10000 + 1e-6);
	}
	calcEndTiming() {
		let startGameTime = 0;
		let startNotesTime = 0;
		let endGameTime = 0;
		let endNotesTime = 0;

		for (const note of this.notes) {
			let endTime = note.tick;
			if (isSlideNote(note))
				endTime = note.tick + note.wait + note.shoot;
			else if (isHoldNote(note) || note.type === Ma2NotesDef.TouchHold)
				endTime = note.tick + note.len;

			startGameTime = Math.min(startGameTime, note.tick);
			endGameTime = Math.max(endGameTime, endTime);
		}
		const timeData = [
			...this.ma2File.composition.bpmList,
			...this.ma2File.composition.meterList,
			...this.ma2File.composition.clickList,
		].map(x => x.tick);
		startNotesTime = Math.min(startNotesTime, startGameTime, ...timeData);
		endNotesTime = Math.max(endNotesTime, endGameTime, ...timeData);

		this.ma2File.composition.startGameTime = startGameTime;
		this.ma2File.composition.startNotesTime = startNotesTime;
		this.ma2File.composition.endGameTime = endGameTime;
		this.ma2File.composition.endNotesTime = endNotesTime;
	}
	calcBPMInfo() {
		const bpmList = this.ma2File.composition.bpmList;
		if (!bpmList.length) return;

		const bpmInfo = this.ma2File.header.bpmInfo;
		bpmInfo.firstBPM = bpmList[0].bpm;
		bpmInfo.maxBPM = Math.max(...bpmList.map(x => x.bpm));
		bpmInfo.minBPM = Math.min(...bpmList.map(x => x.bpm));
		if (bpmList.length === 1) return;

		const map = new Map<number, number>();
		for (let i = 0; i < bpmList.length; i++) {
			const bpm = bpmList[i];

			let ticks;
			if (i === bpmList.length - 1)
				ticks = this.ma2File.composition.endNotesTime - bpm.tick;
			else
				ticks = bpmList[i + 1].tick - bpm.tick;

			const msec = ticks * (4 * 60e3 / bpm.bpm / this.ma2File.header.resolutionTime);
			const coercedBpm = Math.floor(bpm.bpm * 1e3);
			map.set(coercedBpm, (map.get(coercedBpm) ?? 0) + msec);
		}

		let mv = -1, mx = -Infinity;
		for (const [coercedBpm, msec] of map)
			if (msec > mx || (msec >= mx && coercedBpm >= mv)) {
				mv = coercedBpm;
				mx = msec;
			}
		bpmInfo.defaultBPM = mv / 1e3;
	}
	dumpMa2() {
		const result = [];

		const version = this.ma2File.header.version[1];
		ok(version === '1.02.00' || version === '1.03.00' || version === '1.04.00');
		const names = defNames[version];

		const $ = <T>(x: T | 'Invalid'): T => (ok(x !== 'Invalid', 'Version 1.03.00 does not allow fes notes'), x);
		for (const note of this.notes) {
			const { tick, pos } = note;
			const commonArg = [...this.ma2File.calcBarGrid(tick), pos] as const;

			if (isTapNote(note))
				result.push(fmt($(names[note.type]), ...commonArg));
			else if (isHoldNote(note))
				result.push(fmt($(names[note.type]), ...commonArg, note.len));
			else if (isSlideNote(note)) {
				ok(note.shape !== -1, 'Invalid slide type');
				const name = $(slideNames[note.shape]);
				if (version === '1.02.00' || version === '1.03.00') {
					ok(note.type === Ma2NotesDef.Slide);
					result.push(fmt(name, ...commonArg, note.wait, note.shoot, note.endPos));
				} else
					result.push(fmt(concat(slidePrefixes[note.type], name), ...commonArg, note.wait, note.shoot, note.endPos));
			} else if (note.type === Ma2NotesDef.TouchTap) {
				if (version === '1.02.00')
					result.push([names[note.type], ...commonArg, TouchSensorType[note.sensor] as keyof typeof TouchSensorType, note.effect].map(x => x.toString()).join('\t'));
				else
					result.push(fmt(
						names[note.type], ...commonArg,
						TouchSensorType[note.sensor] as keyof typeof TouchSensorType,
						note.effect,
						TouchNoteSize[note.size] as keyof typeof TouchNoteSize,
					));
			} else if (note.type === Ma2NotesDef.TouchHold) {
				if (version === '1.02.00')
					result.push([names[note.type], ...commonArg, note.len, TouchSensorType[note.sensor] as keyof typeof TouchSensorType, note.effect].map(x => x.toString()).join('\t'));
				else
					result.push(fmt(
						names[note.type], ...commonArg, note.len,
						TouchSensorType[note.sensor] as keyof typeof TouchSensorType,
						note.effect,
						TouchNoteSize[note.size] as keyof typeof TouchNoteSize,
					));
			}
			else
				ok(false, 'wtf');
		}

		result.push('');
		for (const k of totalRecordKeys[version])
			result.push(fmt(k, this.stats[k]));

		return result.join('\n');
	}
}
