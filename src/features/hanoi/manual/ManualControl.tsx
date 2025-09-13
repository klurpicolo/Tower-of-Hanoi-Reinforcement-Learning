
export type ManualControlProps = {
    numDisks: number;
    numPegs: number;
}

export function ManualControl({numDisks, numPegs}: ManualControlProps) {
    return (
        <div>ManualControl {numDisks} {numPegs}</div>
    )
}