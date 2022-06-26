import * as fs from 'fs'
import {RuntimeError, StackTrace, Yard, rpn, ParseTrace, StandardLibrary} from "./util.js"
import {Parse} from "./parser.js"
import {Lexer} from "./lexer.js"
import chalk from "chalk"
import fifo from 'fifo'
import Generator from './generator.js'

// Instructions
import equation from './compiler/equate.js'
import variable from './compiler/var.js'
import mset from './compiler/mset.js'
import callfunc from './compiler/callfunc.js'
import initfunc from './compiler/initfunc.js'
import declare from './compiler/declare.js'
import incdec from './compiler/incdec.js'
import parseblock from './compiler/blocks/parseblock.js'
import nbreak from './compiler/blocks/control/break.js'
import breakequal from './compiler/blocks/control/breakequal.js'
import breakzero from './compiler/blocks/control/breakzero.js'
import breaknotequal from './compiler/blocks/control/breaknotequal.js'
import breaknotzero from './compiler/blocks/control/breaknotzero.js'
import ncontinue from './compiler/blocks/control/continue.js'
import andgate from './compiler/logic/and.js'
import orgate from './compiler/logic/or.js'
import notgate from './compiler/logic/not.js'

let VarMemory = []
let FunctionMemory = {}
let modules = ['ascii', 'standard']
let Symbols = {}

export function Compile(AST, unit, verbose, compiled, output) {
	if (verbose) console.log(AST)
	const RuntimeStack = new StackTrace(verbose, "Compiler Stack")
	RuntimeStack.push("Program Start", 0)
	let tokens = AST.body // Items
	let current = 0 // Item pointer
	let line = 0 // Line pointer
	let leni = 0 // Len init
	let lenn = 0 // Len now
	let block = false
	let blockbody = []
	let ans = []
	let res = []
	let standard = false
	
	AST.body.forEach(element => {
		switch(element.type) {
			case 'functiondec':
				RuntimeStack.push("Function Declaration", line)
				let name = element.declarations.id.name
				let bl = parseblock.execute(blockbody, {func: name, type:"function"}, output)
				if (output === "elf32") {
					Symbols[name] = bl
				} else bl.forEach(e => ans.push(e))
				RuntimeStack.pop()
				current++
				break;

			case 'import':
				RuntimeStack.push("Import", line)
				if (!modules.includes(element.value)) throw new RuntimeError("Import", "Module not found", line, ParseTrace(RuntimeStack))
				if (element.value === "standard") standard = true
				else ans.push({os: ['win', 'linux', 'mac'], requires: element.value})
				current++
				RuntimeStack.pop()
				break;

			case 'branching':
				switch(element.kind) {
					case 'break':
							nbreak.execute().forEach(e => ans.push(e))
							break;
					case 'breakequal':
							breakequal.execute(element.params).forEach(e => ans.push(e))
							break;
					case 'breaknotequal':
							breaknotequal.execute(element.params).forEach(e => ans.push(e))
							break;
					case 'breakzero':
							breakzero.execute(element.params).forEach(e => ans.push(e))
							break;
					case 'breaknotzero':
							breaknotzero.execute(element.params).forEach(e => ans.push(e))
							break;
					case 'continue':
							ncontinue.execute().forEach(e => ans.push(e))
							break;
			}	
				current++
				break;

			case 'increment':
				incdec.execute(element.declarations.id.name, true).forEach(e => ans.push(e))
				break;
			case 'decrement':
				incdec.execute(element.declarations.id.name, false).forEach(e => ans.push(e))
				break;
			case 'startblock':
				RuntimeStack.push("Block Start", line)
				leni = ans.length
				blockbody = []
				block = true
				current++
				break;
			case 'endblock':
				block = false
				lenn = ans.length
				for (let i = lenn; i > leni; i--) {
					blockbody.unshift(ans.pop())
				}
				current++
				RuntimeStack.pop()
				break;
			case 'loop':
				if (!parseInt(element.times)) throw new RuntimeError("ExpectedInteger", "An integer was expected but was not supplied.", line, ParseTrace(RuntimeStack))
				res = parseblock.execute(blockbody, {current:current, amount:element.times, type:"loop"}, output)
				if (Array.isArray(res)) {
					res.forEach(e => {
						ans.push(e)
					})
				} else ans.push(res)
				current += 1
				break;
			case 'pass':
				current += 1
				break;
			case 'functioncall':
				RuntimeStack.push(`Function ${element.value}`, line)
				if (output === "elf32" && !StandardLibrary.includes(element.value)) {
					if (!Symbols[element.value]) throw new RuntimeError("FunctionNotFound", `Function ${element.value} was not found.`, line, ParseTrace(RuntimeStack))
					Symbols[element.value].forEach(e => ans.push(e))
				} else {
					res = callfunc.execute(element.value, element.params, line, RuntimeStack, FunctionMemory, compiled, current, standard, true)
					if (Array.isArray(res)) {
						res.forEach(e => {
							ans.push(e)
						})
					} else ans.push(res)
				}		
				current += 1
				RuntimeStack.pop()
				break;
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
				if (element.kind === 'reset') {
					RuntimeStack.push('assign', line)
					if (!Symbols[element.declarations.id.name]) throw new RuntimeError("VariableNotFound", `Variable ${element.declarations.id.name} was not found.`, line, ParseTrace(RuntimeStack))
					if (!Symbols[element.declarations.id.name].type.startsWith(element.annotation)) throw new RuntimeError("InsufficientValue", "The given value did not meet the annotation's requirements.", line, ParseTrace(RuntimeStack))
					let code;
					if (element.annotation === "string") code = declare.execute("string", element.declarations.id.name, element.declarations.init.value, true)
					else code = declare.execute("int64", element.declarations.id.name, element.declarations.init.value, true)
					code.forEach(e => ans.push(e))
					current++
					RuntimeStack.pop()
					return
				}
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
					RuntimeStack.push("declare " + element.declarations.annotation, line)
					let code;
					if (VarMemory.includes(element.declarations.id.name)) throw new RuntimeError("AlreadyDefined", "A variable with the same name has already been defined.", line, ParseTrace(RuntimeStack))
					VarMemory.push(element.declarations.id.name)
					switch(element.declarations.annotation) {
						case 'Char':
							code = declare.execute("char", element.declarations.id.name, element.declarations.init.value)
							Symbols[element.declarations.id.name] = {
								type: "char",
							}
							current += 1
							break;

						case 'Int_8':
							code = declare.execute("int8", element.declarations.id.name, element.declarations.init.value)
							Symbols[element.declarations.id.name] = {
								type: "int8",
							}
							current += 1
							break;
						
						case 'Bool':
							code = declare.execute("int8", element.declarations.id.name, element.declarations.init.value)
							Symbols[element.declarations.id.name] = {
								type: "bool",
							}
							current += 1
							break;

						case 'Int_16':
							code = declare.execute("int16", element.declarations.id.name, element.declarations.init.value)
							Symbols[element.declarations.id.name] = {
								type: "int16",
							}
							current += 1
							break;

						case 'Int_32':
							code = declare.execute("int32", element.declarations.id.name, element.declarations.init.value)
							Symbols[element.declarations.id.name] = {
								type: "int32",
							}
							current += 1
							break;

						case 'Int_64':
							code = declare.execute("int64", element.declarations.id.name, element.declarations.init.value)
							Symbols[element.declarations.id.name] = {
								type: "int64",
							}
							current += 1
							break;

						case 'String':
							code = declare.execute("string", element.declarations.id.name, element.declarations.init.value)
							Symbols[element.declarations.id.name] = {
								type: "string",
							}
							current += 1
							break;
					}
					if (Array.isArray(code)) {
						code.forEach(e => {
							ans.push(e)
						})
					} else ans.push(code)
					RuntimeStack.pop()
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
		return Generator(ans, compiled, output)
	}
	return ans
}