import React, { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartOptions } from "chart.js";
import { Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export interface EpisodeData {
  episode: number;
  reward: number;
  epsilon: number;
}

interface LearningProgressChartProps {
  data: EpisodeData[];
  maxEpisodes?: number;
  onReset?: () => void;
}

export const LearningProgressChart: React.FC<LearningProgressChartProps> = ({
  data,
  maxEpisodes = 100,
}) => {
  const chartRef = useRef<ChartJS<"line">>(null);

  const chartData = {
    labels: Array.from({ length: maxEpisodes }, (_, i) => `${i + 1}`),
    datasets: [
      {
        label: "Reward",
        data: Array.from({ length: maxEpisodes }, (_, i) => {
          const episodeData = data.find((d) => d.episode === i + 1);
          return episodeData ? episodeData.reward : null;
        }),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        yAxisID: "y",
        tension: 0.1,
        spanGaps: false,
      },
      {
        label: "Epsilon",
        data: Array.from({ length: maxEpisodes }, (_, i) => {
          const episodeData = data.find((d) => d.episode === i + 1);
          return episodeData ? episodeData.epsilon : null;
        }),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        yAxisID: "y1",
        tension: 0.1,
        spanGaps: false,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: "Learning Progress",
        font: {
          size: 14,
          weight: "bold",
        },
      },
      legend: {
        display: true,
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            if (label === "Reward") {
              return `${label}: ${value.toFixed(2)}`;
            } else {
              return `${label}: ${value.toFixed(3)}`;
            }
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Episode",
        },
        grid: {
          display: true,
        },
        min: 1,
        max: maxEpisodes,
        ticks: {
          stepSize: Math.max(1, Math.floor(maxEpisodes / 10)),
          callback: function (value) {
            return Math.floor(Number(value));
          },
        },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "Reward",
          color: "rgb(75, 192, 192)",
        },
        grid: {
          display: true,
        },
        ticks: {
          color: "rgb(75, 192, 192)",
        },
        min: -30,
        max: 50,
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: {
          display: true,
          text: "Epsilon",
          color: "rgb(255, 99, 132)",
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: "rgb(255, 99, 132)",
        },
        min: 0,
        max: 1,
      },
    },
  };

  // Reset chart when data is empty
  useEffect(() => {
    if (data.length === 0 && chartRef.current) {
      chartRef.current.data.labels = [];
      chartRef.current.data.datasets.forEach((dataset) => {
        dataset.data = [];
      });
      chartRef.current.update();
    }
  }, [data]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
};

export default LearningProgressChart;
