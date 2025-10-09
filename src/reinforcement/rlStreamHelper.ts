import type { RLUpdate } from "../features/playground/PlayGround";
import { stateKeyToNodeId } from "../features/playground/PlayGround";

/**
 * Helper class for RL algorithms to easily stream updates to LearnFlow component
 */
export class RLStreamHelper {
  private static instance: RLStreamHelper | null = null;
  private episodeCount = 0;
  private stepCount = 0;
  private totalReward = 0;

  private constructor() {}

  static getInstance(): RLStreamHelper {
    if (!RLStreamHelper.instance) {
      RLStreamHelper.instance = new RLStreamHelper();
    }
    return RLStreamHelper.instance;
  }

  /**
   * Stream a node value update to the LearnFlow component
   */
  streamUpdate(
    nodeId: string,
    value: number,
    reward?: number,
    action?: string,
  ): void {
    const update: RLUpdate = {
      nodeId: stateKeyToNodeId[nodeId],
      value: value.toFixed(2),
      timestamp: Date.now(),
      episode: this.episodeCount,
      step: this.stepCount,
      reward,
      action,
    };

    // Use the global function exposed by LearnFlow
    if (typeof window !== "undefined" && (window as any).addRLUpdate) {
      (window as any).addRLUpdate(update);
    } else {
      console.warn(
        "LearnFlow component not found. Make sure LearnFlow is mounted.",
      );
    }
  }

  /**
   * Start a new episode
   */
  startEpisode(): void {
    this.episodeCount++;
    this.stepCount = 0;
    this.totalReward = 0;
  }

  /**
   * Increment step counter
   */
  incrementStep(): void {
    this.stepCount++;
  }

  /**
   * Add reward to current episode total
   */
  addReward(reward: number): void {
    this.totalReward += reward;
  }

  /**
   * Get current episode statistics
   */
  getEpisodeStats() {
    return {
      episode: this.episodeCount,
      step: this.stepCount,
      totalReward: this.totalReward,
    };
  }

  /**
   * Reset all counters
   */
  reset(): void {
    this.episodeCount = 0;
    this.stepCount = 0;
    this.totalReward = 0;
  }

  resetNodes(): void {
    if (typeof window !== "undefined" && (window as any).resetAllNodes) {
      (window as any).resetAllNodes();
    } else {
      console.warn("LearnFlow resetAllNodes not found.");
    }
    this.reset();
  }
}

/**
 * Convenience function to get the RL stream helper instance
 */
export const getRLStream = () => RLStreamHelper.getInstance();

/**
 * Example usage for Temporal Difference Learning:
 *
 * ```typescript
 * import { getRLStream } from './rlStreamHelper';
 *
 * const rlStream = getRLStream();
 *
 * // In your TD learning loop:
 * for (let episode = 0; episode < maxEpisodes; episode++) {
 *   rlStream.startEpisode();
 *
 *   while (!isTerminal(state)) {
 *     const action = selectAction(state);
 *     const nextState = takeAction(state, action);
 *     const reward = getReward(state, action, nextState);
 *
 *     // Update Q-values and stream to UI
 *     const newValue = updateQValue(state, action, reward, nextState);
 *     rlStream.streamUpdate(stateId, newValue, reward, action);
 *
 *     rlStream.incrementStep();
 *     state = nextState;
 *   }
 * }
 * ```
 */
