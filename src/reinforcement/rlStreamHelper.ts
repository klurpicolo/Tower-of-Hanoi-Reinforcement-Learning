import type { RLUpdate } from "../features/playground/PlayGround";
import { stateKeyToNodeId } from "../features/playground/PlayGround";
import { publishRLUpdate, resetSignalAtom, rlStore } from "../state/rlAtoms";

/**
 * Helper class for RL algorithms to easily stream updates to LearnFlow component
 * Now publishes to Jotai atoms rather than using window globals
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
   * Stream a node value update to the UI via atom event
   */
  streamUpdate(
    nodeId: string,
    value: number,
    reward?: number,
    action?: string,
    extra?: {
      stateKey?: string;
      nextStateKey?: string;
      currentQ?: number;
      maxNextQ?: number;
      target?: number;
      newQ?: number;
      alpha?: number;
      gamma?: number;
    },
  ): void {
    const update: RLUpdate = {
      nodeId: stateKeyToNodeId[nodeId],
      value: Number(value.toFixed(2)),
      timestamp: Date.now(),
      episode: this.episodeCount,
      step: this.stepCount,
      reward,
      action,
      stateKey: extra?.stateKey,
      nextStateKey: extra?.nextStateKey,
      currentQ: extra?.currentQ,
      maxNextQ: extra?.maxNextQ,
      target: extra?.target,
      newQ: extra?.newQ,
      alpha: extra?.alpha,
      gamma: extra?.gamma,
    };

    publishRLUpdate(update);
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
   * Reset all counters and signal UI reset
   */
  reset(): void {
    this.episodeCount = 0;
    this.stepCount = 0;
    this.totalReward = 0;
    rlStore.set(resetSignalAtom, (prev) => (prev ?? 0) + 1);
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
