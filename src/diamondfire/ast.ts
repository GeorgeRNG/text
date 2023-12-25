import { MyVariable, Scope, Scopes } from '.';
import { TokenWord, TokenOption, TokenShape, TokenPool } from '../syntax'

import { Number as DFNumber, Text as DFString, Vector as DFVector, Component as DFText, ArgumentItem, Location as DFLocation, Variable } from 'df.ts'

const WhiteSpace = new TokenWord('space',/\s+/);
const LineEnd = new TokenWord('end',/[\n;]+|$/);
const WhiteSpaceOptional = new TokenWord('space-optional',/\s*/);

const CommentLine = new TokenWord('comment-line', /\/\/.*/);
const CommentBlock = new TokenWord('comment-block',/((\/\*)([\s\S]+?)(\*\/))/);
const Comment = new TokenOption('comment',[CommentLine,CommentBlock])

const GraveAccent = new TokenWord('grave','`');

const Game = new TokenWord('scope-game',/G(AME)?/i, () => Scopes.GAME);
const Save = new TokenWord('scope-save',/S(AVE)?/i, () => Scopes.SAVE);
const GlobalScope = new TokenOption('scope-global',[Game,Save], (v): Scope => {
    return v.nice();
});
const Local = new TokenWord('scope-local',/L(OCAL)?/i, () => Scopes.LOCAL);
const Line = new TokenWord('scope-line',/I|LINE/i, () => Scopes.SAVE);
const PrivateScope = new TokenOption('scope-private',[Local,Line], (v): Scope => {
    return v.nice();
});
const Scope = new TokenOption('scope',[GlobalScope,PrivateScope], (v): Scope => {
    return v.nice();
});

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

const BigVariableNameContent = new TokenWord('variable-name-big-content',/[^\n`\\]+/i, (v) => v.value);
const BigVariableName = new TokenShape('variable-name-big',[GraveAccent,BigVariableNameContent,GraveAccent], (v) => v.value[1].nice());
const SmallVariableName = new TokenWord('variable-name-small',/[%A-Z_][%A-Z0-9_]+/i, (v) => v.value);
const VariableName = new TokenOption('variable-name',[BigVariableName,SmallVariableName], (v) => v.value.nice());

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

const Value = new TokenOption('value',[Literal,VariableName]);
//#endregion

const Assignment = new TokenWord('assignment','=');
const VariableAssignment = new TokenShape('variable-assignment',[WhiteSpaceOptional,Assignment,WhiteSpaceOptional]);
const VariableAssignmentLiteral = new TokenShape('variable-assignment-literal',[VariableAssignment,Value]);

const GlobalVariable = new TokenShape('global',[GlobalScope,WhiteSpace,VariableName], (v) => {
    return new MyVariable(v.value[0].nice(),v.value[2].nice());
});
const GlobalVariableAssignmentLiteral = new TokenShape('global-assign',[GlobalVariable,WhiteSpaceOptional,VariableAssignmentLiteral]);

export const StorageScope = new TokenPool('game',[WhiteSpace,LineEnd,Comment,GlobalVariableAssignmentLiteral,GlobalVariable]);