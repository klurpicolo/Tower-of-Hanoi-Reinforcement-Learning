import { useState, useMemo } from "react";
import TowerOfHanoiModel from "./tower/TowerOfHanoiModel";
import { Observer } from "mobx-react-lite";
import { TowerOfHanoiView } from "./tower/TowerOfHanoiView";

export default function DisplayAndControl() {
    const model = useMemo(() => new TowerOfHanoiModel(), []);
    const [diskNum, setDiskNum] = useState(0);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(1);
    const [errMsg, setErrMsg] = useState("");

    const handleMove = () => {
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
                    <div>
                        <label>
                            Disk Number:
                            <input
                                type="number"
                                min={0}
                                max={model.diskNum - 1}
                                value={0}
                                onChange={e => setDiskNum(Number(e.target.value))}
                            />
                        </label>
                        <label>
                            From Peg:
                            <input
                                type="number"
                                min={0}
                                max={model.pegNum - 1}
                                value={from}
                                onChange={e => setFrom(Number(e.target.value))}
                            />
                        </label>
                        <label>
                            To Peg:
                            <input
                                type="number"
                                min={0}
                                max={model.pegNum - 1}
                                value={to}
                                onChange={e => setTo(Number(e.target.value))}
                            />
                        </label>
                        <button onClick={handleMove}>Move Disk</button>
                    </div>
                    <TowerOfHanoiView
                        numPegs={model.pegNum}
                        numDisks={model.diskNum}
                        state={model.state}
                    />
                    {errMsg && <div style={{ color: 'red' }}>{errMsg}</div>}
                </div>
            )}
        </Observer>
    );
}