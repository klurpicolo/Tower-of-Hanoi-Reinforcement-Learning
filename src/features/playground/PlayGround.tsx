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
import { Table, Paper } from "@mantine/core";

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
  totalEpisodes: number;
  totalEpisodeReward: number;
  currentEpisodeReward: number;
  lastEpisodeReward: number;
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
    totalEpisodes: 0,
    totalEpisodeReward: 0,
    currentEpisodeReward: 0,
    lastEpisodeReward: 0,
  });
  const [episodeData, setEpisodeData] = useState<EpisodeData[]>([]);
  const [maxEpisodes, setMaxEpisodes] = useState<number>(50);
  const [speedMs, setSpeedMs] = useState<number>(100); // Default speed in milliseconds
  const [isLearning, setIsLearning] = useState<boolean>(false);

  // Refs for managing streaming
  const updateQueueRef = useRef<RLUpdate[]>([]);
  const processingRef = useRef(false);
  const highlightTimeoutsRef = useRef<Map<string, number>>(new Map());
  const processRLUpdateRef = useRef<(update: RLUpdate) => void>(() => {});

  // Atoms
  const latestUpdate = useAtomValue(rlUpdateEventAtom);
  const latestEpisodeEvent = useAtomValue(episodeEventAtom);
  const resetSignal = useAtomValue(resetSignalAtom);

  // Monitor learning state changes
  useEffect(() => {
    const checkLearningState = () => {
      if (isLearning && !mockTDLearning.getIsRunning()) {
        setIsLearning(false);
      }
    };
    
    const interval = setInterval(checkLearningState, 1000); // Check every second
    return () => clearInterval(interval);
  }, [isLearning]);

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
        const currentEpisode = update.episode ?? prev.currentEpisode;
        
        // Check if we're starting a new episode
        const isNewEpisode = currentEpisode !== prev.currentEpisode;
        
        // Update current episode cumulative reward
        const newCurrentEpisodeReward = isNewEpisode 
          ? reward  // Start with current reward for new episode
          : prev.currentEpisodeReward + reward;  // Add to existing cumulative reward

        // Update edge highlighting periodically during training (every 10 updates)
        if (newTotal % 10 === 0) {
          setTimeout(() => updateEdgeHighlighting(), 0);
        }

        return {
          totalUpdates: newTotal,
          currentEpisode: currentEpisode,
          lastReward: prev.lastEpisodeReward, // Keep last episode reward
          step: update.step ?? prev.step,
          averageReward: prev.averageReward, // Keep existing average reward (updated per episode)
          totalEpisodes: prev.totalEpisodes,
          totalEpisodeReward: prev.totalEpisodeReward,
          currentEpisodeReward: newCurrentEpisodeReward,
          lastEpisodeReward: prev.lastEpisodeReward,
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

  // When a new episode event arrives, append to chart and update average reward
  useEffect(() => {
    if (!latestEpisodeEvent) return;
    const episodeReward = latestEpisodeEvent.event.reward;
    
    setEpisodeData((prev) => [
      ...prev,
      {
        episode: latestEpisodeEvent.event.episode,
        reward: episodeReward,
        epsilon: latestEpisodeEvent.event.epsilon,
      },
    ]);
    
    // Update average reward per episode and set last episode reward
    setRlStats((prev) => {
      const newTotalEpisodes = prev.totalEpisodes + 1;
      const newTotalEpisodeReward = prev.totalEpisodeReward + episodeReward;
      const newAverageReward = newTotalEpisodeReward / newTotalEpisodes;
      
      return {
        ...prev,
        totalEpisodes: newTotalEpisodes,
        totalEpisodeReward: newTotalEpisodeReward,
        averageReward: newAverageReward,
        lastEpisodeReward: episodeReward, // Set the completed episode's reward
        lastReward: episodeReward, // Update last reward to show last episode reward
        currentEpisode: latestEpisodeEvent.event.episode, // Update current episode to the completed episode
      };
    });
    
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
      totalEpisodes: 0,
      totalEpisodeReward: 0,
      currentEpisodeReward: 0,
      lastEpisodeReward: 0,
    });
    setEpisodeData([]);
    setMaxEpisodes(100);
  }, []);

  // Start/Stop/Resume learning function
  const handleStartStopLearning = useCallback(() => {
    if (isLearning) {
      // Currently learning, so stop it
      mockTDLearning.stopLearning();
      setIsLearning(false);
    } else {
      // Not learning, so start/resume it
      setMaxEpisodes(maxEpisodes);
      mockTDLearning.startLearning(maxEpisodes, speedMs);
      setIsLearning(true);
    }
  }, [isLearning, maxEpisodes, speedMs]);

  // Enhanced reset function that also resets the chart
  const handleReset = useCallback(() => {
    mockTDLearning.reset();
    resetStats();
    setIsLearning(false);
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
               disabled={isLearning}
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
           <div style={{ marginBottom: "10px" }}>
             <div style={{ 
               fontSize: "12px", 
               marginBottom: "5px",
               fontWeight: "500"
             }}>
               Episodes: {maxEpisodes}
             </div>
             <input
               type="range"
               min="10"
               max="100"
               step="10"
               value={maxEpisodes}
               onChange={(e) => setMaxEpisodes(Number(e.target.value))}
               disabled={isLearning}
               style={{
                 width: "100%",
                 height: "6px",
                 borderRadius: "3px",
                 background: isLearning ? "#ccc" : "#ddd",
                 outline: "none",
                 cursor: isLearning ? "not-allowed" : "pointer",
                 opacity: isLearning ? 0.6 : 1,
               }}
             />
             <div style={{ 
               display: "flex", 
               justifyContent: "space-between", 
               fontSize: "10px", 
               color: "#666",
               marginTop: "2px"
             }}>
               <span>10</span>
               <span>100</span>
             </div>
           </div>

          {/* Stats Table */}
          <Paper shadow="sm" p="ms" mt="ms">
            <Table striped highlightOnHover>
              
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td>Episode</Table.Td>
                  <Table.Td><strong>{rlStats.currentEpisode}</strong></Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Step</Table.Td>
                  <Table.Td><strong>{rlStats.step}</strong></Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Last Episode Reward</Table.Td>
                  <Table.Td><strong>{rlStats.lastReward.toFixed(2)}</strong></Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Current Episode Reward</Table.Td>
                  <Table.Td><strong>{rlStats.currentEpisodeReward.toFixed(2)}</strong></Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Average Reward</Table.Td>
                  <Table.Td><strong>{rlStats.averageReward.toFixed(2)}</strong></Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Paper>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={handleStartStopLearning}
              style={{
                padding: "8px 12px",
                backgroundColor: isLearning ? "#e74c3c" : "#27ae60",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                flex: 1,
                minWidth: "120px",
              }}
            >
              {isLearning ? "Stop Learning" : "Start Learning"}
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
                flex: 1,
                minWidth: "80px",
              }}
            >
              Reset
            </button>
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
