import { ReactFlow, Background, Controls, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TextUpdaterNode } from './TextUpdaterNode';
import { TowerStateNode, type TowerStateNode as TowerStateNodeType } from './TowerStateNode';
import { useEffect, useState, useCallback, useRef } from 'react';
import { edges, initialNodes } from './initNode';
import { mockTDLearning } from '../../../reinforcement/mockTDLearning';

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

export default function LearnFlow({ onRLUpdate, config }: RLStreamProps = {}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [rlStats, setRlStats] = useState({
    totalUpdates: 0,
    currentEpisode: 0,
    lastReward: 0,
    averageReward: 0
  });
  
  // Refs for managing streaming
  const updateQueueRef = useRef<RLUpdate[]>([]);
  const processingRef = useRef(false);
  const highlightTimeoutsRef = useRef<Map<string, number>>(new Map());
  
  // Configuration with defaults
  const streamConfig: Required<RLStreamConfig> = {
    updateInterval: config?.updateInterval ?? 100, // 100ms default
    highlightDuration: config?.highlightDuration ?? 500, // 500ms default
    autoReset: config?.autoReset ?? true
  };

  // Update sequence: [nodeId, value, nodeId, value, ...] - kept for demo purposes
  const updateSequence = [1, 0, 2, 1, 1, 2, 2, 3];

  // Enhanced updateNode function for RL streaming
  const updateNode = useCallback((nodeId: string, value: number, highlight: boolean = true) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              value: value,
              background: highlight ? 'lightgreen' : (node.data as TowerStateNodeType['data']).background || 'white',
            },
          };
        }
        return node;
      }) as typeof nds
    );
  }, [setNodes]);

  // Process a single RL update
  const processRLUpdate = useCallback((update: RLUpdate) => {
    // Update the node
    updateNode(update.nodeId, update.value, true);
    
    // Update RL statistics
    setRlStats(prev => ({
      totalUpdates: prev.totalUpdates + 1,
      currentEpisode: update.episode ?? prev.currentEpisode,
      lastReward: update.reward ?? prev.lastReward,
      averageReward: update.reward ? 
        (prev.averageReward * (prev.totalUpdates - 1) + update.reward) / prev.totalUpdates :
        prev.averageReward
    }));

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
  }, [updateNode, streamConfig, onRLUpdate]);

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
          await new Promise(resolve => setTimeout(resolve, streamConfig.updateInterval));
        }
      }
    }

    processingRef.current = false;
  }, [processRLUpdate, streamConfig.updateInterval]);

  // Public method to add RL updates to the stream
  const addRLUpdate = useCallback((update: RLUpdate) => {
    updateQueueRef.current.push({
      ...update,
      timestamp: update.timestamp || Date.now()
    });
    
    // Start processing if not already running
    if (!processingRef.current) {
      processUpdateQueue();
    }
  }, [processUpdateQueue]);

  // Expose the addRLUpdate method globally for RL algorithm access
  useEffect(() => {
    (window as any).addRLUpdate = addRLUpdate;
    return () => {
      delete (window as any).addRLUpdate;
    };
  }, [addRLUpdate]);

  const resetNodeColors = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          background: 'white', // Reset to white
        },
      })) as typeof nds
    );
  }, [setNodes]);

  const runSequence = useCallback(async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setCurrentStep(0);
    resetNodeColors();

    for (let i = 0; i < updateSequence.length; i += 2) {
      const nodeId = updateSequence[i].toString();
      const value = updateSequence[i + 1];
      
      setCurrentStep(i / 2 + 1);
      
      // Reset all nodes to white first
      resetNodeColors();
      
      // Then update the current node with green background
      updateNode(nodeId, value);
      
      // Wait for 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Reset all nodes to white at the end
    resetNodeColors();
    setIsRunning(false);
  }, [isRunning, updateNode, resetNodeColors]);

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Demo Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={runSequence}
              disabled={isRunning}
              style={{
                padding: '8px 16px',
                backgroundColor: isRunning ? '#ccc' : '#0078ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {isRunning ? `Running... Step ${currentStep}/4` : 'Run Demo Sequence'}
            </button>
            <span style={{ fontSize: '14px', color: '#333' }}>
              Demo: [4→0, 5→1, 4→2, 5→3]
            </span>
          </div>

          {/* RL Statistics */}
          <div style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
            padding: '10px', 
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '12px',
            minWidth: '300px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>RL Learning Statistics</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
              <div>Total Updates: <strong>{rlStats.totalUpdates}</strong></div>
              <div>Episode: <strong>{rlStats.currentEpisode}</strong></div>
              <div>Last Reward: <strong>{rlStats.lastReward.toFixed(3)}</strong></div>
              <div>Avg Reward: <strong>{rlStats.averageReward.toFixed(3)}</strong></div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>
              Queue Size: {updateQueueRef.current.length} | 
              Processing: {processingRef.current ? 'Yes' : 'No'}
            </div>
          </div>

          {/* RL Controls */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={() => mockTDLearning.startLearning(50, 300)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Start TD Learning
            </button>
            <button 
              onClick={() => mockTDLearning.stopLearning()}
              style={{
                padding: '6px 12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Stop Learning
            </button>
            <button 
              onClick={() => mockTDLearning.reset()}
              style={{
                padding: '6px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Reset
            </button>
          </div>

          {/* RL Integration Instructions */}
          <div style={{ 
            backgroundColor: 'rgba(240, 248, 255, 0.9)', 
            padding: '8px', 
            borderRadius: '4px',
            border: '1px solid #b0d4f1',
            fontSize: '11px',
            maxWidth: '400px'
          }}>
            <strong>RL Integration:</strong> Use <code>window.addRLUpdate(update)</code> to stream updates.
            <br />
            <code>update = {`{nodeId: '1', value: 0.5, episode: 1, reward: 0.1}`}</code>
            <br />
            <strong>Console:</strong> <code>startTDLearning(episodes, delay)</code>
          </div>
        </div>
      </div>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}