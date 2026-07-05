export class Branch {
    constructor({id = null, code = '', internalId = null, name = '', description = ''}) {
        this.id = id
        this.code = code
        this.internalId = internalId
        this.name = name
        this.description = description
    }
}
