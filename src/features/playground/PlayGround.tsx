import { ReactFlow, Background, Controls, useNodesState } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TextUpdaterNode } from "./TextUpdaterNode";
import {
  TowerStateNode,
  type TowerStateNode as TowerStateNodeType,
} from "./TowerStateNode";
import { useEffect, useState, useCallback, useRef } from "react";
import { edges, initialNodes } from "./initNode";
import { mockTDLearning } from "../../reinforcement/mockTDLearning";

// Types for RL streaming data
export interface RLUpdate {
  nodeId: string;
  value: number;
  timestamp: number;
  episode?: number;
  step?: number;
  reward?: number;
  action?: string;
}

export interface RLStreamConfig {
  updateInterval?: number; // milliseconds between updates
  highlightDuration?: number; // how long to highlight updated nodes
  autoReset?: boolean; // whether to auto-reset highlights
}

export interface RLStreamProps {
  onRLUpdate?: (update: RLUpdate) => void;
  config?: RLStreamConfig;
}

const nodeTypes = {
  textUpdater: TextUpdaterNode,
  towerOfHanoi: TowerStateNode,
};

export const stateKeyToNodeId: Record<string, string> = {};

initialNodes.forEach((node) => {
  const key = node.data.stateKey;
  if (key) stateKeyToNodeId[key] = node.id;
});

export default function PlayGround({ onRLUpdate, config }: RLStreamProps = {}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [rlStats, setRlStats] = useState({
    totalUpdates: 0,
    currentEpisode: 0,
    lastReward: 0,
    averageReward: 0,
    step: 0,
  });

  // Refs for managing streaming
  const updateQueueRef = useRef<RLUpdate[]>([]);
  const processingRef = useRef(false);
  const highlightTimeoutsRef = useRef<Map<string, number>>(new Map());

  // Configuration with defaults
  const streamConfig: Required<RLStreamConfig> = {
    updateInterval: config?.updateInterval ?? 100, // 100ms default
    highlightDuration: config?.highlightDuration ?? 500, // 500ms default
    autoReset: config?.autoReset ?? false,
  };

  // --------------------------
  // Update node value and highlight
  // --------------------------
  // Enhanced updateNode function for RL streaming
  const updateNode = useCallback(
    (nodeId: string, value: number, highlight: boolean = true) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            // Normalize value to 0–1
            const normalized = Math.min(Math.max(value / 5, 0), 1); // adjust max value

            // Map to green shade (higher value → darker green)
            // Light green: rgb(240, 255, 232)
            // Darker green: rgb(26, 186, 26)
            const r = Math.floor(235 - 209 * normalized);
            const g = Math.floor(255 - 49 * normalized);
            const b = Math.floor(235 - 209 * normalized);
            const bgColor = `rgb(${r}, ${g}, ${b})`;

            return {
              ...node,
              data: {
                ...node.data,
                value,
                background: highlight
                  ? bgColor
                  : (node.data as any).background || "#fff",
                currentState: true,
              },
            };
          }
          return {
            ...node,
            data: {
              ...node.data,
              currentState: false,
            },
          };
        }),
      );
    },
    [setNodes],
  );

  // Process a single RL update
  const processRLUpdate = useCallback(
    (update: RLUpdate) => {
      // Update the node
      updateNode(update.nodeId, update.value, true);

      setRlStats((prev) => {
        const newTotal = prev.totalUpdates + 1;
        const reward = update.reward ?? prev.lastReward;

        return {
          totalUpdates: newTotal,
          currentEpisode: update.episode ?? prev.currentEpisode,
          lastReward: reward,
          step: update.step,
          averageReward:
            newTotal > 1
              ? (prev.averageReward * (newTotal - 1) + reward) / newTotal
              : reward,
        };
      });

      // Clear existing highlight timeout for this node
      const existingTimeout = highlightTimeoutsRef.current.get(update.nodeId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new highlight timeout if auto-reset is enabled
      if (streamConfig.autoReset) {
        const timeout = setTimeout(() => {
          updateNode(update.nodeId, update.value, false);
          highlightTimeoutsRef.current.delete(update.nodeId);
        }, streamConfig.highlightDuration);

        highlightTimeoutsRef.current.set(update.nodeId, timeout);
      }

      // Call the optional callback
      onRLUpdate?.(update);
    },
    [updateNode, streamConfig, onRLUpdate],
  );

  // Process the update queue
  const processUpdateQueue = useCallback(async () => {
    if (processingRef.current || updateQueueRef.current.length === 0) {
      return;
    }

    processingRef.current = true;

    while (updateQueueRef.current.length > 0) {
      const update = updateQueueRef.current.shift();
      if (update) {
        processRLUpdate(update);

        // Wait for the configured interval
        if (updateQueueRef.current.length > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, streamConfig.updateInterval),
          );
        }
      }
    }

    processingRef.current = false;
  }, [processRLUpdate, streamConfig.updateInterval]);

  // Public method to add RL updates to the stream
  const addRLUpdate = useCallback(
    (update: RLUpdate) => {
      updateQueueRef.current.push({
        ...update,
        timestamp: update.timestamp || Date.now(),
      });

      // Start processing if not already running
      if (!processingRef.current) {
        processUpdateQueue();
      }
    },
    [processUpdateQueue],
  );

  // Expose the addRLUpdate method globally for RL algorithm access
  useEffect(() => {
    (window as any).addRLUpdate = addRLUpdate;
    return () => {
      delete (window as any).addRLUpdate;
    };
  }, [addRLUpdate]);

  const resetNodeColors = useCallback(() => {
    setNodes(
      (nds) =>
        nds.map((node) => ({
          ...node,
          data: {
            ...node.data,
            background: "white", // Reset to white
          },
        })) as typeof nds,
    );
  }, [setNodes]);

  // --------------------------
  // Demo sequence
  // --------------------------
  const updateSequence = [1, 0, 2, 1, 3, 1, 4, 2, 5, 3, 6, 4, 7, 5]; // Example sequence
  const testStateKey = ["0|0|0", "1|0|0"];
  const runSequence = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);
    setCurrentStep(0);
    resetNodeColors();

    for (let i = 0; i < testStateKey.length; i += 1) {
      const nodeId = stateKeyToNodeId[testStateKey[i].toString()];
      const value = 0; //updateSequence[i + 1];
      setCurrentStep(i / 2 + 1);
      addRLUpdate({ nodeId, value, timestamp: Date.now() });

      // Reset all nodes to white first
      resetNodeColors();

      // Then update the current node with green background
      updateNode(nodeId, value);

      // Wait for 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Reset all nodes to white at the end
    resetNodeColors();
    setIsRunning(false);
  }, [isRunning, updateNode, resetNodeColors]);

  const logNodePositions = useCallback(() => {
    nodes.forEach((node) => {
      console.log(
        `Node ID: ${node.data.stateKey}, X: ${node.position.x}, Y: ${node.position.y}`,
      );
    });
  }, [nodes]);

  const resetStats = useCallback(() => {
    setRlStats({
      totalUpdates: 0,
      currentEpisode: 0,
      lastReward: 0,
      averageReward: 0,
      step: 0,
    });
  }, []);

  useEffect(() => {
    (window as any).resetAllNodes = () => {
      resetNodeColors();
      setNodes((prev) =>
        prev.map((node) => ({
          ...node,
          data: { ...node.data, value: 0, currentState: false },
        })),
      );

      resetStats();
    };
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar for buttons */}
      <div
        style={{
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          padding: "10px",
          background: "#f9f9f9",
          borderBottom: "1px solid #ddd",
          zIndex: 10,
        }}
      >
        {/* <button onClick={runSequence} disabled={isRunning}>
      {isRunning ? `Running... Step ${currentStep}` : 'Run Demo Sequence'}
    </button> */}

        {/* <button onClick={logNodePositions}>Log Node Positions</button> */}
        <button onClick={() => mockTDLearning.startLearning(50, 50)}>
          Start TD Learning
        </button>
        <button onClick={() => mockTDLearning.stopLearning()}>
          Stop Learning
        </button>
        <button onClick={() => mockTDLearning.reset()}>Reset</button>
      </div>
      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "10px",
          fontSize: "14px",
          alignItems: "center",
          background: "#f9f9f9",
          borderBottom: "1px solid #ddd",
        }}
      >
        <div>
          Episode: <strong>{rlStats.currentEpisode}</strong>
        </div>
        <div>
          Step: <strong>{rlStats.step}</strong>
        </div>
        <div>
          Last Reward: <strong>{rlStats.lastReward.toFixed(2)}</strong>
        </div>
        <div>
          Avg Reward: <strong>{rlStats.averageReward.toFixed(2)}</strong>
        </div>
      </div>
      {/* ReactFlow canvas below */}
      <div style={{ flexGrow: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          fitView
          defaultEdgeOptions={{
            style: { strokeWidth: 3, stroke: "#333" },
          }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
