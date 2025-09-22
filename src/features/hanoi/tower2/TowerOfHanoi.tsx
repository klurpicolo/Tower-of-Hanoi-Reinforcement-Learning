import './TowerOfHanoiView.css'; 


export type TowerOfHanoiProps = {
    peg1: number[];
    peg2: number[];
    peg3: number[];
}

const getDiskColor = (diskIndex: number) => {
    const colors = [
        '#FF6347', '#FFD700', '#ADFF2F', '#00BFFF', '#BA55D3', '#FF4500',
        '#32CD32', '#8A2BE2', '#40E0D0', '#FF1493'
    ];
    return colors[diskIndex % colors.length];
};


export function TowerOfHanoi({ peg1, peg2, peg3}: TowerOfHanoiProps) {
    const pegs = [peg1, peg2, peg3]

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
                                width: `${(diskIndex + 1) * 4 + 8}px`, // Make larger disks wider (compact scale)
                                backgroundColor: getDiskColor(diskIndex),
                                bottom: `${(pegDisks.length - stackIndex - 1) * 8 + 8}px`, // Stack disks above the peg base (8px + 8px margin)
                                transform: 'translateX(-50%)',
                            }}
                        // >{diskIndex}</div>
                        ></div>
                    ))}
                </div>
            ))}
        </div>
    );
}