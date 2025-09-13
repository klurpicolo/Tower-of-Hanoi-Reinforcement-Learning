import { useMemo } from "react";
import { Observer } from "mobx-react-lite";

import TowerOfHanoiModel from "./TowerOfHanoiModel";
import { TowerOfHanoiView } from "./TowerOfHanoiView";


export function TowerOfHanoi() {
    const model = useMemo(
        () => new TowerOfHanoiModel(),
        []
    )

    return (
        <Observer>
            {() => (
                <>
                    <button onClick={() => model.state = [0, 1, 2]}>Reset</button>
                    <TowerOfHanoiView
                        numPegs={model.pegNum}
                        numDisks={model.diskNum}
                        state={model.state}
                    />
                </>
            )}
        </Observer>
    )

}