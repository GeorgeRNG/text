/**
 * Parsable like element.
 */
type parsy = ((string: string) => (number | null)) | RegExp | string;

export class Token {
    private readonly parser: (string: string) => number | null;

    constructor(public readonly id: string, parsy: parsy) {
        if(typeof parsy == 'string') this.parser = (string) => string.startsWith(parsy) ? string.length : null
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
    parse(string: string): ParsedToken | null {
        const parsed = this.parser(string);
        if(parsed == null) return null;
        return new ParsedToken(this,string.substring(0,parsed));
    }
}

export class TokenGroup extends Token {
    constructor(id: string, pattern: parsy, public readonly subtypes: Token[]) {
        super(id, pattern);
    }

    override parse(string: string): ParsedTokenGroup | null {
        const superParsed = super.parse(string);
        if(superParsed == null) return null;
        const values : ParsedToken[] = [];
        let currentPosition = superParsed.length;
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
        return new ParsedTokenGroup(this,superParsed.value,values)
    }
}

class ParsedToken {
    public readonly length : number;
    public readonly id : string;

    constructor(type: Token, public readonly value: string, ) {
        this.length = value.length
        this.id = type.id;
    }
}
class ParsedTokenGroup extends ParsedToken {
    public readonly fullLength : number;

    constructor(type: Token, value: string, public readonly values : ParsedToken[]) {
        super(type,value);
        this.fullLength = value.length + values.reduce((accumulator, currentValue) => accumulator+currentValue.length,0);
    }
}