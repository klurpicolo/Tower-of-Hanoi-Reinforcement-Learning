import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { TowerOfHanoi } from "../../hanoi/tower2/TowerOfHanoi";

// export type TowerStateNodeData = {
//   value: number;
//   peg1: number[];
//   peg2: number[];
//   peg3: number[];
//   background?: string;
// }

export type TowerStateNode = Node<{
  label: string;
  value: number;
  peg1: number[];
  peg2: number[];
  peg3: number[];
  background?: string;
},
'towerOfHanoi'>;

export function TowerStateNode(props: NodeProps<TowerStateNode>) {
  const { value, peg1, peg2, peg3, background = "white" } = props.data;

  return (
    <div className="tower-of-hanoi-node" style={{ backgroundColor: background, border: "1px solid black" }}>
      <p>State value {value}</p>
      <TowerOfHanoi peg1={peg1} peg2={peg2} peg3={peg3}></TowerOfHanoi>
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Left} id="left" />
    </div>
  );
}
