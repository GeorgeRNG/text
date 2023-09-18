import { Token, TokenGroup } from "./src/syntax";

const a = new Token('a',/a+/i)
const b = new Token('b',/b+/i)

const c = new TokenGroup('c',/c+/i,[a,b]);

console.log(c.parse('cccaaababbba'))