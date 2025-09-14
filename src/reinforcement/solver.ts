import { keyOf, Action, type State } from "../features/hanoi/rl";


const optimalMap = new Map<string, Action>([
    [keyOf([0, 0, 0]), new Action(0,0,2)],
    [keyOf([2, 0, 0]), new Action(1,0,1)],
    [keyOf([2, 1, 0]), new Action(0,2,1)],
    [keyOf([1, 1, 0]), new Action(2,0,2)],
    [keyOf([1, 1, 2]), new Action(0,1,0)],
    [keyOf([0, 1, 2]), new Action(1,1,2)],
    [keyOf([0, 2, 2]), new Action(0,0,2)],
]);

export const optimal3DiskPolicy = (state: State) => {
    return optimalMap.get(keyOf(state)) ?? new Action(0,0,0);
}