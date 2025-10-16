import { ReactFlow, Background, Controls, useNodesState, useEdgesState } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TowerStateNode } from "./TowerStateNode";
import { useEffect, useState, useCallback, useRef } from "react";
import { edges as initialEdges, initialNodes } from "./initNode";
import { Action, keyOf, type State } from "../../features/hanoi/rl";
import { mockTDLearning } from "../../reinforcement/mockTDLearning";
import LearningProgressChart, {
  type EpisodeData,
} from "./LearningProgressChart";
import { useAtomValue } from "jotai";
import {
  rlUpdateEventAtom,
  episodeEventAtom,
  resetSignalAtom,
} from "../../state/rlAtoms";

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

// Helper function to map state-action pairs to edge IDs
function getEdgeIdForAction(sourceNodeId: string, action: Action): string | null {
  // Get the source state from the node
  const sourceNode = initialNodes.find(node => node.id === sourceNodeId);
  if (!sourceNode) return null;
  
  // Parse the state from stateKey (format: "d0|d1|d2")
  const stateKey = sourceNode.data.stateKey;
  const state: State = stateKey.split('|').map(Number) as State;
  
  // Apply the action to get the next state
  const nextState = [...state];
  nextState[action.diskNum] = action.to;
  const nextStateKey = keyOf(nextState);
  
  // Find the target node ID
  const targetNodeId = stateKeyToNodeId[nextStateKey];
  if (!targetNodeId) return null;
  
  // Return the edge ID in the format "e{sourceId}-{targetId}"
  return `e${sourceNodeId}-${targetNodeId}`;
}

type RLStat = {
  totalUpdates: number;
  currentEpisode: number;
  lastReward: number;
  averageReward: number;
  step: number;
};

// try rebuild
export default function PlayGround({ onRLUpdate, config }: RLStreamProps = {}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  
  // Initialize edges with default styling
  const initialEdgesWithStyle = initialEdges.map(edge => ({
    ...edge,
    style: { strokeWidth: 2, stroke: '#94a3b8', markerEnd: 'url(#arrowhead-normal)' }, // Default non-optimal style
  }));
  
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdgesWithStyle);
  const [rlStats, setRlStats] = useState<RLStat>({
    totalUpdates: 0,
    currentEpisode: 0,
    lastReward: 0,
    averageReward: 0,
    step: 0,
  });
  const [episodeData, setEpisodeData] = useState<EpisodeData[]>([]);
  const [maxEpisodes, setMaxEpisodes] = useState<number>(100);
  const [speedMs, setSpeedMs] = useState<number>(100); // Default speed in milliseconds

  // Refs for managing streaming
  const updateQueueRef = useRef<RLUpdate[]>([]);
  const processingRef = useRef(false);
  const highlightTimeoutsRef = useRef<Map<string, number>>(new Map());
  const processRLUpdateRef = useRef<(update: RLUpdate) => void>(() => {});

  // Atoms
  const latestUpdate = useAtomValue(rlUpdateEventAtom);
  const latestEpisodeEvent = useAtomValue(episodeEventAtom);
  const resetSignal = useAtomValue(resetSignalAtom);

  // Configuration with defaults
  const streamConfig: Required<RLStreamConfig> = {
    updateInterval: config?.updateInterval ?? 100, // 100ms default
    highlightDuration: config?.highlightDuration ?? 500, // 500ms default
    autoReset: config?.autoReset ?? false,
  };

  // Style constants for edge highlighting
  const EDGE_STYLES = {
    bestAction: { 
      strokeWidth: 3, 
      stroke: '#C82909',
      markerEnd: 'url(#arrowhead-best)'
    }, // bright green with arrow
    nonOptimal: { 
      strokeWidth: 2, 
      stroke: '#94a3b8',
      markerEnd: 'url(#arrowhead-normal)'
    }, // gray with arrow
  };

  // Function to update edge highlighting based on optimal policy
  const updateEdgeHighlighting = useCallback(() => {
    const bestActions = mockTDLearning.getAllBestActions();
    const bestEdgeIds = new Set<string>();
    
    // Find all edge IDs that represent best actions
    initialNodes.forEach(node => {
      const stateKey = node.data.stateKey;
      const bestAction = bestActions.get(stateKey);
      
      if (bestAction) {
        const edgeId = getEdgeIdForAction(node.id, bestAction);
        if (edgeId) {
          bestEdgeIds.add(edgeId);
        }
      }
    });
    
    // Update edge styles
    setEdges(edges => 
      edges.map(edge => ({
        ...edge,
        style: bestEdgeIds.has(edge.id) 
          ? EDGE_STYLES.bestAction 
          : EDGE_STYLES.nonOptimal,
      }))
    );
  }, []);

  // Initialize edge highlighting on component mount
  useEffect(() => {
    updateEdgeHighlighting();
  }, [updateEdgeHighlighting]);

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
    [], // Remove setNodes dependency
  );

  // Process a single RL update
  const processRLUpdate = useCallback(
    (update: RLUpdate) => {
      // Update the node
      updateNode(update.nodeId, update.value, true);

      setRlStats((prev) => {
        const newTotal = prev.totalUpdates + 1;
        const reward = update.reward ?? prev.lastReward;

        // Update edge highlighting periodically during training (every 10 updates)
        if (newTotal % 10 === 0) {
          setTimeout(() => updateEdgeHighlighting(), 0);
        }

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
    [onRLUpdate, updateEdgeHighlighting], // Add updateEdgeHighlighting as dependency
  );

  // Store the function reference in ref to avoid dependency issues
  processRLUpdateRef.current = processRLUpdate;

  // Process the update queue
  const processUpdateQueue = useCallback(async () => {
    if (processingRef.current || updateQueueRef.current.length === 0) {
      return;
    }

    processingRef.current = true;

    while (updateQueueRef.current.length > 0) {
      const update = updateQueueRef.current.shift();
      if (update && processRLUpdateRef.current) {
        processRLUpdateRef.current(update);

        // Wait for the configured interval
        if (updateQueueRef.current.length > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, streamConfig.updateInterval),
          );
        }
      }
    }

    processingRef.current = false;
  }, [streamConfig.updateInterval]);

  // When a new atom-based update arrives, enqueue it
  useEffect(() => {
    if (!latestUpdate) return;
    updateQueueRef.current.push(latestUpdate.update);
    if (!processingRef.current) {
      processUpdateQueue();
    }
  }, [latestUpdate]); // Remove processUpdateQueue from dependencies

  // When a new episode event arrives, append to chart
  useEffect(() => {
    if (!latestEpisodeEvent) return;
    setEpisodeData((prev) => [
      ...prev,
      {
        episode: latestEpisodeEvent.event.episode,
        reward: latestEpisodeEvent.event.reward,
        epsilon: latestEpisodeEvent.event.epsilon,
      },
    ]);
    
    // Update edge highlighting after each episode
    setTimeout(() => updateEdgeHighlighting(), 0);
  }, [latestEpisodeEvent]);

  // React to reset signal
  useEffect(() => {
    if (!resetSignal) return;
    resetNodeColors();
    setNodes((prev) =>
      prev.map((node) => ({
        ...node,
        data: { ...node.data, value: 0, currentState: false },
      })),
    );
    resetStats();
    
    // Reset edge highlighting to default styles
    setEdges(edges => 
      edges.map(edge => ({
        ...edge,
        style: EDGE_STYLES.nonOptimal,
      }))
    );
  }, [resetSignal]); // Remove setNodes from dependencies

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
  }, []); // Remove setNodes dependency

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
    mockTDLearning.startLearning(episodes, speedMs);
  }, [speedMs]);

  // Enhanced reset function that also resets the chart
  const handleReset = useCallback(() => {
    mockTDLearning.reset();
    resetStats();
  }, [resetStats]);

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
          
          {/* Speed Control */}
          <div style={{ marginBottom: "10px" }}>
            <div style={{ 
              fontSize: "12px", 
              marginBottom: "5px",
              fontWeight: "500"
            }}>
              Speed Control: {speedMs}ms
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              value={speedMs}
              onChange={(e) => setSpeedMs(Number(e.target.value))}
              style={{
                width: "100%",
                height: "6px",
                borderRadius: "3px",
                background: "#ddd",
                outline: "none",
                cursor: "pointer",
              }}
            />
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              fontSize: "10px", 
              color: "#666",
              marginTop: "2px"
            }}>
              <span>Fast (50ms)</span>
              <span>Slow (1000ms)</span>
            </div>
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
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Background />
          <Controls />
          {/* SVG markers for arrows */}
          <svg>
            <defs>
              <marker
                id="arrowhead-best"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#C82909"
                />
              </marker>
              <marker
                id="arrowhead-normal"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#94a3b8"
                />
              </marker>
            </defs>
          </svg>
        </ReactFlow>
      </div>
    </div>
  );
}
