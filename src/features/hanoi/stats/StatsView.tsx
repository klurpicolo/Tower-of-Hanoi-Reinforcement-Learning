import { Table, ScrollArea } from '@mantine/core';
import type { Episode } from "../rl";

export type StatsViewProps = {
    history: Episode[];
}

export function StatsView({ history }: StatsViewProps) {
    const formatSAR = (sar: { state: number[]; action: { diskNum: number; from: number; to: number }; reward: number }) => {
        return `{S[${sar.state.join(',')}] A[${sar.action.diskNum}:${sar.action.from}→${sar.action.to}] R[${sar.reward}]}`;
    };

    const rows = history.map((episode, index) => {
        const sumReward = episode.reduce((sum, sar) => sum + sar.reward, 0);
        const sarSeries = episode.map(formatSAR).join(' | ');
        
        return (
            <Table.Tr key={index}>
                <Table.Td>{index + 1}</Table.Td>
                <Table.Td>{sumReward}</Table.Td>
                <Table.Td style={{ maxWidth: '400px', wordBreak: 'break-all' }}>
                    {sarSeries}
                </Table.Td>
            </Table.Tr>
        );
    });

    return (
        <ScrollArea>
            <Table striped highlightOnHover>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Episode</Table.Th>
                        <Table.Th>Sum Reward</Table.Th>
                        <Table.Th>SAR Series</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {rows}
                </Table.Tbody>
            </Table>
        </ScrollArea>
    );
}