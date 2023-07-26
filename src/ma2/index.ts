import { Ma2Category, Def as Ma2RecordDef, SlideType, data as recordData } from './RecordId';
import { Ma2Composition } from './Ma2Composition';
import { Ma2Header } from './Ma2Header';
import { Ma2Notes } from './Ma2Notes';
import { Ma2Record } from './Ma2Record';
import { OptionalFields, id } from '@/lib/utils';
import { dumpSimai } from '@/simai/dump';

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

export interface LoadConfig {
	mode?: 'header' | 'full';
	mirror?: Mirror;
}
const defaultConfig = Object.freeze({
	mode: 'full',
	mirror: MirrorPreset.NORMAL,
} satisfies OptionalFields<LoadConfig>);

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

	static fromMa2(str: string, _config?: LoadConfig) {
		const config = { ...defaultConfig, ..._config };
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
		for (const rec of list)
			if (rec.recId === Ma2RecordDef.BPM)
				result.composition.bpmList.push({
					tick: result.calcTick(rec.getBar(), rec.getGrid()),
					bpm: rec.getF32(3),
				});
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
		// result.notes.calcNoteTiming();
		result.notes.calcEach();
		result.notes.calcSlide();
		result.notes.calcEndTiming();
		result.notes.calcBPMInfo();
		// result.notes.calcBarList();
		// result.notes.calcSoflanList();
		// result.notes.calcClickList();
		result.notes.calcTotal();

		return result;
	}
	dumpMa2() {
		return [
			this.header.dumpMa2(),
			this.composition.dumpMa2(),
			this.notes.dumpMa2(),
			'',
		].join('\n\n');
	}

	readonly dumpSimai = dumpSimai.bind(this);
}
