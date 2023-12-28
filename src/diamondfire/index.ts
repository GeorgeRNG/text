export const Scopes = {
    GAME: 'unsaved',
    SAVE: 'saved',
    LOCAL: 'local',
    LINE: 'line',
} as const
export type Scope = keyof typeof Scopes;

export class MyVariable {
    constructor(public scope: Scope, public name: String) {}
}

export class MyBlock {
    constructor(public type: string, public action: string) {}
}

export class MyHeader {
    constructor(public type: string, public name: string) {}
}
export class MyFunctionHeader extends MyHeader {

}
export class MyCodeline {
    constructor(public header: MyHeader, public blocks: MyBlock[]) {}
}

export class MyGlobal {
    constructor(public codelines: MyCodeline[]) {}
}