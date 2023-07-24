import { Ma2Category, Def as Ma2RecordDef, SlideType, data as recordData } from './def/RecordId';
import { Ma2Composition } from './def/Ma2Composition';
import { Ma2Header } from './def/Ma2Header';
import { Ma2Notes } from './def/Ma2Notes';
import { Ma2Record } from './def/Ma2Record';
import { OptionalFields, id } from '@/lib/utils';
import { dumpSimai } from './simai';

export interface LoadConfig {
	mode?: 'header' | 'full';
}
const defaultConfig = Object.freeze({
	mode: 'full',
} satisfies OptionalFields<LoadConfig>);

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
		slide: type => type === -1 ? -1 : [0, 1, 3, 2, 5, 4, 7, 6, 8, 10, 9, 12, 11, 13][type],
	},
} satisfies Record<string, Mirror>);

export class Ma2File {
	list: Ma2Record[] = [];
	mode?: 'header' | 'full';

	header = new Ma2Header(this);
	composition = new Ma2Composition(this);
	notes = new Ma2Notes(this);

	constructor(public mirror: Mirror = MirrorPreset.NORMAL) { }
	calcTick(bar: number, grid: number) {
		return bar * this.header.resolutionTime + grid;
	}
	calcBarGrid(tick: number) {
		return [tick / this.header.resolutionTime | 0, tick % this.header.resolutionTime] as const;
	}
	init(str: string, _config?: LoadConfig) {
		const config = { ...defaultConfig, ..._config };

		// read lines
		for (const line of str.split('\n')) {
			const rec = new Ma2Record();
			if (rec.init(line.trim())) this.list.push(rec);
		}
		if (!this.list.length) return false;

		// parse header
		this.mode = config.mode;
		for (const rec of this.list) {
			const cat = recordData[rec.recId].category;
			if (cat === Ma2Category.MA2_Header || cat === Ma2Category.MA2_Total)
				this.header.load(rec);
		}
		if (this.mode === 'header') return true;

		// parse bpm
		for (const rec of this.list)
			if (rec.recId === Ma2RecordDef.BPM)
				this.composition.bpmList.push({
					tick: this.calcTick(rec.getBar(), rec.getGrid()),
					bpm: rec.getF32(3),
				});
		this.composition.bpmList.sort((x, y) => x.tick - y.tick);

		// parse rest
		for (const rec of this.list) {
			const cat = recordData[rec.recId].category;
			switch (cat) {
			case Ma2Category.MA2_Header:
			case Ma2Category.MA2_Total:
				// say yes to cheating
				if (rec.recId === Ma2RecordDef.T_JUDGE_HLD)
					(this.notes as any).T_JUDGE_HLD = rec.getS32(1);
				if (rec.recId === Ma2RecordDef.TTM_EACHPAIRS)
					(this.notes as any).TTM_EACHPAIRS = rec.getS32(1);

				break;
			case Ma2Category.MA2_Composition:
				this.composition.load(rec);
				break;
			case Ma2Category.MA2_Note:
				this.notes.load(rec);
				break;
			}
		}
		// this.notes.calcNoteTiming();
		this.notes.calcEach();
		// this.notes.calcSlide();
		this.notes.calcEndTiming();
		this.notes.calcBPMInfo();
		// this.notes.calcBarList();
		// this.notes.calcSoflanList();
		// this.notes.calcClickList();
		this.notes.calcTotal();

		return true;
	}
	dumpMa2() {
		return [
			this.header.dumpMa2(),
			this.composition.dumpMa2(),
			this.notes.dumpMa2(),
			'',
		].join('\n\n');
	}
	dumpSimai = dumpSimai.bind(this)
}
