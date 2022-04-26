import * as fs from 'fs'
import {RuntimeError, StackTrace, Yard, rpn, ParseTrace} from "./util.js"
import {Parse} from "./parser.js"
import {Lexer} from "./lexer.js"
import chalk from "chalk"
import fifo from 'fifo'
import Generator from './generator.js'

// Expressors
import equation from './interpreter/equate.js'
import variable from './interpreter/var.js'
import mset from './interpreter/mset.js'
import callfunc from './interpreter/callfunc.js'
import initfunc from './interpreter/initfunc.js'
import declare from './interpreter/declare.js'

// Logic gates
import andgate from './interpreter/logic/and.js'
import orgate from './interpreter/logic/or.js'
import notgate from './interpreter/logic/not.js'

// Memory 
let VarMemory = {}
let FunctionMemory = {}

function pushdata(id, value, type) {
	if (type === "function") return FunctionMemory[id] = value
	if (type === "variable") {
		if (parseInt(value)) { VarMemory[id] = parseInt(value) }
		else {
			VarMemory[id] = value
		}
	}
}

export function Interpret(AST, unit, verbose, compiled) {
	console.log(AST)
	const RuntimeStack = new StackTrace(verbose, "Interpreter Stack")
	RuntimeStack.push("Program Start", 0)
	let tokens = AST.body
	let current = 0
	let line = 0
	let ans = []
	// console.log(AST)
	AST.body.forEach(element => {
		switch(element.type) {
			case 'startblock':
			case 'endblock':
			case 'pass':
				current += 1
				break;
			case 'functioncall':
				RuntimeStack.push(`Function ${element.value}`, line)
				let res = callfunc.execute(element.value, element.params, line, RuntimeStack, FunctionMemory, compiled)
				if (Array.isArray(res)) {
					res.forEach(e => {
						ans.push(e)
					})
				} else ans.push(res)
				current += 1
				RuntimeStack.pop()
				break;
			case 'function':
				RuntimeStack.push("Function " + element.declarations.id.name, line)
				FunctionMemory = initfunc.execute(FunctionMemory, element)
				current += 1
				return RuntimeStack.pop()
			case 'newline':
				current += 1
				line += 1
				break;
			case 'eopen':
			case 'bopen':
			case 'sopen':
				RuntimeStack.push("Brackets", line)
				current += 1
				break;
			case 'eclose':
			case 'bclose':
			case 'sclose':
				RuntimeStack.pop()
			case 'memory':
				if (element.kind === 'mset') {
					RuntimeStack.push("mset", line)
					current += 1
					VarMemory = mset.execute(element.declarations.id.name, element.declarations.init.value, VarMemory)
					RuntimeStack.pop()
					return;
				}
				if (element.kind === 'var') {
					if (!element.char) return current += 1
					RuntimeStack.push("var", line)
					ans.push(variable.execute(VarMemory, element, RuntimeStack, line))
					current += 1
					RuntimeStack.pop()
				}
				if (element.kind === 'set') {
					let code;
					switch(element.declarations.annotation) {
						case 'Char':
							RuntimeStack.push("declare char", line)
							code = declare.execute("char", element.declarations.id.name, element.declarations.init.value)
							current += 1
							RuntimeStack.pop()
							break;

						case 'Int_8':
							RuntimeStack.push("declare 8 bit integer", line)
							code = declare.execute("int8", element.declarations.id.name, element.declarations.init.value)
							current += 1
							RuntimeStack.pop()
							break;
						
						case 'Bool':
							RuntimeStack.push("declare boolean", line)
							code = declare.execute("int8", element.declarations.id.name, element.declarations.init.value)
							current += 1
							RuntimeStack.pop()
							break;

						case 'Int_16':
							RuntimeStack.push("declare 16 bit integer", line)
							code = declare.execute("int16", element.declarations.id.name, element.declarations.init.value)
							current += 1
							RuntimeStack.pop()
							break;

						case 'Int_32':
							RuntimeStack.push("declare 32 bit integer", line)
							code = declare.execute("int32", element.declarations.id.name, element.declarations.init.value)
							current += 1
							RuntimeStack.pop()
							break;

						case 'Int_64':
							RuntimeStack.push("declare 64 bit integer", line)
							code = declare.execute("int64", element.declarations.id.name, element.declarations.init.value)
							current += 1
							RuntimeStack.pop()
							break;

						case 'String':
							RuntimeStack.push("declare string", line)
							code = declare.execute("string", element.declarations.id.name, element.declarations.init.value)
							current += 1
							RuntimeStack.pop()
							break;
					}
					if (Array.isArray(code)) {
						code.forEach(e => {
							ans.push(e)
						})
					} else ans.push(code)
				}
				break;
			case "boolean":
				let code = []
				switch (element.kind) {
					case 'AND':
						code = andgate.execute(element.params)
						break;
					case 'OR':
						code = orgate.execute(element.params)
						break;
					case 'NOT':
						code = notgate.execute(element.params)
						break;
				}
				if (Array.isArray(code)) {
					code.forEach(e => {
						ans.push(e)
					})
				} else ans.push(code)
				break;
			case 'EOF':
				break;
			default:
				console.log(chalk.yellow("Warning: Expressor '" + element.value + "' is still a work in progress: Line " + line))
				current += 1
				break
		}
	})
	if (!unit && !compiled) {
		if (!ans[0] && ans[0] != 0) return
		const returns = fifo()
		ans.forEach(value => {
			returns.push(value)
		})
		returns.forEach(value => {
			console.log(value)
		})
		return;
	} else if (compiled) {
		return Generator(ans, compiled)
	}
	return ans
}