import { TokenMono, TokenGroup, TokenOption, TokenShape } from "./src/syntax";

const WhiteSpace = new TokenMono('space',/\s+/);
const LineEnd = new TokenMono('end',/[\n;]+|$/);

const GraveAccent = new TokenMono('grave','`');
const VariableName = new TokenMono('variable-name',/[^\n`\\]+/i);

const Game = new TokenMono('scope-game',/G(AME)?/i);
const Save = new TokenMono('scope-save',/S(AVE)?/i);
const GlobalScope = new TokenOption('global-scope',[Game,Save]);

const BigVariable = new TokenShape('big-variable',[GraveAccent,VariableName,GraveAccent]);
const SmallVariable = new TokenMono('small-variable',/[A-Z_][A-Z0-9_]+/i);
const Variable = new TokenOption('variable',[BigVariable,SmallVariable]);
const GlobalVariable = new TokenShape('global',[GlobalScope,WhiteSpace,Variable]);

const Number = new TokenMono('number',/\d+(.\d+)?/)

const StorageScope = new TokenGroup('game',[GlobalVariable,LineEnd,WhiteSpace]);

const out = StorageScope.parse(await Bun.file('./test.txt').text())

console.log(out?.toString());