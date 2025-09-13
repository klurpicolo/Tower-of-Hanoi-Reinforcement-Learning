import { useState, useMemo } from "react";
import TowerOfHanoiModel from "./tower/TowerOfHanoiModel";
import { Observer } from "mobx-react-lite";
import { TowerOfHanoiView } from "./tower/TowerOfHanoiView";
import { NumberInput, Button, Group, Alert, Flex } from "@mantine/core";

export default function DisplayAndControl() {
    const model = useMemo(() => new TowerOfHanoiModel(), []);
    const [diskNum, setDiskNum] = useState(0);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(1);
    const [errMsg, setErrMsg] = useState("");

    const handleMove = () => {
        setErrMsg(""); // Clear previous error
        try {
            model.moveDisk({diskNum, from, to});
        } catch (error: unknown) {
            if (error instanceof Error) {
                setErrMsg(error.message);
            } else {
                setErrMsg(`An unknown error occurred ${error}}`);
            }
        }
    };

    return (
        <Observer>
            {() => (
                <div>
                    <Flex direction="column" gap="md" style={{ marginBottom: '20px' }}>
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
                </div>
            )}
        </Observer>
    );
}