import { getRLStream } from "./rlStreamHelper";
import { Action, keyOf, type State } from "../features/hanoi/rl";
import { publishEpisodeEvent } from "../state/rlAtoms";


export class TDLearning {
  private rlStream = getRLStream();
  private qTable: Map<string, number> = new Map();
  private learningRate = 0.1;
  private discountFactor = 0.9;
  private epsilon = 0.9; // Exploration rate
  private epsilonDecay: number = 0.9;
  private minEpsilon: number = 0.01;
  private isRunning = false;
  private maxStepsPerEpisode: number = 50;

  constructor() {
    this.initializeQtable();
  }

  private initializeQtable() {
    // Initialize Q-Table
    for (let d0 = 0; d0 < 3; d0++) {
      for (let d1 = 0; d1 < 3; d1++) {
        for (let d2 = 0; d2 < 3; d2++) {
          const state: State = [d0, d1, d2];
          const stateKey = keyOf(state);
          const validActions = this.getValidActions(state);

          if (validActions.length > 0) {
            for (const action of validActions) {
              const actionKey = this.getActionKey(action);
              const qKey = `${stateKey}_${actionKey}`;
              // console.log(`state key ${stateKey} : ${qKey}`)
              // Initialize value as 0
              this.qTable.set(qKey, 0);
            }
          }
        }
      }
    }
  }

  // Statistics
  private trainingStats = {
    totalEpisodes: 0,
    successfulEpisodes: 0,
    averageSteps: 0,
    bestSteps: Infinity,
  };

  /**
   * Start the TD learning process
   */
  async startLearning(
    maxEpisodes: number = 100,
    delayMs: number = 200,
  ): Promise<void> {
    if (this.isRunning) {
      console.log("TD Learning already running");
      return;
    }

    this.trainingStats = {
      totalEpisodes: 0,
      successfulEpisodes: 0,
      averageSteps: 0,
      bestSteps: Infinity,
    };

    this.isRunning = true;
    console.log("Starting TD Learning...");

    for (let episode = 0; episode < maxEpisodes; episode++) {
      this.rlStream.startEpisode();
      let state: State = [0, 0, 0];
      let episodeReward = 0;
      let solved = false;
      let num_steps = 0;

      for (let step = 0; step < this.maxStepsPerEpisode; step++) {
        const action = this.selectAction(state);
        const nextState = this.applyAction(state, action);
        const reward = this.generateReward(state, action, nextState);

        // Update Q-value
        this.updateQValue(state, action, reward, nextState);

        // Stream update to LearnFlow
        const stateKey = keyOf(state);
        this.rlStream.streamUpdate(
          stateKey,
          this.getQValueForUI(state),
          reward,
          this.getActionKey(action),
        );
        this.rlStream.incrementStep();

        episodeReward += reward;
        state = nextState;

        // Add delay to make it visible
        await new Promise((resolve) => setTimeout(resolve, delayMs));

        num_steps = step + 1;

        // Check if solved
        if (this.isGoalState(nextState)) {
          solved = true;
          break;
        }

        if (!this.isRunning) {
          break;
        }
      }

      // Update statistics
      this.trainingStats.totalEpisodes++;
      if (solved) {
        this.trainingStats.successfulEpisodes++;
        this.trainingStats.bestSteps = Math.min(
          this.trainingStats.bestSteps,
          num_steps,
        );
      }

      // Update average steps
      this.trainingStats.averageSteps =
        (this.trainingStats.averageSteps *
          (this.trainingStats.totalEpisodes - 1) +
          num_steps) /
        this.trainingStats.totalEpisodes;

      // Decay exploration rate
      this.epsilon = Math.max(
        this.minEpsilon,
        this.epsilon * this.epsilonDecay,
      );

      // Send episode data to chart via atom event
      publishEpisodeEvent({
        episode: episode + 1, // Convert to 1-indexed for chart display
        reward: episodeReward,
        epsilon: this.epsilon,
      });

      // Log progress every 10 episodes
      if (episode % 10 === 0 || solved) {
        console.log(
          `Episode ${episode}: ${solved ? "SOLVED" : "FAILED"} in ${num_steps} steps, ε=${this.epsilon.toFixed(3)}, Success Rate=${((this.trainingStats.successfulEpisodes / this.trainingStats.totalEpisodes) * 100).toFixed(1)}%`,
        );
      }

      if (!this.isRunning) {
        break;
      }
    }

    this.isRunning = false;
    console.log("TD Learning completed!");
    console.log(`Final Statistics:`, this.trainingStats);
  }

  /**
   * Stop the learning process
   */
  stopLearning(): void {
    this.isRunning = false;
  }

  /**
   * Check if learning is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Generate a reward based on node and context
   */
  private generateReward(
    _state: State,
    _action: Action,
    nextState: State,
  ): number {
    if (this.isGoalState(nextState)) {
      return 50; // Large reward for reaching goal
    }

    // Small negative reward for each step to encourage efficiency
    return -0.5;
  }

  getQTable(): void {
    const gridData = Array.from(this.qTable, ([key, value]) => ({
      State: key,
      Value: value,
    }));

    console.table(gridData);
  }

  /**
   * Reset Q-values and learning parameters
   */
  reset(): void {
    this.qTable.clear();
    this.learningRate = 0.1;
    this.discountFactor = 0.9;
    this.epsilon = 0.9;
    this.isRunning = false;

    this.trainingStats = {
      totalEpisodes: 0,
      successfulEpisodes: 0,
      averageSteps: 0,
      bestSteps: Infinity,
    };
    this.initializeQtable();
    this.rlStream.reset();
  }

  private getValidActions(state: State): Action[] {
    const actions: Action[] = [];

    // For each disk, check if it can be moved to other pegs
    for (let diskNum = 0; diskNum < 3; diskNum++) {
      const currentPeg = state[diskNum];

      // Check if this disk is the top disk on its current peg
      if (!this.isTopDisk(state, diskNum, currentPeg)) {
        continue;
      }

      // Try moving to other pegs
      for (let targetPeg = 0; targetPeg < 3; targetPeg++) {
        if (
          targetPeg !== currentPeg &&
          this.canMoveToPeg(state, diskNum, targetPeg)
        ) {
          actions.push(new Action(diskNum, currentPeg, targetPeg));
        }
      }
    }

    return actions;
  }

  /**
   * Check if a disk is the top disk on its peg
   */
  private isTopDisk(state: State, diskNum: number, peg: number): boolean {
    const disksOnPeg = this.getDisksOnPeg(state, peg);
    return disksOnPeg.length > 0 && disksOnPeg[0] === diskNum;
  }

  /**
   * Get all disks on a specific peg, ordered from top to bottom
   */
  private getDisksOnPeg(state: State, peg: number): number[] {
    const disks: number[] = [];
    for (let i = 0; i < 3; i++) {
      if (state[i] === peg) {
        disks.push(i);
      }
    }
    return disks.sort((a, b) => a - b); // Sort by disk number (smaller = on top)
  }

  /**
   * Check if a disk can be moved to a target peg
   */
  private canMoveToPeg(
    state: State,
    diskNum: number,
    targetPeg: number,
  ): boolean {
    const disksOnTargetPeg = this.getDisksOnPeg(state, targetPeg);

    // Can move to empty peg
    if (disksOnTargetPeg.length === 0) {
      return true;
    }

    // Can only move on top of larger disk
    const topDiskOnTarget = disksOnTargetPeg[0];
    return diskNum < topDiskOnTarget;
  }

  /**
   * Apply an action to a state and return the next state
   */
  private applyAction(state: State, action: Action): State {
    const newState = [...state];
    newState[action.diskNum] = action.to;
    return newState;
  }

  /**
   * Check if a state is the goal state (all disks on peg 2)
   */
  private isGoalState(state: State): boolean {
    return state.every((peg) => peg === 2);
  }

  /**
   * Get Q-value for a state-action pair (creates entry if doesn't exist)
   */
  private getQValue(
    state: State,
    action: Action,
    checkOnly: boolean = false,
  ): number {
    const stateKey = keyOf(state);
    const actionKey = this.getActionKey(action);
    const qKey = `${stateKey}_${actionKey}`;

    // If Q-value doesn't exist, create it with initial value
    if (!this.qTable.has(qKey) && !checkOnly) {
      this.qTable.set(qKey, 0); // Initial value
      // console.log(`Discovered new state-action: ${qKey}`);
    }

    return this.qTable.get(qKey)!;
  }

  private getQValueForUI(state: State): number {
    const validActions = this.getValidActions(state);
    let bestAction = validActions[0];
    let bestQValue = this.getQValue(state, bestAction);
    for (const action of validActions) {
      const qValue = this.getQValue(state, action);
      // console.log(`    action: ${action} qValue: ${qValue}`)
      if (qValue > bestQValue) {
        bestQValue = qValue;
        bestAction = action;
      }
    }
    return bestQValue;
  }

  /**
   * Set Q-value for a state-action pair
   */
  private setQValue(state: State, action: Action, value: number): void {
    const stateKey = keyOf(state);
    const actionKey = this.getActionKey(action);
    const qKey = `${stateKey}_${actionKey}`;
    this.qTable.set(qKey, value);
  }

  /**
   * Get action key for Q-table lookup
   */
  private getActionKey(action: Action): string {
    return `${action.diskNum}_${action.from}_${action.to}`;
  }

  /**
   * Select action using epsilon-greedy policy
   */
  private selectAction(state: State): Action {
    const validActions = this.getValidActions(state);
    // console.log(`valid action for state: ${state} are: ${validActions}`)
    if (validActions.length === 0) {
      throw new Error("No valid actions available");
    }

    // Epsilon-greedy: explore with probability epsilon, exploit otherwise
    if (Math.random() < this.epsilon) {
      // Explore: choose random action
      return validActions[Math.floor(Math.random() * validActions.length)];
    } else {
      // Exploit: choose action with highest Q-value
      let bestAction = validActions[0];
      let bestQValue = this.getQValue(state, bestAction);

      for (const action of validActions) {
        const qValue = this.getQValue(state, action);
        // console.log(`    action: ${action} qValue: ${qValue}`)
        if (qValue > bestQValue) {
          bestQValue = qValue;
          bestAction = action;
        }
      }

      return bestAction;
    }
  }

  /**
   * Update Q-value using Q-learning update rule
   */
  private updateQValue(
    state: State,
    action: Action,
    reward: number,
    nextState: State,
  ): void {
    const currentQ = this.getQValue(state, action);

    // Find maximum Q-value for next state
    const nextActions = this.getValidActions(nextState);
    let maxNextQ = 0;

    if (nextActions.length > 0) {
      maxNextQ = Math.max(
        ...nextActions.map((a) => this.getQValue(nextState, a)),
      );
    }

    // Q-learning update: Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
    const target = reward + this.discountFactor * maxNextQ;
    const newQ = currentQ + this.learningRate * (target - currentQ);

    this.setQValue(state, action, newQ);
  }

  /**
   * Get the best action for a specific state
   */
  getBestActionForState(state: State): Action | null {
    const validActions = this.getValidActions(state);
    if (validActions.length === 0) return null;
    
    let bestAction = validActions[0];
    let bestQValue = this.getQValue(state, bestAction);
    
    for (const action of validActions) {
      const qValue = this.getQValue(state, action);
      if (qValue > bestQValue) {
        bestQValue = qValue;
        bestAction = action;
      }
    }
    
    return bestAction;
  }

  /**
   * Get all best actions for all states
   */
  getAllBestActions(): Map<string, Action> {
    const bestActions = new Map<string, Action>();
    
    for (let d0 = 0; d0 < 3; d0++) {
      for (let d1 = 0; d1 < 3; d1++) {
        for (let d2 = 0; d2 < 3; d2++) {
          const state: State = [d0, d1, d2];
          const stateKey = keyOf(state);
          const bestAction = this.getBestActionForState(state);
          
          if (bestAction) {
            bestActions.set(stateKey, bestAction);
          }
        }
      }
    }
    
    return bestActions;
  }

  /**
   * Get the optimal policy (greedy actions)
   */
  getOptimalPolicy(): Map<string, Action> {
    const policy = new Map<string, Action>();

    // For each possible state, find the best action
    for (let d0 = 0; d0 < 3; d0++) {
      for (let d1 = 0; d1 < 3; d1++) {
        for (let d2 = 0; d2 < 3; d2++) {
          const state: State = [d0, d1, d2];
          const stateKey = keyOf(state);
          const validActions = this.getValidActions(state);

          if (validActions.length > 0) {
            let bestAction = validActions[0];
            let bestQValue = this.getQValue(state, bestAction);

            for (const action of validActions) {
              const qValue = this.getQValue(state, action, true);
              if (qValue > bestQValue) {
                bestQValue = qValue;
                bestAction = action;
              }
            }
            // console.log(`state key ${stateKey} : ${bestAction} : ${bestQValue}`)
            policy.set(stateKey, bestAction);
          }
        }
      }
    }

    return policy;
  }

  /**
   * Solve Tower of Hanoi using the learned policy
   */
  solveWithPolicy(): {
    stateChanges: string[];
    solution: Action[];
    steps: number;
    solved: boolean;
  } {
    const policy = this.getOptimalPolicy();
    let state: State = [0, 0, 0];
    const solution: Action[] = [];
    let stateChanges: string[] = [keyOf(state)];
    let steps = 0;
    const maxSteps = 50;

    while (steps < maxSteps && !this.isGoalState(state)) {
      const stateKey = keyOf(state);
      const action = policy.get(stateKey);

      if (!action) {
        console.error("No policy found for state:", state);
        break;
      }

      solution.push(action);
      state = this.applyAction(state, action);
      stateChanges.push(keyOf(state));
      // console.log(stateKey,":", action)
      // this.rlStream.streamUpdate(stateKey, this.getQValueForUI(state), 0, this.getActionKey(action));
      steps++;
    }

    return {
      stateChanges,
      solution,
      steps,
      solved: this.isGoalState(state),
    };
  }
}

/**
 * Global instance for easy access
 */
export const tdLearning = new TDLearning();
