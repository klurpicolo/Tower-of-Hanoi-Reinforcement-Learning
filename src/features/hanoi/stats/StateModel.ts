import { makeAutoObservable } from "mobx";
import type { Episode } from "../rl";

export class StatModel {
    constructor(history: Episode[]) {
        makeAutoObservable(this)
        this.history = history;
    }

    history: Episode[] = [];

    addEpisode(episode: Episode) {
        this.history.push(episode);
    }
}