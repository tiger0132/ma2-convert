import { Ma2File } from './index';
import { Ma2Record } from './Ma2Record';
import { Def as Ma2RecordDef, fmt } from './RecordId';

export type BPMChangeData = { bpm: number, tick: number };
export type MeterChangeData = { denomi: number, num: number, tick: number };
export type ClickData = { tick: number };
export type BarData = { numTotal: number, numBar: number, tick: number };
export class Ma2Composition {
	bpmList: BPMChangeData[] = [];
	meterList: MeterChangeData[] = [];
	// soflanList = new SoflanDataList();
	clickList: ClickData[] = [];
	// clickSeList: number[] = [];
	// barList: BarData[] = [{ numTotal: 0, numBar: 0, tick: 0 }, { numTotal: 0, numBar: 0, tick: 0 }, { numTotal: 0, numBar: 0, tick: 0 }, { numTotal: 0, numBar: 0, tick: 0 }, { numTotal: 0, numBar: 0, tick: 0 }, { numTotal: 0, numBar: 0, tick: 0 }];
	startGameTime = 0;
	startNotesTime = 0;
	endGameTime = 0;
	endNotesTime = 0;

	constructor(private ma2File: Ma2File) { }
	load(rec: Ma2Record) {
		const tick = this.ma2File.calcTick(rec.getBar(), rec.getGrid());
		switch (rec.recId) {
			case Ma2RecordDef.BPM:
				return false;
			case Ma2RecordDef.MET:
				this.meterList.push({
					denomi: rec.getS32(3),
					num: rec.getS32(4),
					tick,
				});
				break;
			case Ma2RecordDef.CLK:
				this.clickList.push({ tick });
				break;
			default:
				return false;
		}
		return true;
	}
	dumpMa2() {
		const result = [
			this.bpmList.map(x => [...this.ma2File.calcBarGrid(x.tick), fmt('BPM', ...this.ma2File.calcBarGrid(x.tick), x.bpm)]),
			this.meterList.map(x => [...this.ma2File.calcBarGrid(x.tick), fmt('MET', ...this.ma2File.calcBarGrid(x.tick), x.denomi, x.num)]),
			this.clickList.map(x => [...this.ma2File.calcBarGrid(x.tick), fmt('CLK', ...this.ma2File.calcBarGrid(x.tick))]),
		].flat() as [number, number, string][];

		return result
			// .sort((x, y) => x[0] === y[0] ? x[1] - y[1] : x[0] - y[0])
			.map(x => x[2])
			.join('\n');
	}
}
