import { ReactFlow, Background, Controls, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TextUpdaterNode } from './TextUpdaterNode';
import { TowerStateNode } from './TowerStateNode';
import { useEffect, useState } from 'react';

const initialNodes = [
  { 
    id: '4', 
    position: { x: 300, y: 0 }, 
    data: { 
      label: 'Node 4',
      value: 0, 
      peg1: [0,1,2], 
      peg2: [], 
      peg3: [] 
    }, 
    type: 'towerOfHanoi'
  },
  { 
    id: '5', 
    position: { x: 300, y: 400 }, 
    data: { 
      label: 'Node 5',
      value: 2, 
      peg1: [], 
      peg2: [], 
      peg3: [0,1,2] 
    }, 
    type: 'towerOfHanoi'
  }
];

const edges = [
  { id: 'e1-2', source: '4', target: '5' },
  // Add your edges here if needed
];

const nodeTypes = {
  textUpdater: TextUpdaterNode,
  towerOfHanoi: TowerStateNode,
};

export default function LearnFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  const [mockStateValue, setMockStateValue] = useState(0);


  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === '4') {
          // Type-safe update: preserve the correct peg types for node 4
          return {
            ...node,
            data: {
              ...node.data,
              value: mockStateValue,
              // Ensure peg1, peg2, peg3 types are preserved
              // peg1: Array.isArray(node.data.peg1) ? node.data.peg1 : [],
              // peg2: Array.isArray(node.data.peg2) ? node.data.peg2 : [],
              // peg3: Array.isArray(node.data.peg3) ? node.data.peg3 : [],
            },
          };
        }
        return node;
      }) as typeof nds
    );
  }, [mockStateValue, setNodes]);

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
        <button 
          onClick={() => setMockStateValue(mockStateValue + 1)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0078ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Update Tower Value
        </button>
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