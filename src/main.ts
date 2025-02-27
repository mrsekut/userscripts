import { transpileTS } from "./transpiler";
import { BunFile } from "bun";

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
	const outPath = bf.name?.replace(".ts", ".js")!;
	await Bun.write(outPath, code);

	return outPath;
}
