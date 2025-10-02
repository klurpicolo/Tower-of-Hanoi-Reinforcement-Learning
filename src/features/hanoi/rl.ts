type State = number[];
// stable by value use for comparison
const keyOf = (s: ReadonlyArray<number>) => s.join("|"); 

class Action {
    diskNum: number
    from: number
    to: number

    constructor(diskNum: number, from: number, to: number) {
        this.diskNum = diskNum;
        this.from = from;
        this.to = to;
    }

    toString(): string {
        return `disk ${this.diskNum}: ${this.from}→${this.to}`;
    }
}

type TransitionProp = (state: State, action: Action) => {nextState: State, prop: number};
type Reward = (state: State, action: Action, nextState: State) => number;
type Policy = (state: State) => Action;

type SAR = {
    state: State;
    action: Action;
    reward: number;
}

type SingleTransition = {
    state: State;
    action: Action;
    reward: number;
    nextState: State;
};

type Episode = SAR[];


export type { State, TransitionProp, Reward, Policy, SAR, SingleTransition, Episode};
export { keyOf, Action };