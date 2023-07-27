import fs from 'fs-extra';
import path from 'path';
import klaw from 'klaw';
import { Ma2File } from '../ma2';
import { TouchNoteSize } from '@/ma2/Ma2Record';

export default async function entry() {
	const srcPath = process.argv[3];

	for await (const file of klaw(srcPath)) {
		if (file.stats.isDirectory() || !file.path.endsWith('.ma2')) continue;
		// for (const file of [{ path: '/home/tiger0132/Shared/music/music011075/011075_03.ma2' }]) {

		let content = (await fs.readFile(file.path, 'utf8')).replaceAll('\r', '').replaceAll(' ', '');

		logger.debug(`load: ${file.path}`);
		const ma2 = Ma2File.fromMa2(content)!;

		let dump = ma2.dumpMa2();
		if (ma2.header.version[1] === '1.04.00' && !content.includes('T_REC_BXX')) {
			content = content.slice(0, content.indexOf('T_REC_TAP'));
			dump = dump.slice(0, dump.indexOf('T_REC_TAP'));
		}

		if (dump !== content) {
			logger.warn(`weird: ${file.path}`);
			// await fs.writeFile(`wrong/${path.basename(file.path)}`, dump);
			// return;
		}
		const simai = ma2.dumpSimai();
		try {
			const ma2_2 = Ma2File.fromSimai(simai, {
				version: ma2.header.version[1] as any,
				touchSize: file.path.endsWith('00.ma2') || file.path.endsWith('01.ma2') ? TouchNoteSize.L1 : TouchNoteSize.M1,
			});

			const origNotesDump = ma2.notes.dumpMa2(false).replaceAll('L1', 'M1');
			const newNotesDump = ma2_2.notes.dumpMa2(false).replaceAll('L1', 'M1');
			if (origNotesDump.split('\n').sort().join('\n') !== newNotesDump.split('\n').sort().join('\n')) {
				logger.error(`noo: ${file.path}`);
				await fs.writeFile(`wrong/${path.basename(file.path)}_simai`, simai);
				await fs.writeFile(`wrong/${path.basename(file.path)}_orig`, origNotesDump);
				await fs.writeFile(`wrong/${path.basename(file.path)}_new`, newNotesDump);
				return;
			}
		} catch (e) {
			console.trace(e);
			await fs.writeFile(`wrong/${path.basename(file.path)}_simai`, simai);
			return;
		}
		// await fs.writeFile(`wrong/${path.basename(file.path)}_simai`, simai);
	}
}
