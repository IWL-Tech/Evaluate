export default class StringTable {
    constructor() {
        this.table = [{str: "00 2e 73 68 73 74 72 74 61 62 00", name: "shstrtab"}]
        this.offset = 0
        this.bytes = 0
    }
    add(string, name) {
        this.bytes += string.split(' ').join('').length / 2
        this.table.push({str: string + "00", name: name, offset: this.bytes})
    }
    find(name) {
        let str = {}
        this.table.forEach(element => {
            if (element.name == name) {
                str.str = element.str
                str.offset = element.offset
            }
        })
        return str
    }
    build() {
        let table = ""
        this.table.forEach(element => {
            table += element.str
        })
        return table
    }
}