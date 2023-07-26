import { Def as Ma2RecordDef, data as recordData } from './RecordId';
import { data as paramData } from './ParamId';
import { isKeyOf } from '@/lib/utils';

export enum TouchSensorType { B, C, E, A, D }
export enum TouchEffectType { None, Eff1, Invalid = -1 }
export enum TouchNoteSize { M1, L1 }

const getSensorType = (str: string) => isKeyOf(str, TouchSensorType) ? TouchSensorType[str] : TouchSensorType.B;
const getNoteSize = (str: string) => isKeyOf(str, TouchNoteSize) ? TouchNoteSize[str] : TouchNoteSize.M1;

export class Ma2Record {
	recId = Ma2RecordDef.Invalid;
	fields: string[] = [];

	init(str: string) {
		if (!str) return false;

		this.fields = str.split('\t');
		if (!this.fields.length) return false;

		const def = this.fields[0];
		this.recId = isKeyOf(def, Ma2RecordDef) ? Ma2RecordDef[def] : Ma2RecordDef.Invalid;
		return this.recId !== Ma2RecordDef.Invalid;
	}
	getStr(idx: number) {
		return idx < this.fields.length ? this.fields[idx] : '';
	}
	getS32(idx: number, defaultVal = 0) {
		if (idx > this.fields.length) return defaultVal;
		const param = paramData[recordData[this.recId].params[idx - 1]];
		const str = this.fields[idx];
		if (param.int)
			return parseInt(str, 10) || defaultVal;
		return defaultVal;
	}
	getF32(idx: number) {
		if (idx > this.fields.length) return 0;
		const param = paramData[recordData[this.recId].params[idx - 1]];
		const str = this.fields[idx];
		if (param.float)
			return parseFloat(str) || 0;
		return 0;
	}

	getBar() { return this.getS32(1); } // 小节数
	getGrid() { return this.getS32(2); } // 小节内拍数（384 分）
	getPos() { return this.getS32(3); } // 键位

	getHoldLen() { return this.getS32(4); } // 管子时长

	getSlideWaitLen() { return this.getS32(4); } // 星星等待时长
	getSlideShootLen() { return this.getS32(5); } // 星星滑动时长
	getSlideEndPos() { return this.getS32(6); } // 星星结束键位

	getTouchTapSensorType() { return getSensorType(this.getStr(4)); } // touch 判定区类型
	getTouchTapEffType() { return this.getS32(5) as TouchEffectType; } // touch 特效类型
	getTouchTapNoteSize() { return getNoteSize(this.getStr(6) ?? 'M1'); } // touch 大小

	getTouchHoldSensorType() { return getSensorType(this.getStr(5)); } // touch hold 判定区类型
	getTouchHoldEffType() { return this.getS32(6) as TouchEffectType; } // touch hold 特效类型
	getTouchHoldNoteSize() { return getNoteSize(this.getStr(7) ?? 'M1'); } // touch hold 大小
}
