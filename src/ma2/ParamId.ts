export enum Def {
	STRING = 0,
	FLOAT,
	INT,
	SENSOR,
	NOTESSIZE,
	Invalid = -1,
}

const f = <
	V extends number, E extends string, N extends string,
	S extends boolean, I extends boolean, F extends boolean, Sens extends boolean, Size extends boolean
>(
		value: V, enumName: E, name: N, str: S, int: I, float: F, sensor: Sens, notesSize: Size
	) => ({ value, enumName, name, str, int, float, sensor, notesSize }) as const;

export const data = Object.freeze({
	0: f(0, 'STRING', '文字列', true, false, false, false, false),
	1: f(1, 'FLOAT', '小数点', false, false, true, false, false),
	2: f(2, 'INT', '整数', false, true, false, false, false),
	3: f(3, 'SENSOR', 'センサー', true, false, false, true, false),
	4: f(4, 'NOTESSIZE', 'ノーツサイズ', true, false, false, false, true),

	[-1]: f(-1, 'Invalid', '', false, false, false, false, false),
} satisfies Record<Def, any>);

export default { Def, data };
