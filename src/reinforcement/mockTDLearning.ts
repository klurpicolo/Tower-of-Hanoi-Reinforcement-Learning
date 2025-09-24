import { getRLStream } from './rlStreamHelper';

/**
 * Mock Temporal Difference Learning algorithm for demonstration
 * This simulates a TD learning process and streams updates to LearnFlow
 */
export class MockTDLearning {
  private rlStream = getRLStream();
  private qValues: Map<string, number> = new Map();
  private learningRate = 0.1;
  private discountFactor = 0.9;
  private epsilon = 0.1; // Exploration rate
  private isRunning = false;

  constructor() {
    // Initialize Q-values for all nodes
    for (let i = 1; i <= 9; i++) {
      this.qValues.set(i.toString(), Math.random() * 0.5 - 0.25); // Random initial values
    }
  }

  /**
   * Start the TD learning process
   */
  async startLearning(maxEpisodes: number = 100, delayMs: number = 200): Promise<void> {
    if (this.isRunning) {
      console.log('TD Learning already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting TD Learning...');

    for (let episode = 0; episode < maxEpisodes; episode++) {
      this.rlStream.startEpisode();
      
      // Simulate an episode with random state transitions
      const episodeLength = Math.floor(Math.random() * 5) + 3; // 3-7 steps
      
      for (let step = 0; step < episodeLength; step++) {
        // Select a random node to update
        const nodeId = (Math.floor(Math.random() * 9) + 1).toString();
        const currentValue = this.qValues.get(nodeId) || 0;
        
        // Simulate TD update
        const reward = this.generateReward(nodeId, step, episodeLength);
        const nextValue = this.tdUpdate(currentValue, reward);
        
        // Update Q-value
        this.qValues.set(nodeId, nextValue);
        
        // Stream update to LearnFlow
        this.rlStream.streamUpdate(nodeId, nextValue, reward, `action_${step}`);
        this.rlStream.incrementStep();
        
        // Add delay to make it visible
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
      // Decay exploration rate
      this.epsilon = Math.max(0.01, this.epsilon * 0.995);
      
      // Log progress every 10 episodes
      if (episode % 10 === 0) {
        console.log(`Episode ${episode}: ε=${this.epsilon.toFixed(3)}, Avg Q=${this.getAverageQValue().toFixed(3)}`);
      }
    }

    this.isRunning = false;
    console.log('TD Learning completed!');
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
  private generateReward(nodeId: string, step: number, episodeLength: number): number {
    // Reward structure: higher rewards for nodes closer to goal state
    const nodeNum = parseInt(nodeId);
    const progressReward = (episodeLength - step) / episodeLength; // Higher reward for earlier steps
    const nodeReward = Math.sin(nodeNum * 0.5) * 0.3; // Node-specific reward
    const explorationBonus = Math.random() * 0.1; // Small random bonus
    
    return progressReward + nodeReward + explorationBonus;
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

  /**
   * Reset Q-values and learning parameters
   */
  reset(): void {
    this.qValues.clear();
    this.learningRate = 0.1;
    this.discountFactor = 0.9;
    this.epsilon = 0.1;
    this.isRunning = false;
    
    // Reinitialize Q-values
    for (let i = 1; i <= 9; i++) {
      this.qValues.set(i.toString(), Math.random() * 0.5 - 0.25);
    }
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
}
