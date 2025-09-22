export const initialNodes = [
    { 
      id: '1', 
      position: { x: 150, y: 0 }, 
      data: { 
        label: 'Node 1',
        value: 0, 
        peg1: [0,1,2], 
        peg2: [], 
        peg3: [] 
      }, 
      type: 'towerOfHanoi'
    },
    { 
      id: '2', 
      position: { x: 0, y: 200 }, 
      data: { 
        label: 'Node 2',
        value: 0, 
        peg1: [1,2], 
        peg2: [], 
        peg3: [0] 
      }, 
      type: 'towerOfHanoi'
    },
    { 
        id: '3', 
        position: { x: 300, y: 200 }, 
        data: { 
          label: 'Node 3',
          value: 0, 
          peg1: [1,2], 
          peg2: [0], 
          peg3: [] 
        }, 
        type: 'towerOfHanoi'
    },
    { 
        id: '4', 
        position: { x: 600, y: 200 }, 
        data: { 
          label: 'Node 4',
          value: 0, 
          peg1: [2], 
          peg2: [0], 
          peg3: [1] 
        }, 
        type: 'towerOfHanoi'
    },
    { 
        id: '5', 
        position: { x: 900, y: 200 }, 
        data: { 
          label: 'Node 5',
          value: 0, 
          peg1: [2], 
          peg2: [1], 
          peg3: [0] 
        }, 
        type: 'towerOfHanoi'
    },
    { 
        id: '6', 
        position: { x: 0, y: 400 }, 
        data: { 
          label: 'Node 6',
          value: 0, 
          peg1: [2], 
          peg2: [1], 
          peg3: [0] 
        }, 
        type: 'towerOfHanoi'
      },
      { 
          id: '7', 
          position: { x: 300, y: 400 }, 
          data: { 
            label: 'Node 7',
            value: 0, 
            peg1: [0,2], 
            peg2: [1], 
            peg3: [] 
          }, 
          type: 'towerOfHanoi'
      },
      { 
          id: '8', 
          position: { x: 600, y: 400 }, 
          data: { 
            label: 'Node 8',
            value: 0, 
            peg1: [0, 2], 
            peg2: [0], 
            peg3: [1] 
          }, 
          type: 'towerOfHanoi'
      },
      { 
          id: '9', 
          position: { x: 900, y: 400 }, 
          data: { 
            label: 'Node 9',
            value: 0, 
            peg1: [], 
            peg2: [2], 
            peg3: [0, 1] 
          }, 
          type: 'towerOfHanoi'
      },
  ];



export const edges = [
    { id: 'e1-2', source: '1', sourceHandle: "bottom", target: '2', targetHandle: "top" },
    { id: 'e1-3', source: '1', sourceHandle: "right", target: '3', targetHandle: "top" },
    { id: 'e2-3', source: '2', sourceHandle: "right", target: '3', targetHandle: "left" },
    { id: 'e2-6', source: '2', sourceHandle: "bottom", target: '6', targetHandle: "top" },
    { id: 'e3-4', source: '3', sourceHandle: "right", target: '4', targetHandle: "left" },
    { id: 'e4-5', source: '4', sourceHandle: "right", target: '5', targetHandle: "left" },
    { id: 'e4-8', source: '4', sourceHandle: "bottom", target: '8', targetHandle: "top" },
    { id: 'e5-9', source: '5', sourceHandle: "bottom", target: '9', targetHandle: "top" },
    { id: 'e6-7', source: '6', sourceHandle: "right", target: '7', targetHandle: "left" },
    { id: 'e7-8', source: '7', sourceHandle: "right", target: '8', targetHandle: "left" },
    { id: 'e8-9', source: '8', sourceHandle: "right", target: '9', targetHandle: "left" },
    { id: 'e8-5', source: '8', sourceHandle: "right", target: '5', targetHandle: "left" },
// Add your edges here if needed
];