import {CompilationError, ParseTrace, StackTrace, StandardLibrary} from './util.js'

export function Parse(tokens, func, verbose=false) {
	const ParseStack = new StackTrace(verbose, "Parser Stack")
	ParseStack.push("Program Start", 0)
	let body = []
	let presentblock = []
	let current = 0; // Tokens pointer
	let block = false
	let line = 0
	let bar = false
	let bracket = false
	let sbracket = false

	let Symbols = {}

	StandardLibrary.forEach(func => {
		Symbols[func] = {
			type: "function",
			standard: true
		}
	})

	function push(data) {
		if (block) presentblock.push(data)
		else body.push(data)
	}

	tokens.forEach((element) => {
		if (verbose) {
			console.log("Token ID: "+current)
			console.log("Using element:",element)
			console.log("Using tokens:",tokens[current])
		}
		if (tokens[current] !== element) return
		//console.log(tokens)
		let status = ParseStack.status()
		// console.log(status)
		if (element.read) return;
		//if (element.ident == 11) return current++;
			if (element.char === "{") {
				ParseStack.push("Block Start", line)
				current++
				return push({
					type: "startblock",
					value: "{"
				})
			} else if (element.char === "}") {
				current++
				ParseStack.pop()
				return push({
					type: "endblock",
					value: "}"
				})
			}
		if (element.ident == 6) {
			if (bar && block) throw new CompilationError("UnnexpectedEOF", "An EOF was given instead of an Block Close", line, ParseTrace(ParseStack))
			bar = true
			push({
				type: "EOF",
				value: element.char
			})
			current += 1
			return
		}
		// Equations are deprecated
		// if (element.ident === 7) {
		// 	ParseStack.push("Equation", line)
		// 	tokens[current].read = true
		// 	current += 1
		// }
		// if (status == "Equation") {
		// 	tokens[current].read = true
		// 	current += 1
		// 	if (element.char == '}') {
		// 		push({
		// 			type: "block",
		// 			body: presentblock
		// 		})
		// 		presentblock = []
		// 		ParseStack.pop()
		// 		return
		// 	}
		// 	if (parseFloat(element.char) || element.char == 0) {
		// 		return presentblock.push({
		// 			type: "blockelement",
		// 			value: element.char
		// 		})
		// 	}
		// 	switch(element.char) {
		// 		case '(':
		// 		case ')':
		// 		case '+':
		// 		case '-':
		// 		case '*':
		// 		case '/':
		// 		case '%':
		// 		case '¬':
		// 		case '^':
		// 		case '>>':
		// 		case '<<':
		// 			presentblock.push({
		// 				type: "blockelement",
		// 				value: element.char
		// 			})
		// 			return;
		// 	}
		// 	if (element.char == '~') {
		// 		return presentblock.push({
		// 			type: "roundblock",
		// 			value: element.char
		// 		})
		// 	}
		// } 
		if (status == "Equation") return;
		if (element.classify === 10) {
			// Loops
			if (element.ident === 36) {
				
			}
		}
		else if (element.classify === 11) {
			// Branching
			switch(element.ident) {
				case 37:
					push({
						type: "branching",
						kind: "break"
					})
					current++
					break;
				case 40:
					push({
						type: "branching",
						kind: "breakzero",
						params: [tokens[current+1].char]
					})
					tokens[current+1].read = true
					current += 2
					break;
				case 41:
					push({
						type: "branching",
						kind: "breakequal",
						params: [tokens[current+1].char, tokens[current+2].char]
					})
					tokens[current+1].read = true
					tokens[current+2].read = true
					current += 3
					break;
				case 42:
					push({
						type: "branching",
						kind: "breaknotzero",
						params: [tokens[current+1].char]
					})
					tokens[current+1].read = true
					current += 2
					break;
				case 43:
					push({
						type: "branching",
						kind: "breaknotequal",
						params: [tokens[current+1].char, tokens[current+2].char]
					})
					tokens[current+1].read = true
					tokens[current+2].read = true
					current += 3
					break;
				case 44:
					push({
						type: "branching",
						kind: "continue"
					})
					current++
					break;
			}
			return
		}
		else if (element.classify === 9) {
			ParseStack.push("logic gate", line)
			switch(element.ident) {
				case 32:
					// AND
					push({
						type: "boolean",
						kind: "AND",
						value: tokens[current-1].char + " AND " + tokens[current+1].char,
						params: [tokens[current-1].char, tokens[current+1].char]
					})
					tokens[current-1].read = true
					tokens[current].read = true
					tokens[current+1].read = true
					current += 3
					ParseStack.pop()
					return
				case 33:
					// OR
					push({
						type: "boolean",
						kind: "OR",
						value: tokens[current-1].char + " OR " + tokens[current+1].char,
						params: [tokens[current-1].char, tokens[current+1].char]
					})
					tokens[current-1].read = true
					tokens[current].read = true
					tokens[current+1].read = true
					current += 3
					ParseStack.pop()
					return
				case 34:
					// NOT
					push({
						type: "boolean",
						kind: "NOT",
						value: "NOT " + tokens[current+1].char,
						params: [tokens[current+1].char]
					})
					tokens[current].read = true
					tokens[current+1].read = true
					current += 2
					ParseStack.pop()
					return
			}
		}
		switch(element.ident) {
			case 45:
				// Imports
				ParseStack.push("import", line)
				current++
				tokens[current].read = true
				push({
					type: "import",
					value: tokens[current].char
				})
				current++
				ParseStack.pop()
				return;
			case 19:
				// Function
				ParseStack.push("function", line)
				current++

				let name = tokens[current].char
				tokens[current].read = true
				current++

				if (tokens[current-3].char != "}") throw new CompilationError("ExpectedBlock", "Expected a Block", line, ParseTrace(ParseStack))
				tokens[current].read = true
				current++

				Symbols[name] = {
					type: "function"
				}

				push({
					type: "functiondec",
					declarations: {
						id: {
							name: name,	
						}
					}
				})

				ParseStack.pop()
				return;
			case 36:
				// Loop
				ParseStack.push("loop", line)
				current++

				let amount = tokens[current].char
				tokens[current].read = true
				current++

				if (tokens[current-3].char != "}") throw new CompilationError("ExpectedBlock", "Expected a Block", line, ParseTrace(ParseStack))
				tokens[current].read = true
				current++

				push({
					type: "loop",
					times: amount,
					value: "loop " + amount
				})

				ParseStack.pop()
				return;
			case 21:
				tokens[current].read = true
				current += 1
				ParseStack.push("Pass", line)
				current += 1
				push({
					type: "pass",
					value: "pass"
				})
				ParseStack.pop()
				return;
			case 1:
				push({
					type: "newline",
					value: element.char
				})
				tokens[current].read = true
				current += 1
				return line += 1
			case 38:
				if (!tokens[current-1].ident == 11) throw new CompilationError("ExpectedVariable", "A variable was expected", line, ParseTrace(ParseStack))
				push({
					type: "increment",
					value: tokens[current-1].char + "++",
					declarations: {
						id: {
							name: tokens[current-1].char
						}
					}
				})
				return current += 2;
			case 39:
				if (!tokens[current-1].ident == 11) throw new CompilationError("ExpectedVariable", "A variable was expected", line, ParseTrace(ParseStack))
				push({
					type: "decrement",
					value: tokens[current-1].char + "--",
					declarations: {
						id: {
							name: tokens[current-1].char
						}
					}
				})
				return current += 2;
			case 16:
				ParseStack.push("SquareBracket", line)
				tokens[current].read = true
				current += 1
				if (sbracket) throw new CompilationError("SquareBracketOpen", "Square Brackets within square brackets are not permitted", line, ParseTrace(ParseStack))
				push({
					type: "sopen",
					value: element.char
				})
				return sbracket = true;
			case 17:
				tokens[current].read = true
				current += 1
				if (!sbracket) throw new CompilationError("SquareBracketClosed", "Square Brackets must be opened before closed", line, ParseTrace(ParseStack))
				push({
					type: "sclose",
					value: element.char
				})
				ParseStack.pop()
				return sbracket = false;
			case 2:
			case 3:
			case 4:
			case 5:
				tokens[current].read = true
				current += 1
				return push({
					type: "operation",
					value: element.char
				})
		}
		if (element.ident == 11) {
			if (element.char == '') {
				tokens[current].read = true
				current += 1
				return;
			}
			if (tokens[current+1].char == '(') {
				ParseStack.push("Function Call " + element.char, line)
				if (!Symbols[element.char] || Symbols[element.char].type !== "function") throw new CompilationError("FunctionNotFound", "Function " + element.char + " does not exist.", line, ParseTrace(ParseStack))
				current += 1
				tokens[current].read = true
				let options = []
				while (tokens[current].char != ')') {
					if (tokens[current].char == "," || tokens[current].char == "(" || tokens[current].char == ")") {
						tokens[current].read = true
						current += 1
						continue;
					}
					options.push(tokens[current].char)
					tokens[current].read = true
					tokens[current+1].read = true
					current += 1
				}
				tokens[current.read] = true
				current += 1
				push({
					type: "functioncall",
					params: options,
					value: element.char
				})
				ParseStack.pop()
				return;
			}
			tokens[current].read = true

			if (tokens[current + 1].ident == 19) {
				// the inevitable cause of lag
				let id = tokens[current].char
				tokens[current].read = true
				ParseStack.push("Function " + tokens[current].char, line)
				let paras = []
				tokens[current + 1].read = true
				current += 2
				if (tokens[current].char == "(") {
					tokens[current].read = true
					current += 1
					while (tokens[current + 1].char != ")") {
						paras.push(tokens[current + 1].char)
						tokens[current+1] = true
						current += 1
					}
				}
				let funcbody = []
				current += 1
				while (tokens[current].char != "}") {
					funcbody.push(tokens[current].char)
					tokens[current].read = true
					current += 1
				}
				current += 1
				push({
					type: "function",
					kind: "init",
					declarations: {
						id: {
							name: id
						},
						init: {
							parameters: paras,
							value: funcbody
						}
					}
				})
				ParseStack.pop()
				return;
			}
			/* // old var code
			ParseStack.push("var", line)
			push({
				type: "memory",
				kind: "var",
				value: element.char,
				declarations: {
					id: {
						name: element.char
					}
				}
			})
			ParseStack.pop()
			return current += 1
			*/

			current++
			ParseStack.pop()
			return
		}
		if (element.ident == 10) {
			ParseStack.push("mset", line)
			tokens[current + 1].read = true
			tokens[current].read = true
			tokens[current + 2].read = true
			push({
				type: "memory",
				kind: "mset",
				declarations: {
					id: {
						name: tokens[current + 1].char,
					},
					init: {
						value: tokens[current + 2].char,
					}
				},
				value: "mset " + tokens[current + 1].char + " " + tokens[current + 2].char
			})
			ParseStack.pop()
			return current += 3
		}
		if (element.ident == 31) {
			let mode = element.char
			ParseStack.push(mode + " declaration", line)
			tokens[current].read = true
			if (tokens[current + 1].ident != 11) throw new CompilationError("InvalidIdentifier", "An identifier was invalid or was not supplied.", line, ParseTrace(ParseStack))
			tokens[current + 1].read = true
			let id = tokens[current + 1].char
			let value = null;
			if (tokens[current + 2].ident == 13) {
				tokens[current + 2].read = true
				if (!parseInt(tokens[current + 3].char) && tokens[current + 3].char != 0) throw new CompilationError("InsufficientValue", "The given value did not meet the annotation's requirements.", line, ParseTrace(ParseStack))
				tokens[current + 3].read = true
				value = tokens[current + 3].char
				current += 4
			} else { current += 2 }
			
			push({
				type: "memory",
				kind: "set",
				declarations: {
					id: {
						name: id
					},
					init: {
						value: value
					},
					annotation: mode
				}
			})

			ParseStack.pop()
			return;
		}
		
		if (element.ident == 30 || element.ident == 35) {
			ParseStack.push(element.char + " declaration", line)
			tokens[current].read = true
			if (tokens[current + 1].ident != 11) throw new CompilationError("InvalidIdentifier", "An identifier was invalid or was not supplied.", line, ParseTrace(ParseStack))
			tokens[current + 1].read = true
			let id = tokens[current + 1].char
			let value = null;
			if (tokens[current + 2].ident == 13) {
				tokens[current + 2].read = true
				if (tokens[current + 3].ident != 18 && element.ident != 35) throw new CompilationError("InsufficientValue", "The given value did not meet the annotation's requirements.", line, ParseTrace(ParseStack))
				tokens[current + 3].read = true
				value = tokens[current + 3].char
				if (value === "true" && element.ident === 35) value = 1
				else if (element.ident === 35) value = 0
				current += 4
			} else { current += 2 }
			
			push({
				type: "memory",
				kind: "set",
				declarations: {
					id: {
						name: id
					},
					init: {
						value: value
					},
					annotation: element.char
				}
			})

			ParseStack.pop()
			return;
		}

		if (element.ident == 13) {
			ParseStack.push(tokens[current - 1].char + " assignment", line)

			let v = tokens[current - 1].char
			tokens[current].read = true
			current++

			push({
				type: "memory",
				kind: "reset",
				declarations: {
					id: {
						name: v
					},
					init: {
						value: tokens[current].char
					}
				}
			})

			tokens[current].read = true
			current++

			ParseStack.pop()
			return
		}

		throw new CompilationError("UnnexpectedKeyword", "Unnexpected keyword " + element.char + " was identified.", line, ParseTrace(ParseStack))
	})
	let AST = {
		type: "Program",
		tokens: tokens,
		length: tokens.length,
		body: body
	}
	if (func) AST.type = "Function"
	return AST
}
