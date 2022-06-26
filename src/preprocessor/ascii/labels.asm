ConversionCheck:
	cmp al,0
	jng StrEnd

	cmp al,57
	jg StrError

	ret

ConvertToNum: 
	mov al,[rbx]

	cmp al,0
	je StrEnd

	or al,al
	jz StrEnd

	sub al,48
	call ConversionCheck
	mov [NumRes+ecx],al

	inc ecx
	inc rbx
	jmp ConvertToNum

ConvertFromNum: 
	mov al,[rbx]

	cmp al,0
	je StrEnd

	or al,al
	jz StrEnd

	add al,48
	call ConversionCheck
	mov [AsciiRes+ecx],al

	inc ecx
	inc rbx
	jmp ConvertFromNum

StrErrorStr: db "Fatal error (evaluate): An error occured while performing ASCII operations.",10,0
StrErrorLen: equ $-StrErrorStr
StrError: 
		mov eax,4
		mov ebx,1
		mov ecx,StrErrorStr
		mov edx,StrErrorLen
		int 0x80

		jmp end

_strlen:

  xor   rcx, rcx
  jmp _strlen_next

_strlen_next:

  cmp   [rdi], byte 0  ; null byte yet?
  jz    _strlen_null   ; yes, get out

  inc   rcx            ; char is ok, count it
  inc   rdi            ; move to next char
  jmp   _strlen_next   ; process again

_strlen_null:

  mov   rax, rcx       ; rcx = the length (put in rax)

  ret                  ; get out