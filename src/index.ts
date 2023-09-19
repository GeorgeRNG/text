import { TokenWord, TokenOption, TokenShape, TokenPool } from './syntax'

const WhiteSpace = new TokenWord('space',/\s+/);
const LineEnd = new TokenWord('end',/[\n;]+|$/);
const WhiteSpaceOptional = new TokenWord('space-optional',/\s*/);

const GraveAccent = new TokenWord('grave','`');
const VariableName = new TokenWord('variable-name',/[^\n`\\]+/i);

const Game = new TokenWord('scope-game',/G(AME)?/i);
const Save = new TokenWord('scope-save',/S(AVE)?/i);
const GlobalScope = new TokenOption('global-scope',[Game,Save]);

const LeftAngleBracket = new TokenWord('bracket-angle-left','<');
const RightAngleBracket = new TokenWord('bracket-angle-right','>');
const Comma = new TokenWord('comma',',');
const CommaOptional = new TokenWord('comma-optional',/,?/);
const FordSlash = new TokenWord('slash-forward',/\//);
const BackSlash = new TokenWord('slash-back',/\\/);
const Separator = new TokenOption('separator',[Comma,WhiteSpace]);

const Number = new TokenWord('number',/-?\d+(.\d+)?/);
const String = new TokenWord('string',/"[^"]+"/i);
const Vector = new TokenShape('vector',[LeftAngleBracket,Number,Separator,Number,Separator,Number,RightAngleBracket]);
const TextOpen = new TokenShape('text-open',[LeftAngleBracket,RightAngleBracket]);
const TextClose = new TokenShape('text-close',[LeftAngleBracket,FordSlash,RightAngleBracket]);
const Text = new TokenShape('text',[TextOpen,VariableName,TextClose]);
const Literal = new TokenOption('value',[Number,String,Vector,Text]);

const Assignment = new TokenWord('assignment','=');
const VariableAssignment = new TokenShape('variable-assignment',[WhiteSpaceOptional,Assignment,WhiteSpaceOptional]);
const VariableAssignmentLiteral = new TokenShape('variable-assignment-literal',[VariableAssignment,Literal]);

const BigVariable = new TokenShape('big-variable',[GraveAccent,VariableName,GraveAccent]);
const SmallVariable = new TokenWord('small-variable',/[A-Z_][A-Z0-9_]+/i);
const Variable = new TokenOption('variable',[BigVariable,SmallVariable]);
const GlobalVariable = new TokenShape('global',[GlobalScope,WhiteSpace,Variable,VariableAssignmentLiteral]);

export const StorageScope = new TokenPool('game',[WhiteSpace,LineEnd,GlobalVariable]);