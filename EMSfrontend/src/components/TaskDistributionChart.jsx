import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const TicketDistributionChart = () => {

  const data = {
    labels: ["Completed", "Pending", "In Progress"],
    datasets: [
      {
        data: [10, 5, 7],  // <-- replace with dynamic values if required
        backgroundColor: [
          "#10b981", // green
          "#f43f5e", // red
          "#3b82f6", // blue
        ],
        hoverOffset: 10,
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const options = {
    responsive: true,
    cutout: "65%", // makes it donut-shaped
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 14,
          padding: 15,
        },
      },
    },
  };

  return (
    <div className="flex justify-center items-center w-full h-64">
      <Doughnut data={data} options={options} />
    </div>
  );
};

export default TicketDistributionChart;
