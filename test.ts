import { TokenMono, TokenGroup, TokenOption } from "./src/syntax";

const WhiteSpace = new TokenMono('space',/\s+/);
const LineEnd = new TokenMono('end',/[\n;]+|$/);

const GraveAccent = new TokenMono('grave','`');
const VariableName = new TokenMono('variable-name',/[^\n`\\]+/i);

const Game = new TokenMono('scope-game',/G(AME)?/i);
const Save = new TokenMono('scope-save',/S(AVE)?/i);
const GlobalScope = new TokenOption('global-scope',[Game,Save]);

const Variable = new TokenGroup('variable',[GraveAccent,VariableName,GraveAccent]);
const GlobalVariable = new TokenGroup('global',[GlobalScope,WhiteSpace,Variable]);

const Number = new TokenMono('number',/\d+(.\d+)?/)

const StorageScope = new TokenGroup('game',[GlobalVariable,LineEnd,WhiteSpace]);

const out = StorageScope.parse(`

GAME variable


`)

console.log(out?.toString());