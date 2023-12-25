import { StorageScope } from "./src";

const out = StorageScope.parse(await Bun.file('./test.txt').text())

console.log(out?.toString());

StorageScope.parse('game x = 0')

// import { TokenPool, TokenShape, TokenWord } from "./src/syntax";
// const A = new TokenWord('a','aaa');
// const B = new TokenWord('b','bbb');
// const C = new TokenWord('c','ccc');
// const TestAst = new TokenShape('test',[A,B,C]);

// const out = TestAst.parse("aaabbbccc");
// console.log(JSON.stringify(out));