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