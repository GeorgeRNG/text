abstract class Token {
    constructor(public readonly id: string) {}

    abstract parse(string: string): ParsedToken | null;
}

/**
 * A single token, a piece of text.
 */
export class TokenWord extends Token {
    private readonly parser: (string: string) => number | null;

    constructor(id: string, parserLike: ((string: string) => (number | null)) | RegExp | string) {
        super(id);
        if(typeof parserLike == 'string') this.parser = (string) => string.startsWith(parserLike) ? parserLike.length : null
        else if(parserLike instanceof RegExp) this.parser = (string) => {
            let match = string.match(parserLike)
            if(match == null) return null;
            if(match.index != 0) return null;
            return match[0].length;
        }
        else this.parser = parserLike;
    }

    parse(string: string): ParsedTokenWord | null {
        const parsed = this.parser(string);
        if(parsed == null) return null;
        return new ParsedTokenWord(this,string.substring(0,parsed));
    }
}

/**
 * Any order, amount and shape of given tokens.
 * Can return an empty array.
 */
export class TokenPool extends Token {
    constructor(id: string, public readonly subtypes: Token[]) {
        super(id);
    }

    parse(string: string): ParsedTokenPool | null {
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
        return new ParsedTokenPool(this,values)
    }
}

/**
 * A token which works for any of the subtypes.
 * Priorities the first matching one, or null.
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
 * A sequence of tokens which only resolve if all the subtypes match.
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

/**
 * The output of a token. Extended by each type of token.
 * It has the id assigned to the token it was parsed from.
 * It has the value which was matched, which could be a string or other tokens.
 * It has the length of what it's matched.
 * It has a copy of the Token which it was matched from.
 */
abstract class ParsedToken {
    /**
     * The id assigned to the token this was matched from.
     */
    public readonly id : string;
    public abstract readonly value: any;
    
    constructor(
        /**
         * A copy of the Token this was matched from.
         */
        public readonly type: Token,
        public readonly length : number) {
        this.id = type.id;
    }

    abstract toJSON(): any;
    toString(): string {
        return JSON.stringify(this,null,4);
    }
}

class ParsedTokenWord extends ParsedToken {
    constructor(type: TokenWord, public readonly value: string, ) {
        super(type, value.length);
    }

    toJSON() {
        return {id: this.id, value: this.value, length: this.length}
    }
}
class ParsedTokenPool extends ParsedToken {
    constructor(type: TokenPool, public readonly value : ParsedToken[]) {
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