abstract class Token {
    constructor(public readonly id: string) {}
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

    /**
     * Gets the length of the parsed value.
     * This parses the start of the input.
     * @param string The text to parse.
     * @returns How long the parsed element is.
     */
    parse(string: string): ParsedTokenMono<TokenMono> | null {
        const parsed = this.parser(string);
        if(parsed == null) return null;
        return new ParsedTokenMono(this,string.substring(0,parsed));
    }
}

/**
 * 
 */
export class MultiToken {

}

/**
 * Any order, amount and shape of given tokens.
 */
export class TokenGroup extends TokenMono {
    constructor(id: string, pattern: parsy, public readonly subtypes: TokenMono[]) {
        super(id, pattern);
    }

    override parse(string: string): ParsedTokenGroup | null {
        const superParsed = super.parse(string);
        if(superParsed == null) return null;
        const values : ParsedTokenMono[] = [];
        let currentPosition = superParsed.length;
        while (currentPosition < string.length) {
            const found = this.subtypes.find(subtype => {
                const parsed = subtype.parse(string.substring(currentPosition,string.length));
                if(parsed == null) return false;
                values.push(parsed);
                currentPosition+=parsed.fullLength;
                return true;
            });
            if(found == null) break;
        }
        return new ParsedTokenGroup(this,superParsed.value,values)
    }
}

/**
 * Any one of the given tokens.
 */
export class TokenOption extends TokenMono {
    // TODO: this
}


/**
 * A locked shape of given tokens.
 */
export class TokenShape {

}

abstract class ParsedToken<T extends Token> {
    public readonly id : string;
    public abstract readonly fullLength : number;

    constructor(public readonly type: T) {
        this.id = type.id;
    }
}

class ParsedTokenMono<T extends TokenMono> extends ParsedToken<T> {
    public readonly length : number;
    public readonly fullLength : number;

    constructor(type: T, public readonly value: string, ) {
        super(type)
        this.length = value.length;
        this.fullLength = value.length;
    }

    toJSON() {
        return {id: this.id, value: this.value, length: this.length}
    }

    toString() {
        return JSON.stringify(this,null,4)
    }
}
class ParsedTokenGroup<T extends TokenGroup> extends ParsedTokenMono<T> {
    public readonly fullLength : number;

    constructor(type: TokenMono, value: string, public readonly values : ParsedTokenMono[]) {
        super(type,value);
        this.fullLength = value.length + values.reduce((accumulator, currentValue) => accumulator+currentValue.length,0);
    }

    toJSON() {
        return {...super.toJSON(), values: this.values.map(value => value.toJSON())}
    }
}