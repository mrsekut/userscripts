import { describe, it, expect } from "bun:test";
import {
	removeTypeDefinitionBlocks,
	processFunctionDeclarations,
	processVariableDeclarations,
	removeAsAssertions,
} from "./transpiler";

describe("removeTypeDefinitionBlocks", () => {
	it("should remove single-line type definitions", () => {
		const input = `
type Foo = { a: number; }
const x = 5;
interface Bar { b: string; }
enum Baz { A, B }
console.log("hello");
`;
		const expected = `
const x = 5;
console.log("hello");
`.trim();
		const output = removeTypeDefinitionBlocks(input).trim();
		expect(output).toBe(expected);
	});

	it("should remove multi-line type definitions", () => {
		const input = `
type Foo = {
  a: number;
  b: string;
}
const y = 10;
`;
		const expected = `
const y = 10;
`.trim();
		const output = removeTypeDefinitionBlocks(input).trim();
		expect(output).toBe(expected);
	});
});

describe("processFunctionDeclarations", () => {
	it("should remove parameter and return type annotations", () => {
		const input = `function add(a: number, b: number): number { return a + b; }`;
		const expected = `function add(a, b) { return a + b; }`;
		const output = processFunctionDeclarations(input).trim();
		expect(output).toBe(expected);
	});

	it("should handle default parameter values", () => {
		const input = `function greet(name: string = "world"): void { console.log("Hello " + name); }`;
		const expected = `function greet(name = "world") { console.log("Hello " + name); }`;
		const output = processFunctionDeclarations(input).trim();
		expect(output).toBe(expected);
	});
});

describe("processVariableDeclarations", () => {
	it("should remove variable type annotations", () => {
		const input = `const x: number = 42;`;
		const expected = `const x = 42;`;
		const output = processVariableDeclarations(input).trim();
		expect(output).toBe(expected);
	});
});

describe("removeAsAssertions", () => {
	it("should remove as type assertions", () => {
		const input = `const x = value as number;`;
		const expected = `const x = value;`;
		const output = removeAsAssertions(input).trim();
		expect(output).toBe(expected);
	});
});
