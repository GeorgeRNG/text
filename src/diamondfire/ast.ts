import { MyCodeline, MyGlobal, MyHeader, MyVariable, Scope, Scopes } from '.';
import { TokenWord, TokenOption, TokenShape, TokenPool, ParsedTokenPool, ParsedTokenWord, TokenError, ToParsedToken } from '../syntax'

import { Number as DFNumber, Text as DFString, Vector as DFVector, Component as DFText, ArgumentItem, Location as DFLocation, Variable, CodeblockNames } from 'df.ts'

const WhiteSpace = new TokenWord('space',/\s+/);
const LineEnd = new TokenWord('end',/[\n;]+|$/);
const WhiteSpaceOptional = new TokenWord('space-optional',/\s*/);

const CommentLine = new TokenWord('comment-line', /\/\/.*/);
const CommentBlock = new TokenWord('comment-block',/((\/\*)([\s\S]+?)(\*\/))/);
const Comment = new TokenOption('comment',[CommentLine,CommentBlock])

const SomeText = new TokenWord('text', /\w+/i, v => v.value);

//#region Variables
const GraveAccent = new TokenWord('grave','`');

const Game = new TokenWord('scope-game',/G(AME)?/i, () => Scopes.GAME);
const Save = new TokenWord('scope-save',/S(AVE)?/i, () => Scopes.SAVE);
const GlobalScope = new TokenOption('scope-global',[Game,Save] as const, (v): 'unsaved' | 'saved' => {
    return v.nice();
});
type Save = (ToParsedToken<typeof GlobalScope>)
const Local = new TokenWord('scope-local',/L(OCAL)?/i, () => Scopes.LOCAL);
const Line = new TokenWord('scope-line',/I|LINE/i, () => Scopes.SAVE);
const PrivateScope = new TokenOption('scope-private',[Local,Line], (v) => {
    return v.nice();
});
const Scope = new TokenOption('scope',[GlobalScope,PrivateScope], (v) => {
    return v.nice();
});

const BigVariableNameContent = new TokenWord('variable-name-big-content',/[^\n`\\]+/i, (v) => v.value);
const BigVariableName = new TokenShape('variable-name-big',[GraveAccent,BigVariableNameContent,GraveAccent], (v) => v.value[1].nice());
const SmallVariableName = new TokenWord('variable-name-small',/[%A-Z_][%A-Z0-9_]+/i, (v) => v.value);
const VariableName = new TokenOption('variable-name',[BigVariableName,SmallVariableName], (v) => v.value.nice());
//#endregion

//#region Grammar
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
//#endregion

//#region Values
const Number = new TokenWord('number',/-?\d+(\.\d+)?/,(word) => parseFloat(word.value));
const String = new TokenWord('string',/"[^"]*"/i, (word) => word.value.substring(1,word.value.length - 1));
const Vector = new TokenShape('vector',[LeftAngleBracket,Number,Separator,Number,Separator,Number,RightAngleBracket] as const, (value) => new DFVector({x: value.value[1].nice(), y: value.value[3].nice(), z: value.value[5].nice()}));

const LocationFull = new TokenShape('location-full',[Number,Separator,Number,Separator,Number,Separator,Number,Separator,Number] as const, (value) => new DFLocation({loc: {x: value.value[0].nice(), y: value.value[2].nice(), z: value.value[4].nice(), pitch: value.value[6].nice(), yaw: value.value[8].nice()}}));
const LocationBlock = new TokenShape('location-block',[Number,Separator,Number,Separator,Number] as const, (value) => new DFLocation({loc: {x: value.value[0].nice(), y: value.value[2].nice(), z: value.value[4].nice()}}));
const LocationData = new TokenOption('location-data',[LocationFull,LocationBlock],(value) => value.value.nice());
const Location = new TokenShape('location',[LeftSquareBracket,LocationData,RightSquareBracket],value => value.value[1].nice())

const TextOpen = new TokenShape('text-open',[LeftAngleBracket,RightAngleBracket]);
const TextClose = new TokenShape('text-close',[LeftAngleBracket,FordSlash,RightAngleBracket]);
const TextContent = new TokenWord('text-content',str => str.includes('</>') ? str.indexOf('</>') : null, v => v.value);
const Text = new TokenShape('text',[TextOpen,TextContent,TextClose] as const, (value) => new DFText({name: value.value[1].value}));

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

//#region Selections
const AllPlayersSelection = new TokenWord('selection-allplayers', /AllP?l?a?y?e?r?s?/i, () => 'AllPlayers' as const);
const VictimSelection = new TokenWord('selection-victim', /Vict?i?m?/i, () => 'Victim' as const);
const ShooterSelection = new TokenWord('selection-shooter', /Shoote?r?/i, () => 'Shooter' as const);
const DamagerSelection = new TokenWord('selection-damager', /Damage?r?/i, () => 'Damager' as const);
const KillerSelection = new TokenWord('selection-killer', /Kille?r?/i, () => 'Killer' as const);
const DefaultSelection = new TokenWord('selection-default', /Defa?u?l?t?/i, () => 'Default' as const);
const SelectionSelection = new TokenWord('selection-selection', /Sele?c?t?i?o?n?/i, () => 'Selection' as const);
const ProjectileSelection = new TokenWord('selection-projectile', /Proje?c?t?i?l?e?/i, () => 'Projectile' as const);
const LastEntitySelection = new TokenWord('selection-lastentity', /LastE?n?t?i?t?y?/i, () => 'LastEntity' as const);

const Selections = new TokenOption('selection',[AllPlayersSelection,VictimSelection,ShooterSelection,DamagerSelection,KillerSelection,DefaultSelection,SelectionSelection,ProjectileSelection,LastEntitySelection] as const, v => v.value.nice());
//#endregion

//#region Action
//#region Action Types
const PlayerAction = new TokenWord('action-type-player',/pla?y?e?r?/i, () => 'player_action');
const EntityAction = new TokenWord('action-type-entity',/enti?t?y?/, () => 'entity_action');
const VariableAction = new TokenWord('action-type-variable', /(set )? vari?a?b?l?e?/i, () => 'set_var');
const GameAction = new TokenWord('action-type-game',/ga?me?/i, () => 'game_action');
const ControlAction = new TokenWord('action-type-control', /co?n?tro?l/i, () => 'control');
const SelectAction = new TokenWord('action-type-select', /sele?c?t?/i, () => 'select_obj');

const SelectionActions = new TokenOption('action-type-selection',[PlayerAction,EntityAction], v => v.value.nice());
const SubActionActions = new TokenOption('action-type-subaction',[SelectAction], v => v.value.nice());
const Actions = new TokenOption('action-type',[PlayerAction,EntityAction,VariableAction,GameAction,ControlAction], v => v.value.nice());

const SelectionActionTrace = new TokenShape('action-selection-trace',[SelectionActions,WhiteSpace,Selections,WhiteSpace,SomeText]);
//#endregion
//#endregion

const CodeblockContent = new TokenPool('codeblock-content',[Comment,WhiteSpace,LineEnd,SelectionActionTrace]);
const Codeblock = new TokenShape('codeblock',[LeftCurlyBracket,CodeblockContent,RightCurlyBracket] as const)

//#region Code Headers
const PlayerHeader = new TokenWord('header-type-player',/pla?y?e?r?/i, () => 'event' as const);
const EntityHeader = new TokenWord('header-type-entity',/en?t?i?t?y?/i, () => 'entity_event' as const);
const ProcessHeader = new TokenWord('header-type-process',/pro?c?e?s?s?/i, () => 'proc' as const);
const FunctionHeader = new TokenWord('header-type-function', /fu?n?c?t?i?o?n?/i, () => 'func' as const);

const Events = new TokenOption('event-type',[PlayerHeader,EntityHeader] as const, (v) => v.value.nice());
const Event = new TokenShape('event',[Events,WhiteSpace,SomeText,WhiteSpaceOptional,Codeblock] as const, t => {
    t.value[0].nice()
    return "HIHI" as "HIHI" | "hihi";
});
//#endregion

export const Global = new TokenPool('game',[Event] as const, v => {
    const x = v.value
    const nc = x[0].nice()
    return "Hi" as const;
    // return new MyGlobal(v.value.filter(v => v.type == false).map(v => v.nice()));
});

const x = Global.parse("1")
if(!(x instanceof TokenError)) {
    const y = x.nice();
    const z = y == 'Hi' as const;
}