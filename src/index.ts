import { TokenWord, TokenOption, TokenShape, TokenPool } from './syntax'

import { Number as DFNumber, Text as DFString, Vector as DFVector, Component as DFText, ArgumentItem, Location as DFLocation } from 'df.ts'

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

const BigVariable = new TokenShape('big-variable',[GraveAccent,VariableName,GraveAccent]);
const SmallVariable = new TokenWord('small-variable',/[%A-Z_][%A-Z0-9_]+/i);
const Variable = new TokenOption('variable',[BigVariable,SmallVariable]);

//#region
const Number = new TokenWord('number',/-?\d+(\.\d+)?/,(word) => parseFloat(word.value));
const String = new TokenWord('string',/"[^"]*"/i, (word) => word.value.substring(1,word.value.length - 1));
const Vector = new TokenShape('vector',[LeftAngleBracket,Number,Separator,Number,Separator,Number,RightAngleBracket], (value) => new DFVector({x: value.value[1].nice(), y: value.value[3].nice(), z: value.value[5].nice()}));

const LocationFull = new TokenShape('location-full',[Number,Separator,Number,Separator,Number,Separator,Number,Separator,Number], (value) => new DFLocation({loc: {x: value.value[0].nice(), y: value.value[2].nice(), z: value.value[4].nice(), pitch: value.value[6].nice(), yaw: value.value[8].nice()}}));
const LocationBlock = new TokenShape('location-block',[Number,Separator,Number,Separator,Number], (value) => new DFLocation({loc: {x: value.value[0].nice(), y: value.value[2].nice(), z: value.value[4].nice()}}));
const LocationData = new TokenOption('location-data',[LocationFull,LocationBlock],(value) => value.value.nice());
const Location = new TokenShape('location',[LeftSquareBracket,LocationData,RightSquareBracket],value => value.value[1].nice())

const TextOpen = new TokenShape('text-open',[LeftAngleBracket,RightAngleBracket]);
const TextClose = new TokenShape('text-close',[LeftAngleBracket,FordSlash,RightAngleBracket]);
const TextContent = new TokenWord('text-content',str => str.includes('</>') ? str.indexOf('</>') : null);
const Text = new TokenShape('text',[TextOpen,TextContent,TextClose], (value) => new DFText({name: value.value[1].value}));

const Literals = [Number,String,Vector,Text,Location];
const Literal = new TokenOption('value',Literals, (token) => {
    const value = token.value.nice();
    if(value instanceof ArgumentItem) return value;
    const type = typeof value;
    if(type == 'number') return new DFNumber({name: value.toString()});
    if(type == 'string') return new DFString({name: value});
});

const Value = new TokenOption('value',[Literal,Variable]);
//#endregion

const Assignment = new TokenWord('assignment','=');
const VariableAssignment = new TokenShape('variable-assignment',[WhiteSpaceOptional,Assignment,WhiteSpaceOptional]);
const VariableAssignmentLiteral = new TokenShape('variable-assignment-literal',[VariableAssignment,Value]);

const GlobalVariable = new TokenShape('global',[GlobalScope,WhiteSpace,Variable]);
const GlobalVariableAssignmentLiteral = new TokenShape('global-assign',[GlobalVariable,WhiteSpaceOptional,VariableAssignmentLiteral]);

const Parameter = new TokenWord('parameter',/[A-Z_][A-Z0-9_]/i);
const Parameters = new TokenPool('parameters',[Parameter,Separator]);

const FunctionCallParameters = new TokenPool('function-call-parameters',[Value,Separator]);
const FunctionCall = new TokenShape('function-call',[Variable,WhiteSpaceOptional,LeftParenthesis,FunctionCallParameters,RightParenthesis]);
const LocalAssignment = new TokenShape('local-assignment',[Variable,VariableAssignmentLiteral]);

const FunctionContents = new TokenPool('function-contents',[FunctionCall,LocalAssignment,WhiteSpace,LineEnd,Comment]);
const Function = new TokenShape('function',[Variable,WhiteSpaceOptional,LeftParenthesis,Parameters,RightParenthesis,WhiteSpaceOptional,LeftCurlyBracket,FunctionContents,RightCurlyBracket]);

const Player = new TokenWord('player',/player/i);
const Entity = new TokenWord('entity',/ent(ity)?/i);
const EventScopeName = new TokenOption('event-scope-name',[Player,Entity]);
const EventScopeContent = new TokenPool('event-scope-content',[WhiteSpace,LineEnd,Comment,Function,GlobalVariableAssignmentLiteral,GlobalVariable])
const EventScope = new TokenShape('event-scope',[EventScopeName,WhiteSpaceOptional,LeftCurlyBracket,EventScopeContent,RightCurlyBracket]);

export const StorageScope = new TokenPool('game',[WhiteSpace,LineEnd,Comment,GlobalVariableAssignmentLiteral,GlobalVariable,EventScope]);