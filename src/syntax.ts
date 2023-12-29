import chalk from 'chalk';

export abstract class Token<T extends any> {
    constructor(
        public readonly id: string, 
        /**
         * Convert the Token to a nice to work with object.
         * It is called with one function, which is itself.
         */
        public readonly nice: (value: ParsedToken<T>) => any = (v) => {throw Error(`No nice (${v.id})`)}
    ) {}

    abstract parse(string: string, start?: number): TokenOutput | TokenError;
}

/**
 * A single token, a piece of text.
 */
export class TokenWord extends Token<string> {
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
export class TokenPool extends Token<any> {
    constructor(id: string, public readonly subtypes: Token<any>[], nice?: (value: ParsedTokenPool) => any) {
        super(id,nice);
    }

    parse(string: string, start = 0): ParsedTokenPool | TokenError {
        const values : ParsedToken<any>[] = [];
        let currentPosition = 0;
        while (currentPosition < string.length) {
            const found = this.subtypes.find(subtype => {
                const parsed = subtype.parse(string.substring(currentPosition,string.length),start+currentPosition);
                // TODO: better error handling here?
                if(parsed instanceof ParsedToken && !parsed.error) {
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
export class TokenOption<T extends Token<any>[]> extends Token<any> {
    constructor(id: string, public readonly subtypes: T,nice?: (value: ParsedTokenOption<T>) => any) {
        super(id,nice);
    }

    parse(string: string, start = 0): ParsedToken<any> | TokenError {
        let value : ParsedToken<any> | null = null;
        for (let i = 0; i < this.subtypes.length; i++) {
            const subtype = this.subtypes[i];
            const parsed = subtype.parse(string,start);
            if(parsed instanceof TokenError) continue;
            if(parsed instanceof ParsedToken) {
                if(value == null) value = parsed;
                if(value != null) {
                    if(value.error || !parsed.error) value = parsed;
                }
                if(!parsed.error) break;
            }
        }
        if(value == null) return new TokenError(this,start);
        return new ParsedTokenOption(this,value,start)
    }
    
}


/**
 * A sequence of tokens which only resolve if all the subtypes match.
 */
export class TokenShape extends Token<any> {
    constructor(id: string, public readonly subtypes: Token<any>[], nice?: (value: ParsedTokenShape) => any) {
        super(id,nice);
    }

    parse(string: string, start = 0): ParsedTokenShape | TokenError {
        const out : (ParsedToken<any> | TokenShapeError)[] = [];
        let currentPosition = 0;
        let currentSubtype = 0;
        let errors = false;
        while (true) {
            const last = out.length == 0 ? null : out[out.length - 1];
            const wasLastError = (last instanceof TokenError);
            if(last?.error) errors = true;
            if(wasLastError) {
                errors = true;
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
                if(parsed == null || parsed instanceof TokenError) {
                    last.value+=string.substring(currentPosition,currentPosition+1);
                    last.length++;
                }
                currentPosition++;
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
                const r = new ParsedTokenShape(this,out,start);
                r.error = errors;
                return r;
            }
            if(currentPosition >= string.length) {
                return new TokenError(this,start)
            }
        }
    }
}

export abstract class TokenOutput {
    /**
     * The id assigned to the token this was matched from.
     */
    public readonly id : string;
    public error = false;

    constructor(
        /**
         * A copy of the Token this was matched from.
         */
        public readonly type: Token<any>,
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

    toString() {
        return `${this.id}: `
    }

    asString(type: string, content: string) {
        return `${chalk.green(this.start)} ${chalk.blueBright('(')}${chalk.yellow(type)}${chalk.blueBright(')')} ${chalk.redBright(this.id)}${chalk.white(':')} ${this.error ? chalk.bgRed.white('⚠') : ''} ${chalk.white(content)}`
    }
}

export class TokenError extends TokenOutput {
    public error = true;

    toJSON(): any {
        return {...super.toJSON(), error: true}
    }

    toString(): string {
        return `${this.start} (error) ${this.id}`
    }
}
export class TokenShapeError extends TokenError {
    public length: number;
    public value = "";

    constructor(from: TokenError, length: number)
    constructor(type: Token<any>, start: number, length: number)
    constructor(fromOrType: TokenError|Token<any>, startOrLength: number, length?: number) {
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

    nice() {
        throw Error("Can't use nice on an error output.")
    }

    toString(): string {
        return super.asString('shape error', this.value);
    }
}

export abstract class ParsedToken<T> extends TokenOutput {
    public abstract readonly value: T;
    public readonly end : number;
    
    
    constructor(
        type: Token<T>,
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
    }
}

export class ParsedTokenWord extends ParsedToken<string> {
    constructor(type: TokenWord, public readonly value: string, start: number) {
        super(type, value.length, start);
    }

    toJSON() {
        return {...super.toJSON(), value: this.value}
    }

    toString() {
        return super.asString('word',this.value);
    }
}
export class ParsedTokenPool extends ParsedToken<any> {
    constructor(type: TokenPool, public readonly value : ParsedToken<any>[], start: number) {
        super(type,value.reduce((accumulator, currentValue) => accumulator + currentValue.length, 0),start);
    }

    toJSON() {
        return {...super.toJSON(), values: this.value.map(value => value.toJSON())}
    }

    toString(): string {
        return super.asString('pool',`\n${tabulate(this.value.map(v => v.toString()).join('\n'))}`);
    }
}
export class ParsedTokenOption<T extends Token<any>[]> extends ParsedToken<any> {
    constructor(type: TokenOption<T>, public readonly value: ParsedToken<any>, start: number) {
        super(type,value.length,start);
    }

    toJSON() {
        return {...super.toJSON(), value: this.value}
    }

    toString() {
        return super.asString('option',`\n${tabulate(this.value.toString())}`);
    }
}
export class ParsedTokenShape extends ParsedToken<any> {
    constructor(type: TokenShape, public readonly value : (ParsedToken<any> | TokenShapeError)[], start: number) {
        super(type,value.reduce((accumulator, currentValue) => accumulator + currentValue.length, 0), start);
    }

    toJSON() {
        return {...super.toJSON(), values: this.value.map(value => value.toJSON())}
    }

    toString(): string {
        return super.asString('shape', `\n${tabulate(this.value.map(v => v.toString()).join('\n'))}`)
    }
}

function tabulate(string: string) {
    return '│    ' + string.split('\n').join('\n│    ')
}