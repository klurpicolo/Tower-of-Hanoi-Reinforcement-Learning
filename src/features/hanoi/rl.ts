type State = number[];
class Action {
    diskNum: number
    from: number
    to: number

    constructor(diskNum: number, from: number, to: number) {
        this.diskNum = diskNum;
        this.from = from;
        this.to = to;
    }
}

type TransitionProp = (state: State, action: Action) => {nextState: State, prop: number};
type Reward = (state: State, action: Action, nextState: State) => number;
type Policy = (state: State) => Action;


export type { State, TransitionProp, Reward, Policy };
export { Action};