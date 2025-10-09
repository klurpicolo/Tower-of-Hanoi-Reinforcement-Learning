import { makeAutoObservable } from "mobx";

export default class CountModel {
  constructor() {
    makeAutoObservable(this);
  }

  count = 0;

  increment() {
    this.count += 1;
  }

  decrement() {
    this.count -= 1;
  }
}
