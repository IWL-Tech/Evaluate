import {Ident, Classify, negatives} from './util.js'

export function Lexer(script) {
	/*console.log(script)
	console.log("END SCRIPT")*/
  let program = script.split('\n')
	let idents = []
	let str = false
	let cstr = ""
	idents.push({'char': '<EOF>', 'ident': Ident.EOF, 'classify': Classify.SYSTEM})
	program.forEach((line) => {
		idents.push({char: null, ident: Ident.NEWLINE, classify: Classify.SYSTEM})
    	let chars = line.split(negatives)
			let comment = false
			chars.forEach((char) => {
			if (str && char != '"') {
				if (char === undefined) return
				cstr += char
				return
			}
			if (comment) return
			if (parseFloat(char) || Math.abs(parseFloat(char)) || char === 0 && char != "") {
				const payload = {'char': char, 'ident': Ident.NUMBER, 'classify': Classify.CHAR}
				return idents.push(payload)
			}
			if (!char) return;
			switch(char) {
				case '"':
					str = !str
					if (!str) {
						idents.push({char: cstr, ident: Ident.STRING, classify: Classify.CHAR})
						cstr = ""
					}
					break;
				case '#':
					comment = true
					break;
				// NOTE: Put all tokens below here. Comments + Strings have priority.

				// Declarations
				// Text-based
				case 'Char':
				case 'String':
					idents.push({char: char, ident: Ident.MSTRING, classify: Classify.MEMORY})
					break;
				// Number-based
				case 'Int_8':
				case 'Int_16':
				case 'Int_32':
				case 'Int_64':
					idents.push({char: char, ident: Ident.MINT, classify: Classify.MEMORY})
					break;
				// Binary-based
				case 'Bool':
					idents.push({char: char, ident: Ident.MBOOL, classify: Classify.MEMORY})
					break;

				// Everything else
				case "import":
					idents.push({char: char, ident: Ident.IMPORT, classify: Classify.MODULES})
					break;
				case 'bz':
					idents.push({char: char, ident: Ident.BREAKZERO, classify: Classify.BRANCHING})
					break;
				case 'bnz':
					idents.push({char: char, ident: Ident.BREAKNOTZERO, classify: Classify.BRANCHING})
					break;
				case 'be':
					idents.push({char: char, ident: Ident.BREAKEQUAL, classify: Classify.BRANCHING})
					break;
				case 'bne':
					idents.push({char: char, ident: Ident.BREAKNOTEQUAL, classify: Classify.BRANCHING})
					break;
				case 'continue':
					idents.push({char: char, ident: Ident.CONTINUE, classify: Classify.BRANCHING})
					break;
				case '++':
					idents.push({char: char, ident: Ident.INC, classify: Classify.OPERATION})
					break;
				case '--':
					idents.push({char: char, ident: Ident.DEC, classify: Classify.OPERATION})
					break;
				case 'break':
					idents.push({char: char, ident: Ident.BREAK, classify: Classify.LOOP})
					break;
				case 'loop':
					idents.push({char: char, ident: Ident.LOOP, classfy: Classify.LOOP})
					break;
				case 'AND':
					idents.push({char: char, ident: Ident.AND, classify: Classify.BOOLEAN})
					break;
				case 'OR':
					idents.push({char: char, ident: Ident.OR, classify: Classify.BOOLEAN})
					break;
				case 'NOT':
					idents.push({char: char, ident: Ident.NOT, classify: Classify.BOOLEAN})
					break;
				case '=':
					idents.push({char: char, ident: Ident.ASSIGNMENT, classify: Classify.MEMORY})
					break;
				case '=>':
					idents.push({char: char, ident: Ident.INITFUNC, classify: Classify.FUNCTION})
					break;
				case '~':
					idents.push({char: char, ident: Ident.ROUND, classify: Classify.OPERATION})
					break;
				case '<<':
					idents.push({char: char, ident: Ident.LEFTSHIFT, classify: Classify.OPERATION})
					break;
				case '>>':
					idents.push({char: char, ident: Ident.RIGHTSHIFT, classify: Classify.OPERATION})
					break;
				case '**':
					idents.push({char: char, ident: Ident.POWER, classify: Classify.OPERATION})
					break;
				case '¬':
					idents.push({char: char, ident: Ident.SQRT, classify: Classify.OPERATION})
					break;
				case "%":
					idents.push({char: char, ident: Ident.MODULO, classify: Classify.OPERATION})
					break;
				case "true":
					idents.push({char: char, ident: Ident.TRUE, classify: Classify.BOOLEAN})
					break;
				case "false":
					idents.push({char: char, ident: Ident.FALSE, classify: Classify.BOOLEAN})
					break;
				case "pass":
					idents.push({char: char, ident: Ident.PASS, classify: Classify.FUNCTION})
					break;
				case "function":
					idents.push({char: char, ident: Ident.INITFUNC, classify: Classify.FUNCTION})
					break;
				case ' ':
					return;
				case '(':
					return idents.push({'char': '(', 'ident': Ident.LBRACKET, 'classify': Classify.BRACKET})
				case ')':
					return idents.push({'char': ')', 'ident': Ident.RBRACKET, 'classify': Classify.BRACKET})
				case '{':
					return idents.push({'char': '{', 'ident': Ident.LCBRACKET, 'classify': Classify.CBRACKET})
				case '}':
					return idents.push({'char': '}', 'ident': Ident.RCBRACKET, 'classify': Classify.CBRACKET})
				case '[':
					return idents.push({'char': '[', 'ident': Ident.LSBRACKET, 'classify': Classify.SBRACKET})
				case ']':
					return idents.push({'char': ']', 'ident': Ident.RSBRACKET, 'classify': Classify.SBRACKET})
				case '+':
					const payload1 = {'char': char, 'ident': Ident.PLUS, 'classify': Classify.OPERATION}
					return idents.push(payload1)
					break;
				case '-':
					const payload3 = {'char': char, 'ident': Ident.MINUS, 'classify': Classify.OPERATION}
					return idents.push(payload3)
					break;
				case '*':
					const payload4 = {'char': char, 'ident': Ident.TIMES, 'classify': Classify.OPERATION}
					return idents.push(payload4)
					break;
				case '/':
					const payload5 = {'char': char, 'ident': Ident.DIVIDE, 'classify': Classify.OPERATION}
					return idents.push(payload5)
					break;
				case '{':
					const payload6 = {'char': char, 'ident': Ident.LCBRACKET, 'classify': Classify.CBRACKET}
					return idents.push(payload6)
					break;
				case '}':
					const payload7 = {'char': char, 'ident': Ident.RCBRACKET, 'classify': Classify.CBRACKET}
					return idents.push(payload7)
					break;
				case 'mset':
					const payload9 = {'char': char, 'ident': Ident.MEMSET, 'classify': Classify.MEMORY}
					return idents.push(payload9)
					break;
				case 'mclear':
					const payload10 = {'char': char, 'ident': Ident.MEMCLR, 'classify': Classify.MEMORY}
					return idents.push(payload10)
					break;
				default:
					if (char == ' ') return;
					const readmem = {'char': char, 'ident': Ident.TERM, 'classify': Classify.CHAR}
					return idents.push(readmem)
					break;
			}
		})
  })
	idents.push({'char': '<EOF>', 'ident': Ident.EOF, 'classify': Classify.SYSTEM})
	return idents
}
