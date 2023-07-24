import { Ma2File } from '../ma2';
import { Ma2Record } from './Ma2Record';
import { Def as Ma2RecordDef, fmt } from './RecordId';

type Version = { major: number, minor: number, release: number };
type BPMInfo = { defaultBPM: number, minBPM: number, maxBPM: number, firstBPM: number };
type MeterInfo = { denomi: number, num: number };
function parseVersion(s: string): Version {
	const [major, minor, release] = s.split('.').map(x => parseInt(x, 10)).concat(0, 0, 0);
	return { major, minor, release };
}
function formatVersion({ major, minor, release }: Version) {
	return `${major.toString()}.${minor.toString().padStart(2, '0')}.${release.toString().padStart(2, '0')}`;
}

export class Ma2Header {
	format = 'MA2' as const; // C2S MA2 M2S SDT SCT SZT SRT

	notesName = '';
	version: [string, string] = ['', ''];

	creator = '';
	bpmInfo: BPMInfo = { defaultBPM: 150, minBPM: 150, maxBPM: 150, firstBPM: 150 };
	metInfo: MeterInfo = { denomi: 4, num: 4 };

	resolutionTime = 1920;
	clickFirst = 0;
	// progJudgeBPM = 240; // not used somehow
	// isTutorial = false;
	isFes = false;
	touchNum = 0;
	maxNotes = 0;

	constructor(private ma2File: Ma2File) { }
	load(rec: Ma2Record) {
		switch (rec.recId) {
		case Ma2RecordDef.VERSION:
			for (let i = 0; i < 2; i++) this.version[i] = rec.getStr(i + 1);
			break;
		case Ma2RecordDef.FES_MODE:
			this.isFes = rec.getS32(1) > 0;
			break;
		case Ma2RecordDef.BPM_DEF:
			this.bpmInfo.firstBPM = rec.getF32(1);
			this.bpmInfo.defaultBPM = rec.getF32(2);
			this.bpmInfo.maxBPM = rec.getF32(3);
			this.bpmInfo.minBPM = rec.getF32(4);
			break;
		case Ma2RecordDef.MET_DEF:
			this.metInfo.denomi = rec.getS32(1);
			this.metInfo.num = rec.getS32(2);
			break;
		case Ma2RecordDef.RESOLUTION:
			this.resolutionTime = rec.getS32(1);
			break;
		case Ma2RecordDef.CLK_DEF:
			this.clickFirst = rec.getS32(1);
			break;
		case Ma2RecordDef.T_NUM_ALL:
			this.maxNotes = rec.getS32(1);
			break;
		case Ma2RecordDef.T_REC_THO:
		case Ma2RecordDef.T_REC_TTP:
			this.touchNum += rec.getS32(1);
			break;
		default:
			return false;
		}
		return true;
	}
	dumpMa2() {
		const { defaultBPM, minBPM, maxBPM, firstBPM } = this.bpmInfo;

		return [
			fmt('VERSION', this.version[0], this.version[1]),
			fmt('FES_MODE', this.isFes ? 1 : 0),
			fmt('BPM_DEF', firstBPM, defaultBPM, maxBPM, minBPM),
			fmt('MET_DEF', this.metInfo.denomi, this.metInfo.num),
			fmt('RESOLUTION', this.resolutionTime),
			fmt('CLK_DEF', this.clickFirst),
			fmt('COMPATIBLE_CODE', 'MA2'),
		].join('\n');
	}
}
