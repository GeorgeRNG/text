import { TokenWord, TokenOption, TokenShape, TokenPool } from './syntax'

const WhiteSpace = new TokenWord('space',/\s+/);
const LineEnd = new TokenWord('end',/[\n;]+|$/);
const WhiteSpaceOptional = new TokenWord('space-optional',/\s*/);

const CommentLine = new TokenWord('comment-line', /\/\/.*/);
const CommentBlock = new TokenWord('comment-block',/((\/\*)([\s\S]+?)(\*\/))/);
const Comment = new TokenOption('comment',[CommentLine,CommentBlock])

const GraveAccent = new TokenWord('grave','`');
const VariableName = new TokenWord('variable-name',/[^\n`\\]+/i);

const Game = new TokenWord('scope-game',/G(AME)?/i);
const Save = new TokenWord('scope-save',/S(AVE)?/i);
const GlobalScope = new TokenOption('global-scope',[Game,Save]);

const LeftParenthesis = new TokenWord('bracket-regular-left','(');
const RightParenthesis = new TokenWord('bracket-regular-right',')');
const LeftCurlyBracket = new TokenWord('bracket-curly-left','{');
const RightCurlyBracket = new TokenWord('bracket-curly-right','}');
const LeftSquareBracket = new TokenWord('bracket-square-left','[');
const RightSquareBracket = new TokenWord('bracket-square-right',']');
const LeftAngleBracket = new TokenWord('bracket-angle-left','<');
const RightAngleBracket = new TokenWord('bracket-angle-right','>');

const Comma = new TokenWord('comma',',');
const FordSlash = new TokenWord('slash-forward',/\//);
const BackSlash = new TokenWord('slash-back',/\\/);
const Separator = new TokenWord('separator',/(\s*,\s*)|(\s+)/);

//#region
const Number = new TokenWord('number',/-?\d+(\.\d+)?/);
const String = new TokenWord('string',/"[^"]+"/i);
const Vector = new TokenShape('vector',[LeftAngleBracket,Number,Separator,Number,Separator,Number,RightAngleBracket]);

const LocationFull = new TokenShape('location-full',[Number,Separator,Number,Separator,Number,Separator,Number,Separator,Number]);
const LocationBlock = new TokenShape('location-block',[Number,Separator,Number,Separator,Number]);
const LocationData = new TokenOption('location-data',[LocationFull,LocationBlock]);
const Location = new TokenShape('location',[LeftSquareBracket,LocationData,RightSquareBracket])

const TextOpen = new TokenShape('text-open',[LeftAngleBracket,RightAngleBracket]);
const TextClose = new TokenShape('text-close',[LeftAngleBracket,FordSlash,RightAngleBracket]);
const Text = new TokenShape('text',[TextOpen,VariableName,TextClose]);

const Literals = [Number,String,Vector,Text,Location];
const Literal = new TokenOption('value',Literals);
//#endregion

const Assignment = new TokenWord('assignment','=');
const VariableAssignment = new TokenShape('variable-assignment',[WhiteSpaceOptional,Assignment,WhiteSpaceOptional]);
const VariableAssignmentLiteral = new TokenShape('variable-assignment-literal',[VariableAssignment,Literal]);

const BigVariable = new TokenShape('big-variable',[GraveAccent,VariableName,GraveAccent]);
const SmallVariable = new TokenWord('small-variable',/[%A-Z_][%A-Z0-9_]+/i);
const Variable = new TokenOption('variable',[BigVariable,SmallVariable]);
const GlobalVariable = new TokenShape('global',[GlobalScope,WhiteSpace,Variable]);
const GlobalVariableAssignmentLiteral = new TokenShape('global-assign',[GlobalVariable,WhiteSpaceOptional,VariableAssignmentLiteral]);

const Parameter = new TokenWord('parameter',/[A-Z_][A-Z0-9_]/i);
const Parameters = new TokenPool('parameters',[Parameter,Separator]);

const FunctionContents = new TokenPool('function-contents',[WhiteSpace,LineEnd,Comment]);
const Function = new TokenShape('function',[Variable,WhiteSpaceOptional,LeftParenthesis,Parameters,RightParenthesis,WhiteSpaceOptional,LeftCurlyBracket,FunctionContents,RightCurlyBracket]);

const Player = new TokenWord('player',/player/i);
const Entity = new TokenWord('entity',/ent(ity)/i);
const EventScopeName = new TokenOption('event-scope-name',[Player,Entity]);
const EventScopeContent = new TokenPool('event-scope-content',[WhiteSpace,LineEnd,Comment,Function,GlobalVariableAssignmentLiteral,GlobalVariable])
const EventScope = new TokenShape('event-scope',[EventScopeName,WhiteSpaceOptional,LeftCurlyBracket,EventScopeContent,RightCurlyBracket]);

export const StorageScope = new TokenPool('game',[WhiteSpace,LineEnd,Comment,GlobalVariableAssignmentLiteral,GlobalVariable,EventScope]);