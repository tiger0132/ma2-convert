export const slice = (n: number, l: number, sz = 1) => (n >>> l) & ((1 << sz) - 1);
export const ext = (n: number, l: number) => n << (32 - l) >> (32 - l);
export const shift = (n: number, l: number, sz: number) => (n & ((1 << sz) - 1)) << l;
export const u = (n: number) => (n >>> 0);
export const id = <T>(x: T) => x;

export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
export type OptionalFields<T> = {
	[K in keyof T as T[K] extends Required<T>[K] ? never : K]-?: T[K];
};

// https://github.com/microsoft/TypeScript/issues/32693
export const safeAssign = <T, U extends keyof T>(dst: T, key: U, src: T[U]) => dst[key] = src;

export function isKeyOf<T extends object>(value: any, def: T): value is keyof T { return value in def; }
