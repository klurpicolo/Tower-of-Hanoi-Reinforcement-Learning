import { getRLStream } from './rlStreamHelper';
import { Action, keyOf, type State } from '../features/hanoi/rl';

/**
 * Mock Temporal Difference Learning algorithm for demonstration
 * This simulates a TD learning process and streams updates to LearnFlow
 */
export class MockTDLearning {
  private rlStream = getRLStream();
  private qValues: Map<string, number> = new Map();
  private qTable: Map<string, number> = new Map();
  private learningRate = 0.1;
  private discountFactor = 0.9;
  private epsilon = 0.1; // Exploration rate
  private epsilonDecay: number = 0.9;
  private minEpsilon: number = 0.01;
  private isRunning = false;
  private maxStepsPerEpisode: number = 50;

  constructor() {
    // Initialize Q-values for all nodes
    for (let i = 1; i <= 9; i++) {
      this.qValues.set(i.toString(), Math.random() * 0.5 - 0.25); // Random initial values
    }

    this.initializeQtable();
  }

  private initializeQtable(){
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
              this.qValues.set(qKey, 0); 
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
    bestSteps: Infinity
  };

  /**
   * Start the TD learning process
   */
  async startLearning(maxEpisodes: number = 100, delayMs: number = 200): Promise<void> {
    if (this.isRunning) {
      console.log('TD Learning already running');
      return;
    }

    this.trainingStats = {
      totalEpisodes: 0,
      successfulEpisodes: 0,
      averageSteps: 0,
      bestSteps: Infinity
    };

    this.isRunning = true;
    console.log('Starting TD Learning...');

    for (let episode = 0; episode < maxEpisodes; episode++) {
      this.rlStream.startEpisode();
      let state: State = [0, 0, 0];
      let episodeReward = 0;
      let solved = false;
      let num_steps = 0;

      for (let step = 0; step < this.maxStepsPerEpisode; step++) {
        // Select a random node to update
        // const nodeId = (Math.floor(Math.random() * 9) + 1).toString();
        // const currentValue = this.qValues.get(nodeId) || 0;
        
        const action = this.selectAction(state);
        const nextState = this.applyAction(state, action);
        const reward = this.generateReward(state, action, nextState);

        // Update Q-value
        this.updateQValue(state, action, reward, nextState);
        
        // Stream update to LearnFlow
        const stateKey = keyOf(state);
        this.rlStream.streamUpdate('1', this.getQValue(state, action), reward, this.getActionKey(action));
        this.rlStream.incrementStep();

        episodeReward += reward;
        state = nextState;
        
        // Add delay to make it visible
        await new Promise(resolve => setTimeout(resolve, delayMs));

        num_steps = step + 1

        // Check if solved
        if (this.isGoalState(nextState)) {
          solved = true
          break;
        }
      }

      // Update statistics
      this.trainingStats.totalEpisodes++;
      if (solved) {
        this.trainingStats.successfulEpisodes++;
        this.trainingStats.bestSteps = Math.min(this.trainingStats.bestSteps, num_steps);
      }

      // Update average steps
      this.trainingStats.averageSteps = 
        (this.trainingStats.averageSteps * (this.trainingStats.totalEpisodes - 1) + num_steps) / 
        this.trainingStats.totalEpisodes;
      
      // Decay exploration rate
      this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.epsilonDecay);
  
      // Log progress every 10 episodes
      if (episode % 10 === 0 || solved) {
        console.log(`Episode ${episode}: ${solved ? 'SOLVED' : 'FAILED'} in ${num_steps} steps, ε=${this.epsilon.toFixed(3)}, Success Rate=${(this.trainingStats.successfulEpisodes / this.trainingStats.totalEpisodes * 100).toFixed(1)}%`);
      }
    }

    this.isRunning = false;
    console.log('TD Learning completed!');
    console.log(`Final Statistics:`, this.trainingStats);
  }

  /**
   * Stop the learning process
   */
  stopLearning(): void {
    this.isRunning = false;
  }

  /**
   * Perform TD update
   */
  private tdUpdate(currentValue: number, reward: number): number {
    // Simple TD(0) update: Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
    // For simplicity, we'll use a random target value
    const targetValue = Math.random() * 2 - 1; // Random target between -1 and 1
    const tdError = reward + this.discountFactor * targetValue - currentValue;
    return currentValue + this.learningRate * tdError;
  }

  /**
   * Generate a reward based on node and context
   */
  private generateReward(_state: State, _action: Action, nextState: State): number {
    if (this.isGoalState(nextState)) {
      return 100; // Large reward for reaching goal
    }
    
    // Small negative reward for each step to encourage efficiency
    return -1;
  }

  /**
   * Get average Q-value across all states
   */
  private getAverageQValue(): number {
    const values = Array.from(this.qValues.values());
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Get current Q-values
   */
  getQValues(): Map<string, number> {
    return new Map(this.qValues);
  }

  getQTable(): void {
    const gridData = Array.from(this.qTable, ([key, value]) => ({
        State: key,
        Value: value
        }));
        
        console.table(gridData);
  }

  /**
   * Reset Q-values and learning parameters
   */
  reset(): void {
    this.qValues.clear();
    this.qTable.clear();
    this.learningRate = 0.1;
    this.discountFactor = 0.9;
    this.epsilon = 0.1;
    this.isRunning = false;

    this.trainingStats = {
      totalEpisodes: 0,
      successfulEpisodes: 0,
      averageSteps: 0,
      bestSteps: Infinity
    };
    
    // Reinitialize Q-values
    for (let i = 1; i <= 9; i++) {
      this.qValues.set(i.toString(), Math.random() * 0.5 - 0.25);
    }
    this.initializeQtable();
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
        if (targetPeg !== currentPeg && this.canMoveToPeg(state, diskNum, targetPeg)) {
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
  private canMoveToPeg(state: State, diskNum: number, targetPeg: number): boolean {
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
    return state.every(peg => peg === 2);
  }

  /**
   * Get Q-value for a state-action pair (creates entry if doesn't exist)
   */
  private getQValue(state: State, action: Action, checkOnly: boolean = false): number {
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
      throw new Error('No valid actions available');
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
  private updateQValue(state: State, action: Action, reward: number, nextState: State): void {
    const currentQ = this.getQValue(state, action);
    
    // Find maximum Q-value for next state
    const nextActions = this.getValidActions(nextState);
    let maxNextQ = 0;
    
    if (nextActions.length > 0) {
      maxNextQ = Math.max(...nextActions.map(a => this.getQValue(nextState, a)));
    }
    
    // Q-learning update: Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
    const target = reward + this.discountFactor * maxNextQ;
    const newQ = currentQ + this.learningRate * (target - currentQ);
    
    this.setQValue(state, action, newQ);
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
            console.log(`state key ${stateKey} : ${bestAction}`)
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
  solveWithPolicy(): { solution: Action[], steps: number, solved: boolean } {
    const policy = this.getOptimalPolicy();
    let state: State = [0, 0, 0];
    const solution: Action[] = [];
    let steps = 0;
    const maxSteps = 50;
    
    while (steps < maxSteps && !this.isGoalState(state)) {
      const stateKey = keyOf(state);
      const action = policy.get(stateKey);
      
      if (!action) {
        console.error('No policy found for state:', state);
        break;
      }
      
      solution.push(action);
      state = this.applyAction(state, action);
      steps++;
    }
    
    return {
      solution,
      steps,
      solved: this.isGoalState(state)
    };
  }
}

/**
 * Global instance for easy access
 */
export const mockTDLearning = new MockTDLearning();

/**
 * Convenience functions for browser console
 */
if (typeof window !== 'undefined') {
  (window as any).startTDLearning = (episodes?: number, delay?: number) => {
    mockTDLearning.startLearning(episodes, delay);
  };
  
  (window as any).stopTDLearning = () => {
    mockTDLearning.stopLearning();
  };
  
  (window as any).resetTDLearning = () => {
    mockTDLearning.reset();
  };
  
  (window as any).getQValues = () => {
    return mockTDLearning.getQValues();
  };

  (window as any).getQTable = () => {
    return mockTDLearning.getQTable();
  };

  (window as any).getOptimalPolicy = () => {
      mockTDLearning.getOptimalPolicy();
    };
    
    (window as any).solveTowerOfHanoi = () => {
      return mockTDLearning.solveWithPolicy();
    };
}
