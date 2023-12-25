abstract class Token {
    constructor(public readonly id: string, public readonly nice: (value: ParsedToken) => any = (_) => {throw Error("No nice.")}) {}

    abstract parse(string: string, start?: number): TokenOutput | TokenError;
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

    parse(string: string, start = 0): ParsedTokenWord | TokenError {
        const parsed = this.parser(string);
        if(parsed == null) return new TokenError(this,start);
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

    parse(string: string, start = 0): ParsedTokenPool | TokenError {
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
 * Priorities the first matching one, or throws an Error.
 */
export class TokenOption extends Token {
    constructor(id: string, public readonly subtypes: Token[],nice?: (value: ParsedTokenOption) => any) {
        super(id,nice);
    }

    parse(string: string, start = 0): ParsedToken | TokenError {
        let value : ParsedToken | null = null;
        for (let i = 0; i < this.subtypes.length; i++) {
            const subtype = this.subtypes[i];
            const parsed = subtype.parse(string,start);
            if(parsed instanceof TokenError) continue;
            if(parsed instanceof ParsedToken) value = parsed;
        }
        if(value == null) return new TokenError(this,start);
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

    parse(string: string, start = 0): ParsedTokenShape | TokenError {
        const out : (ParsedToken | TokenShapeError)[] = [];
        let currentPosition = 0;
        let currentSubtype = 0;
        while (true) {
            const last = out.length == 0 ? null : out[out.length - 1];
            const wasLastError = (last instanceof TokenError);
            if(wasLastError) {
                let parsed = null;
                for (let trySubType = currentSubtype; trySubType < this.subtypes.length; trySubType++) {
                    const attemptingSubtype = this.subtypes[trySubType];
                    parsed = attemptingSubtype.parse(string.substring(currentPosition),start+currentPosition);
                    if(parsed instanceof TokenError) continue;
                    if(parsed instanceof ParsedToken) {
                        currentSubtype = trySubType + 1;
                        currentPosition+=parsed.length;
                        out.push(parsed);
                        break;
                    }
                }
                currentPosition++;
                if(parsed == null || parsed instanceof TokenError) {
                    last.length++;
                }
            }
            else {
                const subtype = this.subtypes[currentSubtype];
                const parsed = subtype.parse(string.substring(currentPosition,string.length),start+currentPosition);
                if(parsed instanceof TokenError) {
                    out.push(new TokenShapeError(parsed,0));
                }
                if(parsed instanceof ParsedToken) {
                    out.push(parsed);
                    currentPosition+=parsed.length;
                    currentSubtype++;
                }
            }
            if(currentSubtype >= this.subtypes.length) {
                return new ParsedTokenShape(this,out,start);
            }
            if(currentPosition >= string.length) {
                return new TokenError(this,start)
            }
        }
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

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            start: this.start
        }
    }
}

class TokenError extends TokenOutput {
    toJSON(): any {
        return {...super.toJSON(), error: true}
    }
}
class TokenShapeError extends TokenError {
    public length: number;

    constructor(from: TokenError, length: number)
    constructor(type: Token, start: number, length: number)
    constructor(fromOrType: TokenError|Token, startOrLength: number, length?: number) {
        if(fromOrType instanceof TokenError) {
            super(fromOrType.type, fromOrType.start);
            this.length = startOrLength;
        }
        else if(length != null) {
            super(fromOrType, startOrLength);
            this.length = length;
        }
        else {
            throw TypeError("Invalid parameters");
        }
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
    constructor(type: TokenShape, public readonly value : (ParsedToken | TokenShapeError)[], start: number) {
        super(type,value.reduce((accumulator, currentValue) => accumulator + currentValue.length, 0), start);
    }

    toJSON() {
        return {...super.toJSON(), values: this.value.map(value => value.toJSON())}
    }
}