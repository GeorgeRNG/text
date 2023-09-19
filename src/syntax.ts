abstract class Token {
    constructor(public readonly id: string) {}

    abstract parse(string: string): ParsedToken | null;
}

/**
 * Parsable like element.
 */
type parsy = ((string: string) => (number | null)) | RegExp | string;

/**
 * A single token, a piece of text.
 */
export class TokenMono extends Token {
    private readonly parser: (string: string) => number | null;

    constructor(id: string, parsy: parsy) {
        super(id);
        if(typeof parsy == 'string') this.parser = (string) => string.startsWith(parsy) ? parsy.length : null
        else if(parsy instanceof RegExp) this.parser = (string) => {
            let match = string.match(parsy)
            if(match == null) return null;
            if(match.index != 0) return null;
            return match[0].length;
        }
        else this.parser = parsy;
    }

    parse(string: string): ParsedTokenMono | null {
        const parsed = this.parser(string);
        if(parsed == null) return null;
        return new ParsedTokenMono(this,string.substring(0,parsed));
    }
}

/**
 * Any order, amount and shape of given tokens.
 */
export class TokenGroup extends Token {
    constructor(id: string, public readonly subtypes: Token[]) {
        super(id);
    }

    parse(string: string): ParsedTokenGroup | null {
        const values : ParsedToken[] = [];
        let currentPosition = 0;
        while (currentPosition < string.length) {
            const found = this.subtypes.find(subtype => {
                const parsed = subtype.parse(string.substring(currentPosition,string.length));
                if(parsed == null) return false;
                values.push(parsed);
                currentPosition+=parsed.length;
                return true;
            });
            if(found == null) break;
        }
        return new ParsedTokenGroup(this,values)
    }
}

/**
 * Any one of the given tokens.
 */
export class TokenOption extends Token {
    constructor(id: string, public readonly subtypes: Token[]) {
        super(id);
    }

    parse(string: string): ParsedToken | null {
        let value : ParsedToken | null = null;
        // for loop ignorance
        this.subtypes.find(subtype => {
            const parsed = subtype.parse(string);
            if(parsed == null) return false;
            value = parsed;
            return true;
        });
        if(value == null) return null;
        return new ParsedTokenOption(this,value)
    }
    
}



/**
 * A locked shape of given tokens.
 */
export class TokenShape extends Token {
    constructor(id: string, public readonly subtypes: Token[]) {
        super(id);
    }

    parse(string: string): ParsedTokenShape | null {
        const out : ParsedToken[] = [];
        let currentPosition = 0;
        for (let index = 0; index < this.subtypes.length; index++) {
            const subtype = this.subtypes[index];
            const parsed = subtype.parse(string.substring(currentPosition,string.length));
            if(parsed == null) return null;
            out.push(parsed);
            currentPosition+=parsed.length;
        }
        return new ParsedTokenShape(this,out);
    }
}

abstract class ParsedToken {
    public readonly id : string;
    public abstract readonly value: any;
    
    constructor(public readonly type: Token, public readonly length : number) {
        this.id = type.id;
    }

    abstract toJSON(): any;
    toString(): string {
        return JSON.stringify(this,null,4);
    }
}

class ParsedTokenMono extends ParsedToken {
    constructor(type: TokenMono, public readonly value: string, ) {
        super(type, value.length);
    }

    toJSON() {
        return {id: this.id, value: this.value, length: this.length}
    }
}
class ParsedTokenGroup extends ParsedToken {
    constructor(type: TokenGroup, public readonly value : ParsedToken[]) {
        super(type,value.reduce((accumulator, currentValue) => accumulator + currentValue.length, 0));
    }

    toJSON() {
        return {id: this.id, values: this.value.map(value => value.toJSON()), length: this.length}
    }
}
class ParsedTokenOption extends ParsedToken {
    constructor(type: TokenOption, public readonly value: ParsedToken) {
        super(type,value.length);
    }

    toJSON() {
        return {id: this.id, value: this.value, length: this.length}
    }
}
class ParsedTokenShape extends ParsedToken {
    constructor(type: TokenShape, public readonly value : ParsedToken[]) {
        super(type,value.reduce((accumulator, currentValue) => accumulator + currentValue.length, 0));
    }

    toJSON() {
        return {id: this.id, values: this.value.map(value => value.toJSON()), length: this.length}
    }
}