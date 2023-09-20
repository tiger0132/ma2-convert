import { Ma2 } from './Ma2Notes';
import { SlideType } from './RecordId';

enum HitPoint {
	A1, A2, A3, A4, A5, A6, A7, A8,
	B1, B2, B3, B4, B5, B6, B7, B8,
	D1, D2, D3, D4, D5, D6, D7, D8,
	E1, E2, E3, E4, E5, E6, E7, E8,
	C1, C2,
};
const $ = HitPoint;

const hitPointFlip = [
	$.A1, $.A8, $.A8, $.A7, $.A6, $.A5, $.A4, $.A3, $.A2,
	$.B1, $.B8, $.B8, $.B7, $.B6, $.B5, $.B4, $.B3, $.B2,
	$.D1, $.D8, $.D8, $.D7, $.D6, $.D5, $.D4, $.D3, $.D2,
	$.E1, $.E8, $.E8, $.E7, $.E6, $.E5, $.E4, $.E3, $.E2,
	$.C2, $.C1,
] satisfies Record<HitPoint, HitPoint>;

interface HitArea {
	pushDis: number;
	releaseDis: number;
	hitPoints: HitPoint[];
}

const Circle_Half = 113.34442; // 1>2 中，A1 判定区内经过的距离
const Circle_Mid = 16.928831; // 1>2 中，A1 判定区外经过的距离
const Circle_Full = 226.68884; // 1>3 中，A2 判定区内经过的距离

const Line3_Half = 130.19072; // 1-3 中，A1 判定区内经过的距离
const Line3_Mid = 129.12659; // 1-3 中，A1 判定区外经过的距离
const Line3_A2B2_Full = 159.6083; // 1-3 中，A2/B2 判定区内经过的距离

const Line4_Half = 159.0022;
const Line4_A1B2_Mid = 130.99997;
const Line4_B2_Full = 139.28003;
const Line4_B2B3_Mid = 28.28998;

const Line5_Half = 156.42125;
const Line5_A1B1_Mid = 43.27424;
const Line5_B1_Full = 128.99178;
const Line5_B1C_Mid = 42.19922;
const Line5_C_Full = 218.6303;
const Line5_B1_Half = 64.49589;

// UA: p/q 星星从 A 进入 B 的部分
const UA_A_Half = 159.36723; // 1-B2 中，A1 判定区内经过的距离
const UA_A1B2_Mid = 131.08733; // 1-B2 中，A1 判定外内经过的距离
const UA_B_Half = 69.3482; // 1-B2 中，B2 判定区内经过的距离

// UB: p/q 星星完全在 B 中的部分
const UB_Half = 75.921364;
const UB_Mid = 16.465057;
const UB_Full = 151.84273;

// UAB: p/q 星星第一个或最后一个 B 区内的部分
const UAB_Full = UA_B_Half + UB_Half;

const area = (hitPoints: HitPoint[], pushDis: number, releaseDis: number): HitArea => ({ hitPoints, pushDis, releaseDis });

const lineHitAreaList = [
	[],
	[],
	[
		area([$.A1], Line3_Half, Line3_Mid),
		area([$.A2, $.B2], Line3_A2B2_Full, Line3_Mid),
		area([$.A3], Line3_Half, 0)
	],
	[
		area([$.A1], Line4_Half, Line4_A1B2_Mid),
		area([$.B2], Line4_B2_Full, Line4_B2B3_Mid),
		area([$.B3], Line4_B2_Full, Line4_A1B2_Mid),
		area([$.A4], Line4_Half, 0)
	],
	[
		area([$.A1], Line5_Half, Line5_A1B1_Mid),
		area([$.B1], Line5_B1_Full, Line5_B1C_Mid),
		area([$.C1], Line5_C_Full, Line5_B1C_Mid),
		area([$.B5], Line5_B1_Full, Line5_A1B1_Mid),
		area([$.A5], Line5_Half, 0)
	],
	[
		area([$.A1], Line4_Half, Line4_A1B2_Mid),
		area([$.B8], Line4_B2_Full, Line4_B2B3_Mid),
		area([$.B7], Line4_B2_Full, Line4_A1B2_Mid),
		area([$.A6], Line4_Half, 0)
	],
	[
		area([$.A1], Line3_Half, Line3_Mid),
		area([$.A8, $.B8], Line3_A2B2_Full, Line3_Mid),
		area([$.A7], Line3_Half, 0)
	],
	[]
];

const circleCurve = (...h: HitPoint[]) => h.map((x, i) => {
	if (i === 0) return area([x], Circle_Half, Circle_Mid);
	if (i === h.length - 1) return area([x], Circle_Half, 0);
	return area([x], Circle_Full, Circle_Mid);
});
const circleHitAreaListL = [
	circleCurve($.A1, $.A8, $.A7, $.A6, $.A5, $.A4, $.A3, $.A2, $.A1),
	circleCurve($.A1, $.A8, $.A7, $.A6, $.A5, $.A4, $.A3, $.A2),
	circleCurve($.A1, $.A8, $.A7, $.A6, $.A5, $.A4, $.A3),
	circleCurve($.A1, $.A8, $.A7, $.A6, $.A5, $.A4),
	circleCurve($.A1, $.A8, $.A7, $.A6, $.A5),
	circleCurve($.A1, $.A8, $.A7, $.A6),
	circleCurve($.A1, $.A8, $.A7),
	circleCurve($.A1, $.A8),
];

const uCurve = (...h: HitPoint[]) => h.map((x, i) => {
	if (i === 0) return area([x], UA_A_Half, UA_A1B2_Mid);
	if (i === 1) return area([x], UAB_Full, UB_Mid);
	if (i === h.length - 2) return area([x], UAB_Full, UA_A1B2_Mid);
	if (i === h.length - 1) return area([x], UA_A_Half, 0);
	return area([x], UB_Full, UB_Mid);
});
const uHitAreaListL = [
	uCurve($.A1, $.B8, $.B7, $.B6, $.B5, $.B4, $.B3, $.B2, $.A1),
	uCurve($.A1, $.B8, $.B7, $.B6, $.B5, $.B4, $.B3, $.A2),
	uCurve($.A1, $.B8, $.B7, $.B6, $.B5, $.B4, $.A3),
	uCurve($.A1, $.B8, $.B7, $.B6, $.B5, $.A4),
	uCurve($.A1, $.B8, $.B7, $.B6, $.A5),
	uCurve($.A1, $.B8, $.B7, $.B6, $.B5, $.B4, $.B3, $.B2, $.B1, $.B8, $.B7, $.A6),
	uCurve($.A1, $.B8, $.B7, $.B6, $.B5, $.B4, $.B3, $.B2, $.B1, $.B8, $.A7),
	uCurve($.A1, $.B8, $.B7, $.B6, $.B5, $.B4, $.B3, $.B2, $.B1, $.A8),
];

const thunderHitAreaListL = [
	[],
	[],
	[],
	[],
	[
		area([$.A1], UA_A_Half, UA_A1B2_Mid),
		area([$.B8], UAB_Full, UB_Mid),
		area([$.B7], UB_Full, Line5_B1C_Mid),
		area([$.C1], Line5_C_Full, Line5_B1C_Mid),
		area([$.B3], UB_Full, UB_Mid),
		area([$.B4], UAB_Full, UA_A1B2_Mid),
		area([$.A5], UA_A_Half, 0),
	],
	[],
	[],
	[]
];

const vCurve = (b: HitPoint, a: HitPoint) => [
	area([$.A1], Line5_Half, Line5_A1B1_Mid),
	area([$.B1], Line5_B1_Full, Line5_B1C_Mid),
	area([$.C1], Line5_C_Full, Line5_B1C_Mid),
	area([b], Line5_B1_Full, Line5_A1B1_Mid),
	area([a], Line5_Half, 0)
];
const vHitAreaList = [
	[],
	vCurve($.B2, $.A2),
	vCurve($.B3, $.A3),
	vCurve($.B4, $.A4),
	[],
	vCurve($.B6, $.A6),
	vCurve($.B7, $.A7),
	vCurve($.B8, $.A8),
];

const cupHitAreaListL = [
	[
		area([$.A1], Line5_Half, Line5_A1B1_Mid),
		area([$.B1], Line5_B1_Full, Line5_B1C_Mid),
		area([$.C1], Line5_C_Full, Line5_B1C_Mid),
		area([$.B4], 133.84408569335938, UA_A1B2_Mid),
		area([$.A3], 272.711669921875, Circle_Mid),
		area([$.A2], Circle_Full, Circle_Mid),
		area([$.A1], Circle_Half, 0)
	],
	[
		area([$.A1], Line5_Half, Line5_A1B1_Mid),
		area([$.B1], Line5_B1_Full, Line5_B1C_Mid),
		area([$.C1], Line5_C_Full, Line5_B1C_Mid),
		area([$.B4], 133.84408569335938, UA_A1B2_Mid),
		area([$.A3], 272.711669921875, Circle_Mid),
		area([$.A2], Circle_Half, 0)
	],
	[
		area([$.A1], Line5_Half, Line5_A1B1_Mid),
		area([$.B1], Line5_B1_Full, Line5_B1C_Mid),
		area([$.C1], Line5_C_Full, Line5_B1C_Mid),
		area([$.B4], 133.84408569335938, UA_A1B2_Mid),
		area([$.A3], UA_A_Half, 0)
	],
	[
		area([$.A1], Line5_Half, Line5_A1B1_Mid),
		area([$.B1], Line5_B1_Full, Line5_B1C_Mid),
		area([$.C1], Line5_C_Full, Line5_B1C_Mid),
		area([$.B4], 133.84408569335938, UA_A1B2_Mid),
		area([$.A3], 272.711669921875, Circle_Mid),
		area([$.A2], UA_A_Half, UA_A1B2_Mid),
		area([$.B1], 133.84408569335938, Line5_B1C_Mid),
		area([$.C1], Line5_C_Full, Line5_B1C_Mid),
		area([$.B4], Line5_B1_Full, Line5_A1B1_Mid),
		area([$.A4], Line5_Half, 0)
	],
	[
		area([$.A1], Line5_Half, Line5_A1B1_Mid),
		area([$.B1], Line5_B1_Full, Line5_B1C_Mid),
		area([$.C1], Line5_C_Full, Line5_B1C_Mid),
		area([$.B4], 133.84408569335938, UA_A1B2_Mid),
		area([$.A3], 272.711669921875, Circle_Mid),
		area([$.A2], UA_A_Half, UA_A1B2_Mid),
		area([$.B1], 133.84408569335938, Line5_B1C_Mid),
		area([$.C1], Line5_C_Full, Line5_B1C_Mid),
		area([$.B5], Line5_B1_Full, Line5_A1B1_Mid),
		area([$.A5], Line5_Half, 0)
	],
	[
		area([$.A1], Line5_Half, Line5_A1B1_Mid),
		area([$.B1], Line5_B1_Full, Line5_B1C_Mid),
		area([$.C1], Line5_C_Full, Line5_B1C_Mid),
		area([$.B4], 133.84408569335938, UA_A1B2_Mid),
		area([$.A3], 272.711669921875, Circle_Mid),
		area([$.A2], UA_A_Half, UA_A1B2_Mid),
		area([$.B1], UAB_Full, UB_Mid),
		area([$.B8, $.C1], UB_Full, UB_Mid),
		area([$.B7, $.B6], UAB_Full, UA_A1B2_Mid),
		area([$.A6], UA_A_Half, 0)
	],
	[
		area([$.A1], Line5_Half, Line5_A1B1_Mid),
		area([$.B1], Line5_B1_Full, Line5_B1C_Mid),
		area([$.C1], Line5_C_Full, Line5_B1C_Mid),
		area([$.B4], 133.84408569335938, UA_A1B2_Mid),
		area([$.A3], 272.711669921875, Circle_Mid),
		area([$.A2], UA_A_Half, UA_A1B2_Mid),
		area([$.B1], UAB_Full, UB_Mid),
		area([$.B8], UB_Full, UB_Mid),
		area([$.A7], UA_A_Half, 0)
	],
	[
		area([$.A1], Line5_Half, Line5_A1B1_Mid),
		area([$.B1], Line5_B1_Full, Line5_B1C_Mid),
		area([$.C1], Line5_C_Full, Line5_B1C_Mid),
		area([$.B4], 133.84408569335938, UA_A1B2_Mid),
		area([$.A3], 272.711669921875, Circle_Mid),
		area([$.A2], UA_A_Half, UA_A1B2_Mid),
		area([$.A1, $.B1], UA_A_Half, UA_A1B2_Mid),
		area([$.A8], Circle_Half, 0)
	]
];

const lHitAreaListL = [
	[],
	[
		area([$.A1], Line3_Half, Line3_Mid),
		area([$.A8, $.B8], Line3_A2B2_Full, Line3_Mid),
		area([$.A7], 289.5579528808594, UA_A1B2_Mid),
		area([$.B8], UAB_Full, UA_A1B2_Mid),
		area([$.B1], UAB_Full, UA_A1B2_Mid),
		area([$.A2], UA_A_Half, 0)
	],
	[
		area([$.A1], Line3_Half, Line3_Mid),
		area([$.A8, $.B8], Line3_A2B2_Full, Line3_Mid),
		area([$.A7], 286.6119689941406, Line5_A1B1_Mid),
		area([$.B7], Line5_B1_Full, Line5_B1C_Mid),
		area([$.C1], Line5_C_Full, Line5_B1C_Mid),
		area([$.B3], Line5_B1_Full, Line5_A1B1_Mid),
		area([$.A3], Line5_Half, 0)
	],
	[
		area([$.A1], Line3_Half, Line3_Mid),
		area([$.A8, $.B8], Line3_A2B2_Full, Line3_Mid),
		area([$.A7], 289.5579528808594, UA_A1B2_Mid),
		area([$.B6], UAB_Full, UB_Mid),
		area([$.B5], UAB_Full, UA_A1B2_Mid),
		area([$.A4], UA_A_Half, 0)
	],
	[
		area([$.A1], Line3_Half, Line3_Mid),
		area([$.A8, $.B8], Line3_A2B2_Full, Line3_Mid),
		area([$.A7], 260.3814392089844, Line3_Mid),
		area([$.A6, $.B6], Line3_A2B2_Full, Line3_Mid),
		area([$.A5], Line3_Half, 0),
	],
	[],
	[],
	[]
];

const fanHitAreaList = [
	[],
	[],
	[],
	[
		area([$.A1], Line4_Half, Line4_A1B2_Mid),
		area([$.B2], Line4_B2_Full, Line4_B2B3_Mid),
		area([$.B3], Line4_B2_Full, Line4_A1B2_Mid),
		area([$.A4, $.D5], Line4_Half, 0)
	],
	[
		area([$.A1], Line5_Half, Line5_A1B1_Mid),
		area([$.B1], Line5_B1_Full, Line5_B1C_Mid),
		area([$.C1], Line5_C_Full, Line5_B1C_Mid),
		area([$.B5], Line5_B1_Full, Line5_A1B1_Mid),
		area([$.A5], Line5_Half, 0)
	],
	[
		area([$.A1], Line4_Half, Line4_A1B2_Mid),
		area([$.B8], Line4_B2_Full, Line4_B2B3_Mid),
		area([$.B7], Line4_B2_Full, Line4_A1B2_Mid),
		area([$.A6, $.D6], Line4_Half, 0),
	],
	[],
	[]
];

const hitAreaList = {} as Record<SlideType, HitArea[][][]>;

function rotate(x: HitPoint, offset: number) {
	if (x >= HitPoint.C1) return x;
	return (x & ~7) | ((x + offset) % 8);
}
function addHitArea(shape: SlideType, hitArea: HitArea[][], flip = false) {
	const list = [] as HitArea[][][];
	for (let pos = 0; pos < 8; pos++) {
		list.push(hitArea.map(path => [...path]
			.map(({ hitPoints, pushDis, releaseDis }) => ({
				hitPoints: hitPoints.map(x => rotate(flip ? hitPointFlip[x] : x, pos)),
				pushDis, releaseDis,
			}))
		));
	}
	hitAreaList[shape] = list;
}
function register() {
	addHitArea(SlideType.Slide_Straight, lineHitAreaList);
	addHitArea(SlideType.Slide_Circle_L, circleHitAreaListL);
	addHitArea(SlideType.Slide_Circle_R, circleHitAreaListL, true);
	addHitArea(SlideType.Slide_Curve_L, uHitAreaListL);
	addHitArea(SlideType.Slide_Curve_R, uHitAreaListL, true);
	addHitArea(SlideType.Slide_Thunder_L, thunderHitAreaListL);
	addHitArea(SlideType.Slide_Thunder_R, thunderHitAreaListL, true);
	addHitArea(SlideType.Slide_Corner, vHitAreaList);
	addHitArea(SlideType.Slide_Bend_L, cupHitAreaListL);
	addHitArea(SlideType.Slide_Bend_R, cupHitAreaListL, true);
	addHitArea(SlideType.Slide_Skip_L, lHitAreaListL);
	addHitArea(SlideType.Slide_Skip_R, lHitAreaListL, true);
	addHitArea(SlideType.Slide_Fan, fanHitAreaList);
}
register();

function getSlideTypeLength(shape: SlideType, start: number, end: number) {
	let len = (end - start + 8) % 8;
	if (
		shape === SlideType.Slide_Bend_R ||
		shape === SlideType.Slide_Circle_R ||
		shape === SlideType.Slide_Curve_R ||
		shape === SlideType.Slide_Skip_R ||
		shape === SlideType.Slide_Thunder_R) {
		len = (8 - len) % 8;
	}
	return len;
}

export function getSlideHitArea(slide: Ma2.Slide): HitArea[] {
	const { shape, pos, endPos } = slide;
	const len = getSlideTypeLength(shape, pos, endPos);

	return (0 as any)[shape][pos][len];
}