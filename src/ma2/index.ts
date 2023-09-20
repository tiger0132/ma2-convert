import { Ma2Category, Def as Ma2RecordDef, SlideType, data as recordData } from './RecordId';
import { Ma2Composition } from './Ma2Composition';
import { Ma2Header } from './Ma2Header';
import { Ma2Notes } from './Ma2Notes';
import { Ma2Record, TouchNoteSize } from './Ma2Record';
import { OptionalFields, id } from '../lib/utils';
import { dumpSimai } from '../simai/dump';
import { parseSimai } from '../simai/parse';
import { ok } from 'assert';

export interface Mirror {
	tap(pos: number): number;
	E(pos: number): number;
	slide(type: SlideType): SlideType;
}
export const MirrorPreset = Object.freeze({
	NORMAL: { tap: id, E: id, slide: id, },
	LR: {
		tap: pos => 7 - pos,
		E: pos => -pos & 7,
		slide: type => [0, 1, 3, 2, 5, 4, 7, 6, 8, 10, 9, 12, 11, 13][type],
	},
} satisfies Record<string, Mirror>);

export interface Ma2LoadConfig {
	mode?: 'header' | 'full';
	mirror?: Mirror;
}
const ma2DefaultConfig = Object.freeze({
	mode: 'full',
	mirror: MirrorPreset.NORMAL,
} satisfies OptionalFields<Ma2LoadConfig>);

export interface SimaiLoadConfig {
	strict?: boolean;
	mirror?: Mirror;
	resolution?: number;
	pseudoEachTicks?: number;
	touchSize?: TouchNoteSize;
	version?: '1.02.00' | '1.03.00' | '1.04.00';
};
const simaiDefaultConfig = Object.freeze({
	strict: true,
	mirror: MirrorPreset.NORMAL,
	resolution: 384,
	pseudoEachTicks: 4,
	touchSize: TouchNoteSize.M1,
	version: '1.04.00',
} satisfies OptionalFields<SimaiLoadConfig>);

export class Ma2File {
	mode?: 'header' | 'full';

	header = new Ma2Header();
	composition = new Ma2Composition(this);
	notes = new Ma2Notes(this);

	private constructor(public mirror: Mirror) { }
	calcTick(bar: number, grid: number) {
		return bar * this.header.resolutionTime + grid;
	}
	calcBarGrid(tick: number) {
		return [tick / this.header.resolutionTime | 0, tick % this.header.resolutionTime] as const;
	}
	calcSec(tick: number, len: number) {
		const { bpmList } = this.composition;
		const curBpmIdx = bpmList.findLastIndex(x => x.tick <= tick);
		let result = 0;
		for (let i = curBpmIdx; i < bpmList.length; i++) {
			const { bpm } = bpmList[i];
			const duration = i === bpmList.length - 1 ?
				Infinity :
				bpmList[i + 1].tick - Math.max(tick, bpmList[i].tick);
			const ticks = Math.min(len, duration);

			result += 240 / bpm / this.header.resolutionTime * ticks;
			if (!(len -= ticks)) break;
		}
		return result;
	}
	calc() {
		const err = this.notes.checkNotes();
		// if (err) logger.error(err);
		ok(!err, err ?? '');

		// this.notes.calcNoteTiming();
		this.notes.calcEach();
		this.notes.calcSlide();
		this.notes.calcEndTiming();
		this.notes.calcBPMInfo();
		// this.notes.calcBarList();
		// this.notes.calcSoflanList();
		// this.notes.calcClickList();
		this.notes.calcTotal();
	}

	static fromMa2(str: string, _config?: Ma2LoadConfig) {
		const config = { ...ma2DefaultConfig, ..._config };
		const result = new Ma2File(config.mirror);
		const list: Ma2Record[] = [];

		// read lines
		for (const line of str.split('\n')) {
			const rec = new Ma2Record();
			if (rec.init(line.trim())) list.push(rec);
		}
		if (!list.length) return null;

		// parse header
		result.mode = config.mode;
		for (const rec of list) {
			const cat = recordData[rec.recId].category;
			if (cat === Ma2Category.MA2_Header || cat === Ma2Category.MA2_Total)
				result.header.load(rec);
		}
		if (result.mode === 'header') return result;

		// parse bpm
		const bpmSet = new Set<number>(); // 去重。官谱真的有 BPM 重复的情况。例子：000556_00.ma2
		for (const rec of list)
			if (rec.recId === Ma2RecordDef.BPM) {
				const tick = result.calcTick(rec.getBar(), rec.getGrid());
				if (bpmSet.has(tick)) continue;
				bpmSet.add(tick);
				result.composition.bpmList.push({ tick, bpm: rec.getF32(3) });
			}
		result.composition.bpmList.sort((x, y) => x.tick - y.tick);

		// parse rest
		for (const rec of list) {
			const cat = recordData[rec.recId].category;
			switch (cat) {
				case Ma2Category.MA2_Header:
				case Ma2Category.MA2_Total:
					// say yes to cheating
					if (rec.recId === Ma2RecordDef.T_JUDGE_HLD)
						(result.notes as any).T_JUDGE_HLD = rec.getS32(1);
					if (rec.recId === Ma2RecordDef.TTM_EACHPAIRS)
						(result.notes as any).TTM_EACHPAIRS = rec.getS32(1);

					break;
				case Ma2Category.MA2_Composition:
					result.composition.load(rec);
					break;
				case Ma2Category.MA2_Note:
					result.notes.load(rec);
					break;
			}
		}
		result.calc();

		return result;
	}
	dumpMa2(stats = true) {
		return [
			this.header.dumpMa2(),
			this.composition.dumpMa2(),
			this.notes.dumpMa2(stats),
			'',
		].join('\n\n');
	}

	static fromSimai(str: string, _config?: SimaiLoadConfig) {
		const config = { ...simaiDefaultConfig, ..._config };
		const result = new Ma2File(config.mirror);

		result.header.version[0] = '0.00.00';
		result.header.version[1] = config.version;
		result.header.resolutionTime = config.resolution;
		result.header.clickFirst = config.resolution;
		result.header.isFes = false;

		parseSimai(result, str, config);
		result.calc();

		return result;
	}
	readonly dumpSimai = dumpSimai.bind(this);
}

export { Ma2 } from './Ma2Notes';
export { BPMChangeData, BarData, ClickData, MeterChangeData } from './Ma2Composition';
export { TouchEffectType, TouchNoteSize, TouchSensorType } from './Ma2Record';
export { Def as NoteTypeDef } from './NotesTypeId';
export { Def as RecordIdDef, SlideType, slideNames, fmt } from './RecordId';
