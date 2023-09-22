abstract class Token {
    constructor(public readonly id: string, public readonly nice: (value: ParsedToken) => any = (_) => {throw Error("No nice.")}) {}

    abstract parse(string: string, start?: number): TokenOutput | null;
}

/**
 * A single token, a piece of text.
 */
export class TokenWord extends Token {
    private readonly parser: (string: string) => number | null;

    constructor(id: string, parserLike: ((string: string) => (number | null)) | RegExp | string, nice?: (value: ParsedTokenWord) => any) {
        super(id,nice);
        if(typeof parserLike == 'string') this.parser = (string) => string.startsWith(parserLike) ? parserLike.length : null
        else if(parserLike instanceof RegExp) this.parser = (string) => {
            let match = string.match(parserLike)
            if(match == null) return null;
            if(match.index != 0) return null;
            return match[0].length;
        }
        else this.parser = parserLike;
    }

    parse(string: string, start = 0): ParsedTokenWord | null {
        const parsed = this.parser(string);
        if(parsed == null) return null;
        return new ParsedTokenWord(this,string.substring(0,parsed),start);
    }
}

/**
 * Any order, amount and shape of given tokens.
 * Can return an empty array.
 */
export class TokenPool extends Token {
    constructor(id: string, public readonly subtypes: Token[], nice?: (value: ParsedTokenPool) => any) {
        super(id,nice);
    }

    parse(string: string, start = 0): ParsedTokenPool | null {
        const values : ParsedToken[] = [];
        let currentPosition = 0;
        while (currentPosition < string.length) {
            // TODO: this could use a for loop.
            const found = this.subtypes.find(subtype => {
                const parsed = subtype.parse(string.substring(currentPosition,string.length),start+currentPosition);
                if(parsed instanceof ParsedToken) {
                    values.push(parsed);
                    currentPosition+=parsed.length;
                    return true;
                }
                return false;
            });
            if(found == null) break;
        }
        return new ParsedTokenPool(this,values,start)
    }
}

/**
 * A token which works for any of the subtypes.
 * Priorities the first matching one, or null.
 */
export class TokenOption extends Token {
    constructor(id: string, public readonly subtypes: Token[],nice?: (value: ParsedTokenOption) => any) {
        super(id,nice);
    }

    parse(string: string, start = 0): ParsedToken | null {
        let value : ParsedToken | null = null;
        // TODO: use a for loop
        for (let i = 0; i < this.subtypes.length; i++) {
            const subtype = this.subtypes[i];
            const parsed = subtype.parse(string,start);
            if(parsed == null) continue;
            if(parsed instanceof ParsedToken) value = parsed;
        }
        if(value == null) return null;
        return new ParsedTokenOption(this,value,start)
    }
    
}



/**
 * A sequence of tokens which only resolve if all the subtypes match.
 */
export class TokenShape extends Token {
    constructor(id: string, public readonly subtypes: Token[], nice?: (value: ParsedTokenShape) => any) {
        super(id,nice);
    }

    parse(string: string, start = 0): ParsedTokenShape | null {
        const out : ParsedToken[] = [];
        let currentPosition = 0;
        for (let index = 0; index < this.subtypes.length; index++) {
            const subtype = this.subtypes[index];
            const parsed = subtype.parse(string.substring(currentPosition,string.length),start+currentPosition);
            if(parsed instanceof ParsedToken) {
                out.push(parsed);
                currentPosition+=parsed.length;
                continue;
            }
            return null;
        }
        return new ParsedTokenShape(this,out,start);
    }
}

abstract class TokenOutput {
    /**
     * The id assigned to the token this was matched from.
     */
    public readonly id : string;

    constructor(
        /**
         * A copy of the Token this was matched from.
         */
        public readonly type: Token,
        public readonly start: number,
    ) {
        this.id = type.id;
    }
}

abstract class ParsedToken extends TokenOutput {
    public abstract readonly value: any;
    public readonly end : number;
    
    
    constructor(
        type: Token,
        public readonly length : number,
        start: number,
    ) {
        super(type,start)
        this.end = start + length;
    }

    nice() {
        return this.type.nice(this);
    }

    toJSON() : any {
        return {id: this.id, start: this.start, length: this.length, end: this.end}
    };
    toString(): string {
        return JSON.stringify(this,null,4);
    }
}

class ParsedTokenWord extends ParsedToken {
    constructor(type: TokenWord, public readonly value: string, start: number) {
        super(type, value.length, start);
    }

    toJSON() {
        return {...super.toJSON(), value: this.value}
    }
}
class ParsedTokenPool extends ParsedToken {
    constructor(type: TokenPool, public readonly value : ParsedToken[], start: number) {
        super(type,value.reduce((accumulator, currentValue) => accumulator + currentValue.length, 0),start);
    }

    toJSON() {
        return {...super.toJSON(), values: this.value.map(value => value.toJSON())}
    }
}
class ParsedTokenOption extends ParsedToken {
    constructor(type: TokenOption, public readonly value: ParsedToken, start: number) {
        super(type,value.length,start);
    }

    toJSON() {
        return {...super.toJSON(), value: this.value}
    }
}
class ParsedTokenShape extends ParsedToken {
    constructor(type: TokenShape, public readonly value : ParsedToken[], start: number) {
        super(type,value.reduce((accumulator, currentValue) => accumulator + currentValue.length, 0), start);
    }

    toJSON() {
        return {...super.toJSON(), values: this.value.map(value => value.toJSON())}
    }
}