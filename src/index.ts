import '@/lib/logger';
import '@/lib/utils';

import { ok } from 'assert';

const name = process.argv[2];
ok(name, 'Usage: pnpm start <name>');

try {
	const module = await import(`./jobs/${name}`);
	await module.default();
} catch (e) {
	console.trace(e);
	logger.error(`No such module "${name}"`);
}
