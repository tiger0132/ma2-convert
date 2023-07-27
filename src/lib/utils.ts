import { ok } from 'assert';

export const slice = (n: number, l: number, sz = 1) => (n >>> l) & ((1 << sz) - 1);
export const ext = (n: number, l: number) => n << (32 - l) >> (32 - l);
export const shift = (n: number, l: number, sz: number) => (n & ((1 << sz) - 1)) << l;
export const u = (n: number) => (n >>> 0);
export const id = <T>(x: T) => x;

export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
export type OptionalFields<T> = {
	[K in keyof T as T[K] extends Required<T>[K] ? never : K]-?: T[K];
};
export type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;

// https://github.com/microsoft/TypeScript/issues/32693
export const safeAssign = <T, U extends keyof T>(dst: T, key: U, src: T[U]) => dst[key] = src;

export function isKeyOf<T extends object>(value: any, def: T): value is keyof T { return value in def; }
export function notVoid<T>(val: T | null | undefined): val is T { return val !== null && val !== undefined; }
export const isInt = (x: number) => (x | 0) === x;
export const max = (x: bigint, y: bigint) => x > y ? x : y;

const gcd2 = (a: any, b: any): any => b ? gcd2(b, a % b) : a;
export const gcd = <T extends number[] | bigint[]>(...v: T): T[number] => {
	ok(v.length);
	if (v.length === 1) return v[0];
	let result = v[0];
	for (let i = 1; i < v.length; i++)
		result = gcd2(result, v[i]);
	return result;
}
