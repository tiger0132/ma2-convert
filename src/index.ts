import './lib/logger';

import fs from 'fs-extra';
import path from 'path';
import klaw from 'klaw';
import { Ma2File } from './ma2';

export default async function entry() {
	const srcPath = process.argv[2];

	for await (const file of klaw(srcPath)) {
		if (file.stats.isDirectory() || !file.path.endsWith('.ma2')) continue;

		let content = (await fs.readFile(file.path, 'utf8')).replaceAll('\r', '').replaceAll(' ', '');

		const ma2 = new Ma2File();
		ma2.init(content);

		logger.debug(`load: ${file.path}`);
		let dump = ma2.dumpMa2();
		if (ma2.header.version[1] === '1.04.00' && !content.includes('T_REC_BXX')) {
			content = content.slice(0, content.indexOf('T_REC_TAP'));
			dump = dump.slice(0, dump.indexOf('T_REC_TAP'));
		}

		if (dump === content)
			void 0;
		// logger.info(`yay`);
		else {
			logger.error(`noo: ${file.path}`);
			await fs.writeFile(`wrong/${path.basename(file.path)}`, dump);
			// return;
		}
	}
}
await entry();
