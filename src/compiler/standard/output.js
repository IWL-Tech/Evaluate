import {RuntimeError, ParseTrace, ToHex, parseMemoryAddress, Nullify} from '../../util.js'
import {simplify} from 'mathjs'

export default function outputfunc(args, line, trace, compiled, id) {
	try {
		let ret = []
		/* {label: args[0], commands: `db "${args[0]}: ${args[1]}",0`, type: "label", os: ['mac', 'linux', 'win']}, */
		let counter = 0
		let concat = false
		args[0].split(/(\\n)|({)|(})|(\\a)|(\\b)|(\\t)|(\\r)|(\\f)|(\\v)/gi).forEach(l => {
			if (!l) return
			counter++
			if (l === '\\n') {
				if (compiled == "elf32") return ret.push({
					hex: "0A", label: true, desc: "newline"
				}, {
					hex: "B804000000BB01000000B9__BA01000000CD80"
				})
				ret.push({commands: `db 10,0`, type: "label", label: "printf"+id+counter, os: ['mac', 'linux', 'win']})
				ret.push({label: "printf"+id+"len"+counter, commands: `equ $-printf${id}${counter}`, type: "label", os: ['mac', 'linux', 'win']})
				ret.push({commands: `mov eax,4\nmov ebx,1\nmov ecx,printf${id}${counter}\nmov edx,printf${id}len${counter}\nint 0x80\n`, type: "text", os: ['win', 'linux']})
				ret.push({commands: `mov eax,0x20000004\nmov ebx,0x20000001\nmov ecx,printf${id}${counter}\nmov edx,printf${id}len${counter}\nint 0x80\n`, type: "text", os: ['mac']})
			} else if (l === '{') {
				concat = true 
			} else if (l === '}') {
				concat = false
			} else if (l === '\\a') {
				if (compiled == "elf32") return ret.push({
					hex: "07", label: true, desc: "alert"
				}, {
					hex: "B804000000BB01000000B9__BA01000000CD80"
				})
				ret.push({commands: `db 7,0`, type: "label", label: "printf"+id+counter, os: ['mac', 'linux', 'win']})
				ret.push({label: "printf"+id+"len"+counter, commands: `equ $-printf${id}${counter}`, type: "label", os: ['mac', 'linux', 'win']})
				ret.push({commands: `mov eax,4\nmov ebx,1\nmov ecx,printf${id}${counter}\nmov edx,printf${id}len${counter}\nint 0x80\n`, type: "text", os: ['win', 'linux']})
				ret.push({commands: `mov eax,0x20000004\nmov ebx,0x20000001\nmov ecx,printf${id}${counter}\nmov edx,printf${id}len${counter}\nint 0x80\n`, type: "text", os: ['mac']})
			} else if (l === '\\b') {
				if (compiled == "elf32") return ret.push({
					hex: "08", label: true, desc: "backspace"
				}, {
					hex: "B804000000BB01000000B9__BA01000000CD80"
				})
				ret.push({commands: `db 8,0`, type: "label", label: "printf"+id+counter, os: ['mac', 'linux', 'win']})
				ret.push({label: "printf"+id+"len"+counter, commands: `equ $-printf${id}${counter}`, type: "label", os: ['mac', 'linux', 'win']})
				ret.push({commands: `mov eax,4\nmov ebx,1\nmov ecx,printf${id}${counter}\nmov edx,printf${id}len${counter}\nint 0x80\n`, type: "text", os: ['win', 'linux']})
				ret.push({commands: `mov eax,0x20000004\nmov ebx,0x20000001\nmov ecx,printf${id}${counter}\nmov edx,printf${id}len${counter}\nint 0x80\n`, type: "text", os: ['mac']})
			} else if (l === '\\t') {
				if (compiled == "elf32") return ret.push({
					hex: "09", label: true, desc: "newline"
				}, {
					hex: "B804000000BB01000000B9__BA01000000CD80"
				})
				ret.push({commands: `db 9,0`, type: "label", label: "printf"+id+counter, os: ['mac', 'linux', 'win']})
				ret.push({label: "printf"+id+"len"+counter, commands: `equ $-printf${id}${counter}`, type: "label", os: ['mac', 'linux', 'win']})
				ret.push({commands: `mov eax,4\nmov ebx,1\nmov ecx,printf${id}${counter}\nmov edx,printf${id}len${counter}\nint 0x80\n`, type: "text", os: ['win', 'linux']})
				ret.push({commands: `mov eax,0x20000004\nmov ebx,0x20000001\nmov ecx,printf${id}${counter}\nmov edx,printf${id}len${counter}\nint 0x80\n`, type: "text", os: ['mac']})
			} else if (l === '\\r') {
				if (compiled == "elf32") return ret.push({
					hex: "0D", label: true, desc: "carriage return"
				}, {
					hex: "B804000000BB01000000B9__BA01000000CD80"
				})
				ret.push({commands: `db 13,0`, type: "label", label: "printf"+id+counter, os: ['mac', 'linux', 'win']})
				ret.push({label: "printf"+id+"len"+counter, commands: `equ $-printf${id}${counter}`, type: "label", os: ['mac', 'linux', 'win']})
				ret.push({commands: `mov eax,4\nmov ebx,1\nmov ecx,printf${id}${counter}\nmov edx,printf${id}len${counter}\nint 0x80\n`, type: "text", os: ['win', 'linux']})
				ret.push({commands: `mov eax,0x20000004\nmov ebx,0x20000001\nmov ecx,printf${id}${counter}\nmov edx,printf${id}len${counter}\nint 0x80\n`, type: "text", os: ['mac']})
			} else if (l === '\\f') {
				if (compiled == "elf32") return ret.push({
					hex: "0C", label: true, desc: "form feed"
				}, {
					hex: "B804000000BB01000000B9__BA01000000CD80"
				})
				ret.push({commands: `db 12,0`, type: "label", label: "printf"+id+counter, os: ['mac', 'linux', 'win']})
				ret.push({label: "printf"+id+"len"+counter, commands: `equ $-printf${id}${counter}`, type: "label", os: ['mac', 'linux', 'win']})
				ret.push({commands: `mov eax,4\nmov ebx,1\nmov ecx,printf${id}${counter}\nmov edx,printf${id}len${counter}\nint 0x80\n`, type: "text", os: ['win', 'linux']})
				ret.push({commands: `mov eax,0x20000004\nmov ebx,0x20000001\nmov ecx,printf${id}${counter}\nmov edx,printf${id}len${counter}\nint 0x80\n`, type: "text", os: ['mac']})
			} else if (l === '\\v') {
				if (compiled == "elf32") {
					ret.push({
						hex: "0B", label: true, desc: "vertical tab"
					})
					ret.push({
						hex: "B804000000BB01000000B9__BA01000000CD80"
					})
					return
				}
			
				ret.push({commands: `db 11,0`, type: "label", label: "printf"+id+counter, os: ['mac', 'linux', 'win']})
				ret.push({label: "printf"+id+"len"+counter, commands: `equ $-printf${id}${counter}`, type: "label", os: ['mac', 'linux', 'win']})
				ret.push({commands: `mov eax,4\nmov ebx,1\nmov ecx,printf${id}${counter}\nmov edx,printf${id}len${counter}\nint 0x80\n`, type: "text", os: ['win', 'linux']})
				ret.push({commands: `mov eax,0x20000004\nmov ebx,0x20000001\nmov ecx,printf${id}${counter}\nmov edx,printf${id}len${counter}\nint 0x80\n`, type: "text", os: ['mac']})
			} else {
				if (concat) {
					ret.push({type: "bss", id: "printf"+id+"len"+counter, bytes: 4, mode: "resb", os: ['win', 'linux', 'mac'], requires: "ascii"})
					ret.push({type: "text", commands: `
						mov rdi, ${l}
						call _strlen
						mov [${"printf"+id+"len"+counter}], rax
					`, os: ['mac', 'win', 'linux']})
					ret.push({commands: `mov eax,4\nmov ebx,1\nmov ecx,${l}\nmov edx,${"printf"+id+"len"+counter}\nint 0x80\n`, type: "text", os: ['win', 'linux']})
					ret.push({commands: `mov eax,0x20000004\nmov ebx,0x20000001\nmov ecx,${l}\nmov edx,${"printf"+id+"len"+counter}\nint 0x80\n`, type: "text", os: ['mac']})
				} else {
					if (compiled == "elf32") {
						let len = Nullify(parseMemoryAddress((ToHex(l).length / 2),0))
						return ret.push({
							hex: ToHex(l), label: true, desc: "text"
							}, {
								hex: `B804000000BB01000000B9__BA${len}CD80`
						})
					}
					ret.push({commands: `db "${l}",0`, type: "label", label: "printf"+id+counter, os: ['mac', 'linux', 'win']})
					ret.push({label: "printf"+id+"len"+counter, commands: `equ $-printf${id}${counter}`, type: "label", os: ['mac', 'linux', 'win']})
					ret.push({commands: `mov eax,4\nmov ebx,1\nmov ecx,printf${id}${counter}\nmov edx,printf${id}len${counter}\nint 0x80\n`, type: "text", os: ['win', 'linux']})
					ret.push({commands: `mov eax,0x20000004\nmov ebx,0x20000001\nmov ecx,printf${id}${counter}\nmov edx,printf${id}len${counter}\nint 0x80\n`, type: "text", os: ['mac']})
				}
			}
		})
		return ret
	} catch(err) {
		console.log(err)
		throw new RuntimeError("StandardLibraryOutput", "An error occured during output", line, ParseTrace(trace))
	} 
} 