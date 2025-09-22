import { ReactFlow, Background, Controls, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TextUpdaterNode } from './TextUpdaterNode';
import { TowerStateNode } from './TowerStateNode';
import { useEffect, useState, useCallback } from 'react';
import { edges, initialNodes } from './initNode';



const nodeTypes = {
  textUpdater: TextUpdaterNode,
  towerOfHanoi: TowerStateNode,
};

export default function LearnFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Update sequence: [nodeId, value, nodeId, value, ...]
  const updateSequence = [1, 0, 2, 1, 1, 2, 2, 3];

  const updateNode = useCallback((nodeId: string, value: number) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              value: value,
              background: 'lightgreen', // Green background during update
            },
          };
        }
        return node;
      }) as typeof nds
    );
  }, [setNodes]);

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
            fontSize: '14px',
            marginRight: '10px'
          }}
        >
          {isRunning ? `Running... Step ${currentStep}/4` : 'Run Sequence'}
        </button>
        <span style={{ fontSize: '14px', color: '#333' }}>
          Sequence: [4→0, 5→1, 4→2, 5→3]
        </span>
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