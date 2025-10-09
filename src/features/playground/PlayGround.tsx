import { ReactFlow, Background, Controls, useNodesState } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TowerStateNode } from "./TowerStateNode";
import { useEffect, useState, useCallback, useRef } from "react";
import { edges, initialNodes } from "./initNode";
import { mockTDLearning } from "../../reinforcement/mockTDLearning";
import LearningProgressChart, {
  type EpisodeData,
} from "./LearningProgressChart";

function valueToRGB(value: number): string {
  const normalized = Math.min(Math.max(value / 5, 0), 1); // adjust max value

  // Map to green shade (higher value → darker green)
  // Light green: rgb(13, 21, 9)
  // Darker green: rgb(26, 186, 26)
  const r = Math.floor(235 - 209 * normalized);
  const g = Math.floor(255 - 49 * normalized);
  const b = Math.floor(235 - 209 * normalized);
  return `rgb(${r}, ${g}, ${b})`;
}

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
  towerOfHanoi: TowerStateNode,
};

export const stateKeyToNodeId: Record<string, string> = {};

initialNodes.forEach((node) => {
  const key = node.data.stateKey;
  if (key) stateKeyToNodeId[key] = node.id;
});

type RLStat = {
  totalUpdates: number;
  currentEpisode: number;
  lastReward: number;
  averageReward: number;
  step: number;
};

export default function PlayGround({ onRLUpdate, config }: RLStreamProps = {}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [rlStats, setRlStats] = useState<RLStat>({
    totalUpdates: 0,
    currentEpisode: 0,
    lastReward: 0,
    averageReward: 0,
    step: 0,
  });
  const [episodeData, setEpisodeData] = useState<EpisodeData[]>([]);
  const [maxEpisodes, setMaxEpisodes] = useState<number>(100);

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
            const bgColor = valueToRGB(value);

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
          step: update.step ?? prev.step,
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

  // Function to add episode data (will be called by MockTDLearning)
  const addEpisodeData = useCallback(
    (episode: number, reward: number, epsilon: number) => {
      setEpisodeData((prev) => [...prev, { episode, reward, epsilon }]);
    },
    [],
  );

  // Expose the addRLUpdate method globally for RL algorithm access
  useEffect(() => {
    (window as any).addRLUpdate = addRLUpdate;
    (window as any).addEpisodeData = addEpisodeData;
    return () => {
      delete (window as any).addRLUpdate;
      delete (window as any).addEpisodeData;
    };
  }, [addRLUpdate, addEpisodeData]);

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

  const resetStats = useCallback(() => {
    setRlStats({
      totalUpdates: 0,
      currentEpisode: 0,
      lastReward: 0,
      averageReward: 0,
      step: 0,
    });
    setEpisodeData([]);
    setMaxEpisodes(100);
  }, []);

  // Start learning function that sets max episodes
  const handleStartLearning = useCallback((episodes: number = 50) => {
    setMaxEpisodes(episodes);
    mockTDLearning.startLearning(episodes, 50);
  }, []);

  // Enhanced reset function that also resets the chart
  const handleReset = useCallback(() => {
    mockTDLearning.reset();
    resetStats();
  }, [resetStats]);

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
      {/* Top Section with Controls and Chart Space */}
      <div
        style={{
          display: "flex",
          background: "#f9f9f9",
          borderBottom: "1px solid #ddd",
          zIndex: 10,
          minHeight: "200px",
        }}
      >
        {/* Left Side - Controls */}
        <div
          style={{
            flex: "0 0 300px",
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            borderRight: "1px solid #ddd",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              fontSize: "16px",
              marginBottom: "5px",
            }}
          >
            TD Learning Controls
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => handleStartLearning(50)}
              style={{
                padding: "8px 12px",
                backgroundColor: "#80A1BA",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Start TD Learning
            </button>
            <button
              onClick={() => mockTDLearning.stopLearning()}
              style={{
                padding: "8px 12px",
                backgroundColor: "#80A1BA",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Stop Learning
            </button>
            <button
              onClick={handleReset}
              style={{
                padding: "8px 12px",
                backgroundColor: "#91C4C3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Reset
            </button>
          </div>

          {/* Stats in Left Panel */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              fontSize: "12px",
              marginTop: "10px",
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
        </div>

        {/* Right Side - Chart Space */}
        <div
          style={{
            flex: 1,
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#fafafa",
          }}
        >
          <div style={{ height: "100%" }}>
            <LearningProgressChart
              data={episodeData}
              maxEpisodes={maxEpisodes}
            />
          </div>
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
