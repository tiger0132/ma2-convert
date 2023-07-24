import chalk from 'chalk';

interface WrapConfig {
	wrap?: boolean;
	end?: boolean;
	prof?: boolean;
}
const defaultConfig: Required<WrapConfig> = { wrap: true, end: true, prof: false } as const;
Object.freeze(defaultConfig);

export class Logger {
	#indent = '';

	debug(...args: any[]) { console.debug(this.#indent + chalk.bold(chalk.gray(...args))); }
	info(...args: any[]) { console.info(this.#indent + chalk.bold(...args)); }
	warn(...args: any[]) { console.warn(this.#indent + chalk.bold(chalk.yellowBright(...args))); }
	error(...args: any[]) { console.error(this.#indent + chalk.bold(chalk.redBright(...args))); }

	wrapIndent<T extends any[], U>(fn: (...args: T) => U, config?: WrapConfig) {
		const { wrap, end, prof } = { ...defaultConfig, ...config };
		return (...args: T): U => {
			let result;
			if (wrap) this.#indent += '  ';
			if (prof) {
				const start = process.hrtime.bigint();
				result = fn(...args);
				this.debug(`\nTime: ${(Number(process.hrtime.bigint() - start) / 1e9).toFixed(6)}s.`);
			} else
				result = fn(...args);
			if (wrap) this.#indent = this.#indent.slice(0, -2);
			if (end) console.log();
			return result;
		};
	}
	wrapIndentAsync<T extends any[], U>(fn: (...args: T) => U | Promise<U>, config?: WrapConfig) {
		const { wrap, end, prof } = { ...defaultConfig, ...config };
		return async (...args: T): Promise<U> => {
			let result;
			if (wrap) this.#indent += '  ';
			if (prof) {
				const start = process.hrtime.bigint();
				result = await fn(...args);
				this.debug(`\nTime: ${(Number(process.hrtime.bigint() - start) / 1e9).toFixed(6)}s.`);
			} else
				result = await fn(...args);
			if (wrap) this.#indent = this.#indent.slice(0, -2);
			if (end) console.log();
			return result;
		};
	}
}

const logger = new Logger();
global.logger = logger;

export const wrapIndent = logger.wrapIndent.bind(logger);
export const wrapIndentAsync = logger.wrapIndentAsync.bind(logger);
