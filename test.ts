import { Global } from "./src/diamondfire/ast";
import { ParsedToken } from "./src/syntax";

const out = Global.parse(await Bun.file('./test.txt').text())

console.log(out.toString());
if(out instanceof ParsedToken) {
    console.log(out.nice());
}


// import { TokenPool, TokenShape, TokenWord } from "./src/syntax";
// const A = new TokenWord('a','aaa');
// const B = new TokenWord('b','bbb');
// const C = new TokenWord('c','ccc');
// const TestAst = new TokenShape('test',[A,B,C]);

// const out = TestAst.parse("aaabbbccc");
// console.log(JSON.stringify(out));