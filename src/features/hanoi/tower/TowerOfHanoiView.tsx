import './TowerOfHanoiView.css'; // Make sure to create this CSS file

export type TowerOfHanoiViewProps = {
    numPegs: number;
    numDisks: number;
    state: number[]; // e.g., [0, 0, 0] for 3 disks on peg 0
};

export function TowerOfHanoiView({ numPegs, state }: TowerOfHanoiViewProps) {
    
    // Create an array to represent the pegs, with each element being an array of disks
    const pegs: number[][] = Array.from({ length: numPegs }, () => []);

    // Populate the pegs with the disk numbers based on the current state
    state.forEach((pegIndex, diskIndex) => {
        if (pegIndex >= 0 && pegIndex < numPegs) {
            pegs[pegIndex].push(diskIndex);
        }
    });

    // Sort the disks on each peg to ensure they are ordered correctly (largest on bottom)
    pegs.forEach(pegDisks => pegDisks.sort((a, b) => b - a));

    // A helper function to determine the color of a disk
    const getDiskColor = (diskIndex: number) => {
        const colors = [
            '#FF6347', '#FFD700', '#ADFF2F', '#00BFFF', '#BA55D3', '#FF4500',
            '#32CD32', '#8A2BE2', '#40E0D0', '#FF1493'
        ];
        return colors[diskIndex % colors.length];
    };

    return (
        <div className="tower-of-hanoi-container">
            {pegs.map((pegDisks, pegIndex) => (
                <div key={pegIndex} className="peg">
                    {/* The rod of the peg */}
                    <div className="peg-rod"></div>
                    {/* The base of the peg */}
                    <div className="peg-base">{pegIndex}</div>
                    {/* Render the disks on this peg */}
                    {pegDisks.map((diskIndex, stackIndex) => (
                        <div
                            key={diskIndex}
                            className="disk"
                            style={{
                                width: `${(diskIndex + 1) * 30 + 30}px`, // Make larger disks wider
                                backgroundColor: getDiskColor(diskIndex),
                                bottom: `${stackIndex * 25 + 30}px`, // Stack disks above the peg base (30px + 10px margin)
                                transform: 'translateX(-50%)',
                            }}
                        >{diskIndex}</div>
                    ))}
                </div>
            ))}
        </div>
    );
}