import { TokenWord, TokenPool, TokenOption, TokenShape } from "./src/syntax";

const WhiteSpace = new TokenWord('space',/\s+/);
const LineEnd = new TokenWord('end',/[\n;]+|$/);

const GraveAccent = new TokenWord('grave','`');
const VariableName = new TokenWord('variable-name',/[^\n`\\]+/i);

const Game = new TokenWord('scope-game',/G(AME)?/i);
const Save = new TokenWord('scope-save',/S(AVE)?/i);
const GlobalScope = new TokenOption('global-scope',[Game,Save]);

const BigVariable = new TokenShape('big-variable',[GraveAccent,VariableName,GraveAccent]);
const SmallVariable = new TokenWord('small-variable',/[A-Z_][A-Z0-9_]+/i);
const Variable = new TokenOption('variable',[BigVariable,SmallVariable]);
const GlobalVariable = new TokenShape('global',[GlobalScope,WhiteSpace,Variable]);

const Number = new TokenWord('number',/\d+(.\d+)?/)

const StorageScope = new TokenPool('game',[GlobalVariable,LineEnd,WhiteSpace]);

const out = StorageScope.parse(await Bun.file('./test.txt').text())

console.log(out?.toString());