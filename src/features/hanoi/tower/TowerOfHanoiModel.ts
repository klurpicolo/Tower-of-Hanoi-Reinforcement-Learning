import { makeAutoObservable } from "mobx";
import type { Action, State } from "../rl";

export default class TowerOfHanoiModel {

    constructor() {
        makeAutoObservable(this)
    }

    diskNum = 3;
    
    pegNum = 3;
    /**
     * state[i] = j means disk i is on peg j (0, 1, or 2)
     * The disks are numbered from 0 (smallest) to 2 (largest).
     * The pegs are numbered from 0 (left) to 2 (right).
     * Initially, all disks are on peg 0.
     */
    state: State = [0, 0, 0];

    public moveDisk({diskNum, from, to}: Action) {
        if (diskNum < 0 || diskNum >= this.diskNum) {
            throw new Error(`Invalid disk number: ${diskNum}`);
        }
        if (from < 0 || from >= this.pegNum) {
            throw new Error(`Invalid from peg number: ${from}`);
        }
        if (to < 0 || to >= this.pegNum) {
            throw new Error(`Invalid to peg number: ${to}`);
        }
        if (from === to) {
            throw new Error(`From and To are equal: ${from}`);
        }
        const fromDisks = this.getDisksOnPeg(from);
        const toDisks = this.getDisksOnPeg(to);
        if (!fromDisks.includes(diskNum)) {
            throw new Error(`Disk ${diskNum} is not on peg ${from}`);
        }
        if (fromDisks[0] !== diskNum) {
            throw new Error(`Disk ${diskNum} is not the top disk on peg ${from}`);
        }
        if (toDisks.length > 0 && toDisks[0] < diskNum) {
            throw new Error(`Cannot move disk ${diskNum} on top of smaller disk ${toDisks[0]} on peg ${to}`);
        }
        // Create a new array to ensure MobX detects the change
        console.log("Moving disk", diskNum, "from", from, "to", to);
        const newState = [...this.state];
        newState[diskNum] = to;
        this.state = newState;
    }

    public reset() {
        this.state = [0, 0, 0];
    }

    public get isSolved() {
        return this.state.every(e => e === 2);
    }

    getPeg(diskNum: number): number {
        if (diskNum < 0 || diskNum >= this.diskNum) {
            throw new Error(`Invalid disk number: ${diskNum}`);
        }
        return this.state[diskNum];
    }

    /**
     * getDisksOnPeg
     * @param peg number of peg (0, 1, or 2)
     * @returns array of disk numbers on the peg, from top to bottom order
     */
    getDisksOnPeg(peg: number): number[] {
        const res: number[] = [];
        this.state.forEach((e, i) => {
            if (e === peg) {
                res.push(i);
            }
        }
        )
        return res;
    }
    
};