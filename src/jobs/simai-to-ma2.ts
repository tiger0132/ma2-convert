import fs from 'fs-extra';
import { Ma2File } from '../ma2';

export default async function entry() {
	const srcPath = process.argv[3];

	const content = (await fs.readFile(srcPath, 'utf8')).replaceAll('\r', '').replaceAll(' ', '');
	const ma2 = Ma2File.fromSimai(content);
	const dst = ma2!.dumpSimai({ pseudoEachTicks: 1 });

	console.log(dst);
}
