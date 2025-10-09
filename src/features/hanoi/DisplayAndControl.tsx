import { useState, useMemo } from "react";
import TowerOfHanoiModel from "./tower/TowerOfHanoiModel";
import { Observer } from "mobx-react-lite";
import { TowerOfHanoiView } from "./tower/TowerOfHanoiView";
import { NumberInput, Button, Group, Alert, Flex } from "@mantine/core";
import type { Episode } from "./rl";
import { optimal3DiskPolicy } from "../../reinforcement/solver";
import { Stats } from "./stats/Stats";

function replayEpisode(
  episode: Episode,
  model: TowerOfHanoiModel,
  interval: number,
) {
  episode.forEach(({ action }, index) => {
    setTimeout(() => {
      model.moveDisk(action);
    }, index * interval);
  });
}

function playOptimalPolicy(model: TowerOfHanoiModel, interval: number) {
  let stepCount = 0;
  const maxSteps = 20;

  const playNextMove = () => {
    if (model.isSolved) {
      console.log("Puzzle solved!");
      return;
    }

    if (stepCount >= maxSteps) {
      console.log("Max steps reached, stopping");
      return;
    }

    const action = optimal3DiskPolicy(model.state);

    try {
      model.moveDisk(action);
      stepCount++;
      console.log(
        `Step ${stepCount}: Moved disk ${action.diskNum} from peg ${action.from} to peg ${action.to}`,
      );

      // Schedule next move
      setTimeout(playNextMove, interval);
    } catch (error) {
      console.error("Error applying optimal action:", error);
    }
  };

  // Start playing
  playNextMove();
}

const optimalEpisode: Episode = [
  {
    state: [0, 0, 0],
    action: { diskNum: 0, from: 0, to: 2 },
    reward: 0,
  },
  {
    state: [2, 0, 0],
    action: { diskNum: 1, from: 0, to: 1 },
    reward: 0,
  },
  {
    state: [2, 1, 0],
    action: { diskNum: 0, from: 2, to: 1 },
    reward: 0,
  },
  {
    state: [1, 1, 0],
    action: { diskNum: 2, from: 0, to: 2 },
    reward: 0,
  },
  {
    state: [1, 1, 2],
    action: { diskNum: 0, from: 1, to: 0 },
    reward: 0,
  },
  {
    state: [0, 1, 2],
    action: { diskNum: 1, from: 1, to: 2 },
    reward: 0,
  },
  {
    state: [0, 2, 2],
    action: { diskNum: 0, from: 0, to: 2 },
    reward: 0,
  },
];

export default function DisplayAndControl() {
  const model = useMemo(() => new TowerOfHanoiModel(), []);
  const [diskNum, setDiskNum] = useState(0);
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(1);
  const [errMsg, setErrMsg] = useState("");

  const handleMove = () => {
    setErrMsg(""); // Clear previous error
    try {
      model.moveDisk({ diskNum, from, to });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrMsg(error.message);
      } else {
        setErrMsg(`An unknown error occurred ${error}}`);
      }
    }
  };

  const handleReplay = () => {
    replayEpisode(optimalEpisode, model, 300);
  };

  const handleReset = () => {
    model.reset();
  };

  const handlePlayOptimal = () => {
    playOptimalPolicy(model, 500);
  };

  return (
    <Observer>
      {() => (
        <div>
          <Flex direction="column" gap="md" style={{ marginBottom: "20px" }}>
            <Group align="flex-end" gap="md">
              <NumberInput
                label="Disk Number"
                description="Select which disk to move (0 = smallest, 2 = largest)"
                min={0}
                max={model.diskNum - 1}
                value={diskNum}
                onChange={(value) => setDiskNum(Number(value) || 0)}
                placeholder="Enter disk number"
                style={{ flex: 1 }}
              />
              <NumberInput
                label="From Peg"
                description="Source peg (0, 1, or 2)"
                min={0}
                max={model.pegNum - 1}
                value={from}
                onChange={(value) => setFrom(Number(value) || 0)}
                placeholder="Enter source peg"
                style={{ flex: 1 }}
              />
              <NumberInput
                label="To Peg"
                description="Destination peg (0, 1, or 2)"
                min={0}
                max={model.pegNum - 1}
                value={to}
                onChange={(value) => setTo(Number(value) || 0)}
                placeholder="Enter destination peg"
                style={{ flex: 1 }}
              />
              <Button onClick={handleMove} color="blue" size="lg">
                Move Disk
              </Button>
              <Button onClick={handleReplay} color="green" size="lg">
                Replay Episode
              </Button>
              <Button onClick={handlePlayOptimal} color="violet" size="lg">
                Play Optimal
              </Button>
              <Button onClick={handleReset} color="red" size="lg">
                Reset
              </Button>
            </Group>
            {errMsg && (
              <Alert color="red" title="Error">
                {errMsg}
              </Alert>
            )}
          </Flex>
          <TowerOfHanoiView
            numPegs={model.pegNum}
            numDisks={model.diskNum}
            state={model.state}
          />
          <Stats></Stats>
        </div>
      )}
    </Observer>
  );
}
