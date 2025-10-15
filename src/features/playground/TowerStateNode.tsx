import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { TowerOfHanoi } from "../hanoi/tower/TowerOfHanoi";

export type TowerStateNode = Node<
  {
    id: string;
    label: string;
    stateKey: string;
    value: number;
    peg1: number[];
    peg2: number[];
    peg3: number[];
    background?: string;
    currentState: boolean;
  },
  "towerOfHanoi"
>;

export function TowerStateNode(props: NodeProps<TowerStateNode>) {
  const {
    value,
    peg1,
    peg2,
    peg3,
    background = "white",
    currentState = false,
  } = props.data;
  const id = props.id;

  return (
    <div
      className="tower-of-hanoi-node"
      style={{
        backgroundColor: id == "27" ? "#fbc02d" : background,
        border: currentState ? "3px solid #fbc02d" : "1px solid black",
        fontSize: 20,
        borderRadius: 8, // rounded corners
        padding: 8,
        minWidth: 120,
        transition: "background-color 0.4s ease", // smooth color change
        boxShadow: currentState
          ? "10px 2px 6px rgba(0,0,0,0.15)"
          : "0 2px 6px rgba(0,0,0,0.15)", // subtle shadow
      }}
    >
      {/* <p>ID: {id}</p> */}
      {/* <p>State key {stateKey}</p> */}
      {/* <p>State value {value == 0 ? "0.00":value }</p> */}
      <p>
        {id == "27"
          ? "Terminal"
          : "State value:" + (value == 0 ? "0.00" : value)}
      </p>
      <TowerOfHanoi peg1={peg1} peg2={peg2} peg3={peg3}></TowerOfHanoi>
      <Handle
        type="source"
        position={Position.Top}
        id="top-a"
        style={{ left: "25%" }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-b"
        style={{ left: "75%" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-a"
        style={{ left: "25%" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-b"
        style={{ left: "75%" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-a"
        style={{ top: "25%" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-b"
        style={{ top: "75%" }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-a"
        style={{ top: "25%" }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-b"
        style={{ top: "75%" }}
      />

      <Handle
        type="target"
        position={Position.Top}
        id="top-a"
        style={{ left: "25%" }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-b"
        style={{ left: "75%" }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-a"
        style={{ left: "25%" }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-b"
        style={{ left: "75%" }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-a"
        style={{ top: "25%" }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-b"
        style={{ top: "75%" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-a"
        style={{ top: "25%" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-b"
        style={{ top: "75%" }}
      />
    </div>
  );
}
