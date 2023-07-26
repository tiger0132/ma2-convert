import fs from 'fs-extra';
import { Ma2File } from '../ma2';

export default async function entry() {
	const srcPath = process.argv[3];
	const dstPath = process.argv[3];

	const content = (await fs.readFile(srcPath, 'utf8')).replaceAll('\r', '').replaceAll(' ', '');
	const ma2 = Ma2File.fromMa2(content);
	const dst = ma2!.dumpMa2({ pseudoEachTicks: 1 });

	console.log(dst);
}
