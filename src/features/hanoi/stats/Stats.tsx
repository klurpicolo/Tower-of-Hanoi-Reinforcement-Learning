import { useMemo } from "react";
import { StatsView } from "./StatsView";
import { StatModel } from "./StateModel";
import type { Episode } from "../rl";


const dummyHistory: Episode[] = [
    // Episode 1: Optimal solution (3 disks)
    [
        { state: [3, 2, 1], action: { diskNum: 1, from: 0, to: 2 }, reward: -1 },
        { state: [3, 2, 0], action: { diskNum: 2, from: 0, to: 1 }, reward: -1 },
        { state: [3, 0, 0], action: { diskNum: 1, from: 2, to: 1 }, reward: -1 },
        { state: [0, 0, 0], action: { diskNum: 3, from: 0, to: 2 }, reward: 10 }
    ],
    // Episode 2: Suboptimal solution (3 disks)
    [
        { state: [3, 2, 1], action: { diskNum: 1, from: 0, to: 1 }, reward: -1 },
        { state: [3, 2, 0], action: { diskNum: 2, from: 0, to: 2 }, reward: -1 },
        { state: [3, 0, 0], action: { diskNum: 1, from: 1, to: 2 }, reward: -1 },
        { state: [0, 0, 0], action: { diskNum: 3, from: 0, to: 1 }, reward: -1 },
        { state: [0, 0, 0], action: { diskNum: 1, from: 2, to: 0 }, reward: -1 },
        { state: [0, 0, 0], action: { diskNum: 2, from: 2, to: 1 }, reward: -1 },
        { state: [0, 0, 0], action: { diskNum: 1, from: 0, to: 1 }, reward: -1 },
        { state: [0, 0, 0], action: { diskNum: 3, from: 1, to: 2 }, reward: 10 }
    ],
    // Episode 3: Failed attempt (3 disks)
    [
        { state: [3, 2, 1], action: { diskNum: 1, from: 0, to: 2 }, reward: -1 },
        { state: [3, 2, 0], action: { diskNum: 2, from: 0, to: 1 }, reward: -1 },
        { state: [3, 0, 0], action: { diskNum: 1, from: 2, to: 0 }, reward: -1 },
        { state: [0, 0, 0], action: { diskNum: 2, from: 1, to: 2 }, reward: -1 },
        { state: [0, 0, 0], action: { diskNum: 1, from: 0, to: 2 }, reward: -1 },
        { state: [0, 0, 0], action: { diskNum: 3, from: 0, to: 1 }, reward: -1 },
        { state: [0, 0, 0], action: { diskNum: 1, from: 2, to: 0 }, reward: -1 },
        { state: [0, 0, 0], action: { diskNum: 2, from: 2, to: 1 }, reward: -1 },
        { state: [0, 0, 0], action: { diskNum: 1, from: 0, to: 1 }, reward: -1 },
        { state: [0, 0, 0], action: { diskNum: 3, from: 1, to: 2 }, reward: 10 }
    ],
    // Episode 4: Quick optimal solution (2 disks)
    [
        { state: [2, 1, 0], action: { diskNum: 1, from: 0, to: 2 }, reward: -1 },
        { state: [2, 0, 0], action: { diskNum: 2, from: 0, to: 1 }, reward: -1 },
        { state: [0, 0, 0], action: { diskNum: 1, from: 2, to: 1 }, reward: 10 }
    ],
    // Episode 5: Learning attempt (3 disks)
    [
        { state: [3, 2, 1], action: { diskNum: 1, from: 0, to: 1 }, reward: -1 },
        { state: [3, 2, 0], action: { diskNum: 2, from: 0, to: 2 }, reward: -1 },
        { state: [3, 0, 0], action: { diskNum: 1, from: 1, to: 2 }, reward: -1 },
        { state: [0, 0, 0], action: { diskNum: 3, from: 0, to: 1 }, reward: -1 },
        { state: [0, 0, 0], action: { diskNum: 1, from: 2, to: 0 }, reward: -1 },
        { state: [0, 0, 0], action: { diskNum: 2, from: 2, to: 1 }, reward: -1 },
        { state: [0, 0, 0], action: { diskNum: 1, from: 0, to: 1 }, reward: -1 },
        { state: [0, 0, 0], action: { diskNum: 3, from: 1, to: 2 }, reward: 10 }
    ]
]


export function Stats() {
    const model = useMemo(() => new StatModel(
        dummyHistory
    ), []);
    return (
        <StatsView history={model.history} />
    )
}