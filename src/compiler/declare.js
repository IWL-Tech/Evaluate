import { cosDependencies } from "mathjs";

export default {
  name: "declare",
  description: "declares memory",
  execute(annotation, id, value, short, current) { 
    let c;
    switch (annotation) {
      case "char":
        c = [
          {
            type: "bss",
            id: id,
            mode: "resb",
            bytes: 1,
            os: ["mac", "win", "linux"],
          },
          {
            type: "label",
            label: id+"len",
            commands: "equ 1",
            os: ['mac','win','linux']
          },
          {
            type: "text",
            commands: `mov edx, "${value}"\nmov [${id}], edx`,
            os: ["mac", "win", "linux"],
            requires: "ascii"
          },
        ];
        break;
      case "int8":
        c = [
          {
            type: "bss",
            id: id,
            mode: "resb",
            bytes: 1,
            os: ["mac", "win", "linux"],
          },
          {
            type: "label",
            label: id+"len",
            commands: "equ " + (""+value).length,
            os: ['mac','win','linux'],
            requires: "ascii"
          },
          {
            type: "text",
            commands: `mov dh, ${value}\nmov [${id}], dh`,
            os: ["mac", "win", "linux"],
          },
        ];
        break;
      case "int16":
        c = [
          {
            type: "bss",
            id: id,
            mode: "resb",
            bytes: 2,
            os: ["mac", "win", "linux"],
          },
          {
            type: "label",
            label: id+"len",
            commands: "equ " + value.length,
            os: ['mac','win','linux'],
            requires: "ascii"
          },
          {
            type: "text",
            commands: `mov dx, ${value}\nmov [${id}], dx`,
            os: ["mac", "win", "linux"],
          },
        ];
        break;
      case "int32":
        c = [
          {
            type: "bss",
            id: id,
            mode: "resb",
            bytes: 4,
            os: ["mac", "win", "linux"],
          },
          {
            type: "label",
            label: id+"len",
            commands: "equ " + value.length,
            os: ['mac','win','linux'],
            requires: "ascii"
          },
          {
            type: "text",
            commands: `mov edx, ${value}\nmov [${id}], edx`,
            os: ["mac", "win", "linux"],
          },
        ];
        break;
      case "int64":
        c = [
          {
            type: "bss",
            id: id,
            mode: "resb",
            bytes: 8,
            os: ["mac", "win", "linux"],
          },
          {
            type: "label",
            label: id+"len",
            commands: "equ " + value.length,
            os: ['mac','win','linux'],
            requires: "ascii"
          },
          {
            type: "text",
            commands: `mov rdx, ${value}\nmov [${id}], rdx`,
            os: ["mac", "win", "linux"],
          },
        ];
        break;
      case "string":
        // Null termination be like
        c = [
          {
            type: "bss",
            id: id,
            mode: "resb",
            bytes: value.length,
            os: ["mac", "win", "linux"],
          },
          {
            type: "label",
            label: id+"label"+current,
            commands: `
                mov eax,0
                mov [${id}], eax
                db "${value}",0
            `,
            os: ["mac", "win", "linux"],
          },
          {
            type: "label",
            label: id+"len"+current,
            commands: "equ " + value.length,
            os: ['mac','win','linux'],
            requires: "ascii"
          },
          {
              type: "text",
              commands: `
                mov ebx, ${id}label${current}\n
                mov ecx, 0\n
                call ${id}loop${current}\n
              `,
              os: ['win', 'macos', 'linux']
          },
          {
              type: "label",
              label: id+"loop"+current,
              commands: `
                mov al, [ebx]\n
                or al,al\n
                jz StrEnd\n

                cmp al,0\n
                je StrEnd\n

                add [${id}+ecx], al\n

                inc ebx\n
                inc ecx\n
                jmp ${id}loop${current}\n
              `,
              os: ['win', 'linux', 'macos']
          },
        ];
        break;
    }

    if (short) c.forEach(e => { if (e.type === "bss") c.splice(c.indexOf(e), 1) })

    return c
  },
};
