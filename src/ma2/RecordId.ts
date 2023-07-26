import { ok } from 'assert';
import { TouchNoteSize, TouchSensorType } from './Ma2Record';
import * as NotesTypeId from './NotesTypeId';
import { Def as Ma2ParamIdDef } from './ParamId';

export enum Ma2Category {
	MA2_Header,
	MA2_Composition,
	MA2_Note,
	MA2_Total,
	MA2_INVALID = -1,
}

export enum SlideType {
	Slide_None,
	Slide_Straight,
	Slide_Circle_L,
	Slide_Circle_R,
	Slide_Curve_L,
	Slide_Curve_R,
	Slide_Thunder_L,
	Slide_Thunder_R,
	Slide_Corner,
	Slide_Bend_L,
	Slide_Bend_R,
	Slide_Skip_L,
	Slide_Skip_R,
	Slide_Fan,
	Slide_INVALID = -1,
}

export const slideNames = Object.freeze([
	'Invalid',
	'SI_',
	'SCL', 'SCR',
	'SUL', 'SUR',
	'SSL', 'SSR',
	'SV_',
	'SXL', 'SXR',
	'SLL', 'SLR',
	'SF_',
] satisfies Omit<Record<SlideType, keyof typeof Def>, SlideType.Slide_INVALID>);

export enum Def {
	// Header
	VERSION = 0,
	FES_MODE,
	BPM_DEF,
	MET_DEF,
	RESOLUTION,
	CLK_DEF,
	COMPATIBLE_CODE,

	// Composition
	BPM,
	MET,
	CLK,

	// 1.02.00 / 1.03.00
	TAP, BRK, XTP, HLD, XHO,
	STR, BST, XST,
	TTP, THO,
	SI_, SCL, SCR, SUL, SUR, SSL, SSR, SV_, SXL, SXR, SLL, SLR, SF_,

	T_REC_TAP, T_REC_BRK, T_REC_XTP, T_REC_HLD, T_REC_XHO,
	T_REC_STR, T_REC_BST, T_REC_XST,
	T_REC_TTP, T_REC_THO,
	T_REC_SLD,
	T_REC_ALL,

	T_NUM_TAP, T_NUM_BRK, T_NUM_HLD, T_NUM_SLD, T_NUM_ALL,
	T_JUDGE_TAP, T_JUDGE_HLD, T_JUDGE_SLD, T_JUDGE_ALL,

	// 1.04.00
	NMTAP, BRTAP, EXTAP, BXTAP,
	NMHLD, BRHLD, EXHLD, BXHLD,
	NMSTR, BRSTR, EXSTR, BXSTR,
	NMTTP, NMTHO,
	NMSI_, BRSI_, EXSI_, BXSI_, CNSI_,
	NMSCL, BRSCL, EXSCL, BXSCL, CNSCL,
	NMSCR, BRSCR, EXSCR, BXSCR, CNSCR,
	NMSUL, BRSUL, EXSUL, BXSUL, CNSUL,
	NMSUR, BRSUR, EXSUR, BXSUR, CNSUR,
	NMSSL, BRSSL, EXSSL, BXSSL, CNSSL,
	NMSSR, BRSSR, EXSSR, BXSSR, CNSSR,
	NMSV_, BRSV_, EXSV_, BXSV_, CNSV_,
	NMSXL, BRSXL, EXSXL, BXSXL, CNSXL,
	NMSXR, BRSXR, EXSXR, BXSXR, CNSXR,
	NMSLL, BRSLL, EXSLL, BXSLL, CNSLL,
	NMSLR, BRSLR, EXSLR, BXSLR, CNSLR,
	NMSF_, BRSF_, EXSF_, BXSF_, CNSF_,

	TTM_EACHPAIRS,
	TTM_SCR_TAP,
	TTM_SCR_BRK,
	TTM_SCR_HLD,
	TTM_SCR_SLD,
	TTM_SCR_ALL,
	TTM_SCR_S,
	TTM_SCR_SS,
	TTM_RAT_ACV,

	// 1.04.00 日本人忘记塞进去的
	T_REC_BXX = 200, T_REC_BHO, T_REC_BXH, T_REC_XBS, T_REC_BSL,

	Invalid = -1,
}

const v103 = [
	'T_REC_TAP', 'T_REC_BRK', 'T_REC_XTP', 'T_REC_HLD', 'T_REC_XHO',
	'T_REC_STR', 'T_REC_BST', 'T_REC_XST',
	'T_REC_TTP', 'T_REC_THO',
	'T_REC_SLD',
	'T_REC_ALL',

	'T_NUM_TAP', 'T_NUM_BRK', 'T_NUM_HLD', 'T_NUM_SLD', 'T_NUM_ALL',
	'T_JUDGE_TAP', 'T_JUDGE_HLD', 'T_JUDGE_SLD', 'T_JUDGE_ALL',

	'TTM_EACHPAIRS',
	'TTM_SCR_TAP',
	'TTM_SCR_BRK',
	'TTM_SCR_HLD',
	'TTM_SCR_SLD',
	'TTM_SCR_ALL',
	'TTM_SCR_S',
	'TTM_SCR_SS',
	'TTM_RAT_ACV',
] as const;
export const totalRecordKeys = Object.freeze({
	'1.02.00': v103,
	'1.03.00': v103,
	'1.04.00': [
		'T_REC_TAP', 'T_REC_BRK', 'T_REC_XTP', 'T_REC_BXX', 'T_REC_HLD', 'T_REC_XHO', 'T_REC_BHO', 'T_REC_BXH',
		'T_REC_STR', 'T_REC_BST', 'T_REC_XST', 'T_REC_XBS',
		'T_REC_TTP', 'T_REC_THO',
		'T_REC_SLD', 'T_REC_BSL',
		'T_REC_ALL',

		'T_NUM_TAP', 'T_NUM_BRK', 'T_NUM_HLD', 'T_NUM_SLD', 'T_NUM_ALL',
		'T_JUDGE_TAP', 'T_JUDGE_HLD', 'T_JUDGE_SLD', 'T_JUDGE_ALL',

		'TTM_EACHPAIRS',
		'TTM_SCR_TAP',
		'TTM_SCR_BRK',
		'TTM_SCR_HLD',
		'TTM_SCR_SLD',
		'TTM_SCR_ALL',
		'TTM_SCR_S',
		'TTM_SCR_SS',
		'TTM_RAT_ACV',
	],
} as const satisfies Record<string, readonly (keyof typeof Def)[]>);

const f = <
	V extends number, E extends string, N extends string, T extends NotesTypeId.Def, S extends SlideType,
	const P extends number, A extends Ma2ParamIdDef[] & { length: P }
>(
		value: V, enumName: E, name: N, typeId: T, slideType: S, paramNum: P, category: Ma2Category, ...params: A
	) => ({ value, enumName, name, typeId, slideType, paramNum, category, params }) as const;

export const data = Object.freeze({
	0: f(0, 'VERSION', 'バージョン', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 2, Ma2Category.MA2_Header, 0, 0),
	1: f(1, 'FES_MODE', '宴モード', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Header, 2),
	2: f(2, 'BPM_DEF', '基本BPM', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 4, Ma2Category.MA2_Header, 1, 1, 1, 1/*, 1*/), // 我觉得是日本人写错了。
	3: f(3, 'MET_DEF', '基本拍数', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 2, Ma2Category.MA2_Header, 2, 2),
	4: f(4, 'RESOLUTION', '解像度', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Header, 2),
	5: f(5, 'CLK_DEF', '初期クリック', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Header, 2),
	6: f(6, 'COMPATIBLE_CODE', '互換コード', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Header, 0),
	7: f(7, 'BPM', 'BPM変更', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 3, Ma2Category.MA2_Composition, 2, 2, 1),
	8: f(8, 'MET', '拍変更', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 4, Ma2Category.MA2_Composition, 2, 2, 2, 2),
	9: f(9, 'CLK', 'クリック音', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 2, Ma2Category.MA2_Composition, 2, 2),
	10: f(10, 'TAP', 'タップ', NotesTypeId.Def.Tap, SlideType.Slide_INVALID, 3, Ma2Category.MA2_Note, 2, 2, 2),
	11: f(11, 'BRK', 'ブレイク', NotesTypeId.Def.Break, SlideType.Slide_INVALID, 3, Ma2Category.MA2_Note, 2, 2, 2),
	12: f(12, 'XTP', 'EXタップ', NotesTypeId.Def.ExTap, SlideType.Slide_INVALID, 3, Ma2Category.MA2_Note, 2, 2, 2),
	13: f(13, 'HLD', 'ホールド', NotesTypeId.Def.Hold, SlideType.Slide_INVALID, 4, Ma2Category.MA2_Note, 2, 2, 2, 2),
	14: f(14, 'XHO', 'EXホールド', NotesTypeId.Def.ExHold, SlideType.Slide_INVALID, 4, Ma2Category.MA2_Note, 2, 2, 2, 2),
	15: f(15, 'STR', '☆', NotesTypeId.Def.Star, SlideType.Slide_INVALID, 3, Ma2Category.MA2_Note, 2, 2, 2),
	16: f(16, 'BST', 'ブレイク☆', NotesTypeId.Def.BreakStar, SlideType.Slide_INVALID, 3, Ma2Category.MA2_Note, 2, 2, 2),
	17: f(17, 'XST', 'EX☆', NotesTypeId.Def.ExStar, SlideType.Slide_INVALID, 3, Ma2Category.MA2_Note, 2, 2, 2),
	18: f(18, 'TTP', 'タッチタップ', NotesTypeId.Def.TouchTap, SlideType.Slide_INVALID, 6, Ma2Category.MA2_Note, 2, 2, 2, 3, 2, 4),
	19: f(19, 'THO', 'タッチホールド', NotesTypeId.Def.TouchHold, SlideType.Slide_INVALID, 7, Ma2Category.MA2_Note, 2, 2, 2, 2, 3, 2, 4),
	20: f(20, 'SI_', 'スライド：直線', NotesTypeId.Def.Slide, SlideType.Slide_Straight, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	21: f(21, 'SCL', 'スライド：外周L', NotesTypeId.Def.Slide, SlideType.Slide_Circle_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	22: f(22, 'SCR', 'スライド：外周R', NotesTypeId.Def.Slide, SlideType.Slide_Circle_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	23: f(23, 'SUL', 'スライド：U字L', NotesTypeId.Def.Slide, SlideType.Slide_Curve_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	24: f(24, 'SUR', 'スライド：U字R', NotesTypeId.Def.Slide, SlideType.Slide_Curve_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	25: f(25, 'SSL', 'スライド：雷L', NotesTypeId.Def.Slide, SlideType.Slide_Thunder_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	26: f(26, 'SSR', 'スライド：雷R', NotesTypeId.Def.Slide, SlideType.Slide_Thunder_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	27: f(27, 'SV_', 'スライド：V字', NotesTypeId.Def.Slide, SlideType.Slide_Corner, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	28: f(28, 'SXL', 'スライド：〆字L', NotesTypeId.Def.Slide, SlideType.Slide_Bend_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	29: f(29, 'SXR', 'スライド：〆字R', NotesTypeId.Def.Slide, SlideType.Slide_Bend_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	30: f(30, 'SLL', 'スライド：L字L', NotesTypeId.Def.Slide, SlideType.Slide_Skip_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	31: f(31, 'SLR', 'スライド：L字R', NotesTypeId.Def.Slide, SlideType.Slide_Skip_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	32: f(32, 'SF_', 'スライド：扇', NotesTypeId.Def.Slide, SlideType.Slide_Fan, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	33: f(33, 'T_REC_TAP', 'レコード数(TAP)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	34: f(34, 'T_REC_BRK', 'レコード数(BRK)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	35: f(35, 'T_REC_XTP', 'レコード数(XTP)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	36: f(36, 'T_REC_HLD', 'レコード数(HLD)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	37: f(37, 'T_REC_XHO', 'レコード数(XHO)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	38: f(38, 'T_REC_STR', 'レコード数(STR)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	39: f(39, 'T_REC_BST', 'レコード数(BST)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	40: f(40, 'T_REC_XST', 'レコード数(XST)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	41: f(41, 'T_REC_TTP', 'レコード数(TTP)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	42: f(42, 'T_REC_THO', 'レコード数(THO)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	43: f(43, 'T_REC_SLD', 'レコード数(SLD)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	44: f(44, 'T_REC_ALL', 'レコード数(ALL)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	45: f(45, 'T_NUM_TAP', 'アクション回数(TAP)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	46: f(46, 'T_NUM_BRK', 'アクション回数(BRK)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	47: f(47, 'T_NUM_HLD', 'アクション回数(HLD)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	48: f(48, 'T_NUM_SLD', 'アクション回数(SLD)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	49: f(49, 'T_NUM_ALL', 'アクション回数(ALL)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	50: f(50, 'T_JUDGE_TAP', '判定数(TAP)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	51: f(51, 'T_JUDGE_HLD', '判定数(HLD)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	52: f(52, 'T_JUDGE_SLD', '判定数(SLD)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	53: f(53, 'T_JUDGE_ALL', '判定数(ALL)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	54: f(54, 'NMTAP', '通常タップ', NotesTypeId.Def.Tap, SlideType.Slide_INVALID, 3, Ma2Category.MA2_Note, 2, 2, 2),
	55: f(55, 'BRTAP', 'ブレイクタップ', NotesTypeId.Def.Break, SlideType.Slide_INVALID, 3, Ma2Category.MA2_Note, 2, 2, 2),
	56: f(56, 'EXTAP', 'EXタップ', NotesTypeId.Def.ExTap, SlideType.Slide_INVALID, 3, Ma2Category.MA2_Note, 2, 2, 2),
	57: f(57, 'BXTAP', 'EXブレイクタップ', NotesTypeId.Def.ExBreakTap, SlideType.Slide_INVALID, 3, Ma2Category.MA2_Note, 2, 2, 2),
	58: f(58, 'NMHLD', '通常ホールド', NotesTypeId.Def.Hold, SlideType.Slide_INVALID, 4, Ma2Category.MA2_Note, 2, 2, 2, 2),
	59: f(59, 'BRHLD', 'ブレイクホールド', NotesTypeId.Def.BreakHold, SlideType.Slide_INVALID, 4, Ma2Category.MA2_Note, 2, 2, 2, 2),
	60: f(60, 'EXHLD', 'EXホールド', NotesTypeId.Def.ExHold, SlideType.Slide_INVALID, 4, Ma2Category.MA2_Note, 2, 2, 2, 2),
	61: f(61, 'BXHLD', 'EXブレイクホールド', NotesTypeId.Def.ExBreakHold, SlideType.Slide_INVALID, 4, Ma2Category.MA2_Note, 2, 2, 2, 2),
	62: f(62, 'NMSTR', '通常☆', NotesTypeId.Def.Star, SlideType.Slide_INVALID, 3, Ma2Category.MA2_Note, 2, 2, 2),
	63: f(63, 'BRSTR', 'ブレイク☆', NotesTypeId.Def.BreakStar, SlideType.Slide_INVALID, 3, Ma2Category.MA2_Note, 2, 2, 2),
	64: f(64, 'EXSTR', 'EX☆', NotesTypeId.Def.ExStar, SlideType.Slide_INVALID, 3, Ma2Category.MA2_Note, 2, 2, 2),
	65: f(65, 'BXSTR', 'EXブレイク☆', NotesTypeId.Def.ExBreakStar, SlideType.Slide_INVALID, 3, Ma2Category.MA2_Note, 2, 2, 2),
	66: f(66, 'NMTTP', '通常タッチタップ', NotesTypeId.Def.TouchTap, SlideType.Slide_INVALID, 6, Ma2Category.MA2_Note, 2, 2, 2, 3, 2, 4),
	67: f(67, 'NMTHO', '通常タッチホールド', NotesTypeId.Def.TouchHold, SlideType.Slide_INVALID, 7, Ma2Category.MA2_Note, 2, 2, 2, 2, 3, 2, 4),
	68: f(68, 'NMSI_', '通常スライド：直線', NotesTypeId.Def.Slide, SlideType.Slide_Straight, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	69: f(69, 'BRSI_', 'ブレイクスライド：直線', NotesTypeId.Def.BreakSlide, SlideType.Slide_Straight, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	70: f(70, 'EXSI_', 'EXスライド：直線', NotesTypeId.Def.ExSlide, SlideType.Slide_Straight, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	71: f(71, 'BXSI_', 'EXブレイクスライド：直線', NotesTypeId.Def.ExBreakSlide, SlideType.Slide_Straight, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	72: f(72, 'CNSI_', '接続スライド：直線', NotesTypeId.Def.ConnectSlide, SlideType.Slide_Straight, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	73: f(73, 'NMSCL', '通常スライド：外周L', NotesTypeId.Def.Slide, SlideType.Slide_Circle_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	74: f(74, 'BRSCL', 'ブレイクスライド：外周L', NotesTypeId.Def.BreakSlide, SlideType.Slide_Circle_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	75: f(75, 'EXSCL', 'EXスライド：外周L', NotesTypeId.Def.ExSlide, SlideType.Slide_Circle_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	76: f(76, 'BXSCL', 'EXブレイクスライド：外周L', NotesTypeId.Def.ExBreakSlide, SlideType.Slide_Circle_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	77: f(77, 'CNSCL', '接続スライド：外周L', NotesTypeId.Def.ConnectSlide, SlideType.Slide_Circle_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	78: f(78, 'NMSCR', '通常スライド：外周R', NotesTypeId.Def.Slide, SlideType.Slide_Circle_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	79: f(79, 'BRSCR', 'ブレイクスライド：外周R', NotesTypeId.Def.BreakSlide, SlideType.Slide_Circle_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	80: f(80, 'EXSCR', 'EXスライド：外周R', NotesTypeId.Def.ExSlide, SlideType.Slide_Circle_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	81: f(81, 'BXSCR', 'EXブレイクスライド：外周R', NotesTypeId.Def.ExBreakSlide, SlideType.Slide_Circle_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	82: f(82, 'CNSCR', '接続スライド：外周R', NotesTypeId.Def.ConnectSlide, SlideType.Slide_Circle_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	83: f(83, 'NMSUL', '通常スライド：U字L', NotesTypeId.Def.Slide, SlideType.Slide_Curve_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	84: f(84, 'BRSUL', 'ブレイクスライド：U字L', NotesTypeId.Def.BreakSlide, SlideType.Slide_Curve_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	85: f(85, 'EXSUL', 'EXスライド：U字L', NotesTypeId.Def.ExSlide, SlideType.Slide_Curve_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	86: f(86, 'BXSUL', 'EXブレイクスライド：U字L', NotesTypeId.Def.ExBreakSlide, SlideType.Slide_Curve_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	87: f(87, 'CNSUL', '接続スライド：U字L', NotesTypeId.Def.ConnectSlide, SlideType.Slide_Curve_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	88: f(88, 'NMSUR', '通常スライド：U字R', NotesTypeId.Def.Slide, SlideType.Slide_Curve_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	89: f(89, 'BRSUR', 'ブレイクスライド：U字R', NotesTypeId.Def.BreakSlide, SlideType.Slide_Curve_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	90: f(90, 'EXSUR', 'EXスライド：U字R', NotesTypeId.Def.ExSlide, SlideType.Slide_Curve_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	91: f(91, 'BXSUR', 'EXブレイクスライド：U字R', NotesTypeId.Def.ExBreakSlide, SlideType.Slide_Curve_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	92: f(92, 'CNSUR', '接続スライド：U字R', NotesTypeId.Def.ConnectSlide, SlideType.Slide_Curve_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	93: f(93, 'NMSSL', '通常スライド：雷L', NotesTypeId.Def.Slide, SlideType.Slide_Thunder_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	94: f(94, 'BRSSL', 'ブレイクスライド：雷L', NotesTypeId.Def.BreakSlide, SlideType.Slide_Thunder_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	95: f(95, 'EXSSL', 'EXスライド：雷L', NotesTypeId.Def.ExSlide, SlideType.Slide_Thunder_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	96: f(96, 'BXSSL', 'EXブレイクスライド：雷L', NotesTypeId.Def.ExBreakSlide, SlideType.Slide_Thunder_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	97: f(97, 'CNSSL', '接続スライド：雷L', NotesTypeId.Def.ConnectSlide, SlideType.Slide_Thunder_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	98: f(98, 'NMSSR', '通常スライド：雷R', NotesTypeId.Def.Slide, SlideType.Slide_Thunder_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	99: f(99, 'BRSSR', 'ブレイクスライド：雷R', NotesTypeId.Def.BreakSlide, SlideType.Slide_Thunder_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	100: f(100, 'EXSSR', 'EXスライド：雷R', NotesTypeId.Def.ExSlide, SlideType.Slide_Thunder_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	101: f(101, 'BXSSR', 'EXブレイクスライド：雷R', NotesTypeId.Def.ExBreakSlide, SlideType.Slide_Thunder_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	102: f(102, 'CNSSR', '接続スライド：雷R', NotesTypeId.Def.ConnectSlide, SlideType.Slide_Thunder_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	103: f(103, 'NMSV_', '通常スライド：V字', NotesTypeId.Def.Slide, SlideType.Slide_Corner, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	104: f(104, 'BRSV_', 'ブレイクスライド：V字', NotesTypeId.Def.BreakSlide, SlideType.Slide_Corner, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	105: f(105, 'EXSV_', 'EXスライド：V字', NotesTypeId.Def.ExSlide, SlideType.Slide_Corner, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	106: f(106, 'BXSV_', 'EXブレイクスライド：V字', NotesTypeId.Def.ExBreakSlide, SlideType.Slide_Corner, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	107: f(107, 'CNSV_', '接続スライド：V字', NotesTypeId.Def.ConnectSlide, SlideType.Slide_Corner, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	108: f(108, 'NMSXL', '通常スライド：〆字L', NotesTypeId.Def.Slide, SlideType.Slide_Bend_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	109: f(109, 'BRSXL', 'ブレイクスライド：〆字L', NotesTypeId.Def.BreakSlide, SlideType.Slide_Bend_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	110: f(110, 'EXSXL', 'EXスライド：〆字L', NotesTypeId.Def.ExSlide, SlideType.Slide_Bend_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	111: f(111, 'BXSXL', 'EXブレイクスライド：〆字L', NotesTypeId.Def.ExBreakSlide, SlideType.Slide_Bend_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	112: f(112, 'CNSXL', '接続スライド：〆字L', NotesTypeId.Def.ConnectSlide, SlideType.Slide_Bend_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	113: f(113, 'NMSXR', '通常スライド：〆字R', NotesTypeId.Def.Slide, SlideType.Slide_Bend_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	114: f(114, 'BRSXR', 'ブレイクスライド：〆字R', NotesTypeId.Def.BreakSlide, SlideType.Slide_Bend_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	115: f(115, 'EXSXR', 'EXスライド：〆字R', NotesTypeId.Def.ExSlide, SlideType.Slide_Bend_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	116: f(116, 'BXSXR', 'EXブレイクスライド：〆字R', NotesTypeId.Def.ExBreakSlide, SlideType.Slide_Bend_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	117: f(117, 'CNSXR', '接続スライド：〆字R', NotesTypeId.Def.ConnectSlide, SlideType.Slide_Bend_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	118: f(118, 'NMSLL', '通常スライド：L字L', NotesTypeId.Def.Slide, SlideType.Slide_Skip_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	119: f(119, 'BRSLL', 'ブレイクスライド：L字L', NotesTypeId.Def.BreakSlide, SlideType.Slide_Skip_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	120: f(120, 'EXSLL', 'EXスライド：L字L', NotesTypeId.Def.ExSlide, SlideType.Slide_Skip_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	121: f(121, 'BXSLL', 'EXブレイクスライド：L字L', NotesTypeId.Def.ExBreakSlide, SlideType.Slide_Skip_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	122: f(122, 'CNSLL', '接続スライド：L字L', NotesTypeId.Def.ConnectSlide, SlideType.Slide_Skip_L, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	123: f(123, 'NMSLR', '通常スライド：L字R', NotesTypeId.Def.Slide, SlideType.Slide_Skip_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	124: f(124, 'BRSLR', 'ブレイクスライド：L字R', NotesTypeId.Def.BreakSlide, SlideType.Slide_Skip_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	125: f(125, 'EXSLR', 'EXスライド：L字R', NotesTypeId.Def.ExSlide, SlideType.Slide_Skip_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	126: f(126, 'BXSLR', 'EXブレイクスライド：L字R', NotesTypeId.Def.ExBreakSlide, SlideType.Slide_Skip_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	127: f(127, 'CNSLR', '接続スライド：L字R', NotesTypeId.Def.ConnectSlide, SlideType.Slide_Skip_R, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	128: f(128, 'NMSF_', '通常スライド：扇', NotesTypeId.Def.Slide, SlideType.Slide_Fan, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	129: f(129, 'BRSF_', 'ブレイクスライド：扇', NotesTypeId.Def.BreakSlide, SlideType.Slide_Fan, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	130: f(130, 'EXSF_', 'EXスライド：扇', NotesTypeId.Def.ExSlide, SlideType.Slide_Fan, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	131: f(131, 'BXSF_', 'EXブレイクスライド：扇', NotesTypeId.Def.ExBreakSlide, SlideType.Slide_Fan, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	132: f(132, 'CNSF_', '接続スライド：扇', NotesTypeId.Def.ConnectSlide, SlideType.Slide_Fan, 6, Ma2Category.MA2_Note, 2, 2, 2, 2, 2, 2),
	133: f(133, 'TTM_EACHPAIRS', 'eachペア数', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	134: f(134, 'TTM_SCR_TAP', 'TAPスコア', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	135: f(135, 'TTM_SCR_BRK', 'BREAKスコア', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	136: f(136, 'TTM_SCR_HLD', 'HOLDスコア', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	137: f(137, 'TTM_SCR_SLD', 'スライドスコア', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	138: f(138, 'TTM_SCR_ALL', '合計スコア', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	139: f(139, 'TTM_SCR_S', 'RankSスコア', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	140: f(140, 'TTM_SCR_SS', 'TTM_SCR_SS', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	141: f(141, 'TTM_RAT_ACV', 'TTM_RAT_ACV', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),

	// 看起来是日本人忘记塞进去了，我来仿写一个
	200: f(200, 'T_REC_BXX', 'レコード数(BXX)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	201: f(201, 'T_REC_BHO', 'レコード数(BHO)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	202: f(202, 'T_REC_BXH', 'レコード数(BXH)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	203: f(203, 'T_REC_XBS', 'レコード数(XBS)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),
	204: f(204, 'T_REC_BSL', 'レコード数(BSL)', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 1, Ma2Category.MA2_Total, 2),

	[-1]: f(-1, 'Invalid', '', NotesTypeId.Def.Invalid, SlideType.Slide_INVALID, 0, Ma2Category.MA2_INVALID),
} satisfies Record<Def, any>);

// anyscript time
const remappedData = {} as TransformedData;
for (const k in data)
	(remappedData as any)[(data as any)[k].enumName] = (data as any)[k];

type Keys = keyof Omit<typeof Def, 'Invalid'>;
type Data = typeof data[keyof typeof data];
type TransformedData = { [k in Data['enumName']]: Extract<Data, { enumName: k }> };

type ParamTypeMap = {
	0: string, 1: number, 2: number,
	3: keyof typeof TouchSensorType,
	4: keyof typeof TouchNoteSize,
	[-1]: never,
};
type TransformParams<T extends Ma2ParamIdDef[]> =
	T extends [] ? [] :
	T extends [infer H extends Ma2ParamIdDef, ...infer R extends Ma2ParamIdDef[]] ?
	[ParamTypeMap[H], ...TransformParams<R>] : never;

type ToArgs<K extends Keys> = TransformParams<TransformedData[K]['params']>;
export function fmt<K extends Keys>(key: K, ...args: ToArgs<K>) {
	const params = remappedData[key].params;
	return [key, ...args.map((x, i) =>
		params[i] === Ma2ParamIdDef.FLOAT ?
			(ok(typeof x === 'number'), x.toFixed(3)) :
			x.toString()
	)].join('\t');
}

export default { Def, fmt, data, SlideType, Ma2Category };
