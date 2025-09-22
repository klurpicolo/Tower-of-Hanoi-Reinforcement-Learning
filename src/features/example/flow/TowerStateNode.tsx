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
    <div className="tower-of-hanoi-node" style={{ backgroundColor: background }}>
      <p>State value {value}</p>
      <TowerOfHanoi peg1={peg1} peg2={peg2} peg3={peg3}></TowerOfHanoi>
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
