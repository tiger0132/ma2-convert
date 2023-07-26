export const simaiSlideType = Object.freeze(['-', '<', '>', '^', 'v', 'p', 'q', 's', 'z', 'w', 'v', 'pp', 'qq', 'V'] as const);
export type SimaiSlideType = typeof simaiSlideType[number];

export enum Modifier {
	Ex = 1,
	Break = 2,
	Firework = 4,
	Star = 8,
};

export type Offset = { pseudo: boolean, offset: number };
export type Len = { denomi: number, num: number };

export type BPM = { type: 'bpm', bpm: number };
export type Measure = { type: 'measure', measure: number };
export type Tap = { type: 'tap', pos: number, children?: Slide[], mod: number };
export type TouchTap = { type: 'touchtap', pos: string, mod: number };
export type Hold = { type: 'hold', pos: number, len?: Len, mod: number };
export type TouchHold = { type: 'touchhold', pos: string, len?: Len, mod: number };
export type Slide = {
	type: 'slide';
	pos: number, endPos: number, midPos?: number;
	wait: Len, shoot: Len;
	shape: SimaiSlideType;
	mod: number;

	subsequent?: Slide[];
};

export type Meter = { type: 'meter', denomi: number, num: number };
export type Click = { type: 'click' };

export type Note = (BPM | Measure | Tap | TouchTap | Hold | TouchHold | Slide | Meter | Click) & Offset;
