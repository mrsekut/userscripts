import { transpileTS } from "./transpiler";
import { join } from "path";
import { BunFile } from "bun";
import { mkdir } from "node:fs/promises";

main();

async function main() {
	const arg = process.argv.at(-1);
	if (arg == null) {
		console.error("No file specified.");
		return;
	}
	const file = Bun.file(arg);

	const tsCode = await file.text();
	const jsCode = transpileTS(tsCode);

	const outPath = await saveFile(file, jsCode);
	console.log(`Transpilation completed: ${outPath}`);
}

async function saveFile(bf: BunFile, code: string) {
	const outDir = "out";

	try {
		await mkdir(outDir, { recursive: true });
	} catch (err) {
		console.error(`Failed to create directory: ${err}`);
		return;
	}

	const outPath = join(outDir, bf.name?.replace(".ts", ".js")!);
	await Bun.write(outPath, code);

	return outPath;
}
