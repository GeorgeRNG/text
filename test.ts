import { Token, TokenGroup } from "./src/syntax";

const a = new Token('a',/a+/i)
const b = new Token('b',/b+/i)

const types = [a,b]
const c = new TokenGroup('c',/c+/i,types);
types.push(c)

const out = c.parse('cccaaababbbacaba')

console.log(out);