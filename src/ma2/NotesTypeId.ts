import { Def as Ma2RecordDef } from './RecordId';

export enum Def {
	Tap = 0,
	Break,
	ExTap,
	Hold,
	ExHold,
	Slide,
	Star,
	BreakStar,
	ExStar,
	TouchTap,
	TouchHold,
	ExBreakTap,
	BreakHold,
	ExBreakHold,
	BreakSlide,
	ExSlide,
	ExBreakSlide,
	ExBreakStar,
	ConnectSlide,
}

export enum BaseDef {
	Tap = 0,
	Hold,
	Slide,
	Invalid = -1,
}

export const slidePrefixes = Object.freeze({
	[Def.Slide]: 'NM',
	[Def.BreakSlide]: 'BR',
	[Def.ExSlide]: 'EX',
	[Def.ExBreakSlide]: 'BX',
	[Def.ConnectSlide]: 'CN',
});

export const recordDefNames = Object.freeze([
	'TAP', 'BRK', 'XTP',
	'HLD', 'XHO',
	'SLD',
	'STR', 'BST', 'XST',
	'TTP', 'THO',
	'BXX', 'BHO', 'BXH', 'BSL', null, null, 'XBS', null
] as const satisfies Record<Def, string | null>);

const v103 = [
	'TAP', 'BRK', 'XTP',
	'HLD', 'XHO',
	'Invalid',
	'STR', 'BST', 'XST',
	'TTP', 'THO',
	'Invalid', 'Invalid', 'Invalid', 'Invalid', 'Invalid', 'Invalid', 'Invalid', 'Invalid'
] as const;
export const defNames = Object.freeze({
	'1.02.00': v103,
	'1.03.00': v103,
	'1.04.00': [
		'NMTAP', 'BRTAP', 'EXTAP',
		'NMHLD', 'EXHLD',
		'Invalid',
		'NMSTR', 'BRSTR', 'EXSTR',
		'NMTTP', 'NMTHO',
		'BXTAP', 'BRHLD', 'BXHLD', 'Invalid', 'Invalid', 'Invalid', 'BXSTR', 'Invalid'
	],
} satisfies Record<string, Record<Def, keyof typeof Ma2RecordDef>>);

const f = <
	V extends number, E extends string, N extends string, C extends number, D extends number, B extends BaseDef
>(
		value: V, enumName: E, name: N, sctTypeId: C, sdtTypeId: D, baseType: B
	) => ({ value, enumName, name, sctTypeId, sdtTypeId, baseType }) as const;

export const data = Object.freeze({
	0: f(0, 'Tap', 'タップ', 1, 1, BaseDef.Tap),
	1: f(1, 'Break', 'ブレイク', 3, 3, BaseDef.Tap),
	2: f(2, 'ExTap', 'EXタップ', 3, 3, BaseDef.Tap),
	3: f(3, 'Hold', 'ホールド', 2, 2, BaseDef.Hold),
	4: f(4, 'ExHold', 'EXホールド', 2, 2, BaseDef.Hold),
	5: f(5, 'Slide', 'スライド', 0, 0, BaseDef.Slide),
	6: f(6, 'Star', '☆', 4, 4, BaseDef.Tap),
	7: f(7, 'BreakStar', '☆ブレイク', 5, 5, BaseDef.Tap),
	8: f(8, 'ExStar', 'Ex☆', 5, 5, BaseDef.Tap),
	9: f(9, 'TouchTap', 'タッチタップ', 6, 6, BaseDef.Tap),
	10: f(10, 'TouchHold', 'タッチホールド', 7, 7, BaseDef.Hold),
	11: f(10, 'ExBreakTap', 'Exブレイクタップ', 3, 3, BaseDef.Tap),
	12: f(10, 'BreakHold', 'ブレイクホールド', 2, 2, BaseDef.Hold),
	13: f(10, 'ExBreakHold', 'Exブレイクホールド', 2, 2, BaseDef.Hold),
	14: f(10, 'BreakSlide', 'ブレイクスライド', 0, 0, BaseDef.Slide),
	15: f(10, 'ExSlide', 'EXスライド', 0, 0, BaseDef.Slide), // 这三个原本是 "EX" 而不是 "Ex"，我觉得是日本人写错了
	16: f(10, 'ExBreakSlide', 'EXブレイクスライド', 0, 0, BaseDef.Slide),
	17: f(10, 'ExBreakStar', 'EXブレイク☆', 5, 5, BaseDef.Tap),
	18: f(10, 'ConnectSlide', '接続スライド', 8, 8, BaseDef.Slide),
} satisfies Record<Def, any>);

export default { Def, BaseDef, data };
