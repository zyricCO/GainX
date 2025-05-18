// chart-logic.js
import { ref, onValue } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-database.js";

let tokenValueChartInstance = null;

export function initializeTokenValueChart(database) {
    const tokenValueChartCanvas = document.getElementById('tokenValueChart');
    if (!tokenValueChartCanvas) {
        console.error("[DEBUG] [chart-logic.js] Canvas element for token value chart not found.");
        return;
    }

    const chartDataRef = ref(database, 'Graph/tokenValueHistory/ZSG');
    console.log("[DEBUG] [chart-logic.js] Attaching onValue listener to Firebase path: Graph/tokenValueHistory/ZSG");

    onValue(chartDataRef, (snapshot) => {
        console.log("[DEBUG] [chart-logic.js] onValue event triggered!");

        let labels = [];
        let dataPoints = [];

        if (snapshot.exists()) {
            const rawData = snapshot.val();
            console.log("[DEBUG] [chart-logic.js] Snapshot exists. Raw data from Firebase:", JSON.stringify(rawData));
            let dataArray = [];
            if (Array.isArray(rawData)) {
                dataArray = rawData.filter(item => item && typeof item.year !== 'undefined' && typeof item.value !== 'undefined');
            } else if (typeof rawData === 'object' && rawData !== null) {
                dataArray = Object.values(rawData).filter(item => item && typeof item.year !== 'undefined' && typeof item.value !== 'undefined');
            }
            if (dataArray.length > 0) {
                dataArray.sort((a, b) => a.year - b.year);
                dataArray.forEach(point => {
                    labels.push(String(point.year));
                    dataPoints.push(parseFloat(point.value));
                });
            }
        } else {
            console.log("[DEBUG] [chart-logic.js] Snapshot does not exist. No data at path or path is empty.");
        }

        if (labels.length === 0 || dataPoints.length === 0) {
            console.warn("[DEBUG] [chart-logic.js] No valid data points processed. Using sample data for chart.");
            labels = ['2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028'];
            dataPoints = [0.50, 1.80, 3.20, 2.50, 4.00, 5.50, 4.80, 5.10];
        }

        console.log("[DEBUG] [chart-logic.js] Final labels for chart:", JSON.stringify(labels));
        console.log("[DEBUG] [chart-logic.js] Final dataPoints for chart:", JSON.stringify(dataPoints));

        const textColor = '#E0E0E0'; // Light grey for text
        const gridColor = 'rgba(255, 255, 255, 0.15)'; // Subtle white grid lines
        const lineColor = '#00CFE8'; // Bright Cyan for the line
        const pointBorderColor = '#FFFFFF'; // White border for points for pop on dark theme
        const chartAreaBackgroundColor = 'rgba(30, 30, 30, 1)'; // Dark background for the chart's drawing area

        const chartData = {
            labels: labels,
            datasets: [{
                label: 'ZSG Token Value ($)',
                data: dataPoints,
                borderColor: lineColor,
                backgroundColor: function(context) {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;
                    if (!chartArea) {
                        return 'rgba(0, 207, 232, 0.1)'; // Fallback solid color for dark theme
                    }
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, 'rgba(0, 207, 232, 0.02)');
                    gradient.addColorStop(0.5, 'rgba(0, 207, 232, 0.1)');
                    gradient.addColorStop(1, 'rgba(0, 207, 232, 0.25)');
                    return gradient;
                },
                tension: 0.1,
                fill: true,
                pointBackgroundColor: lineColor,
                pointBorderColor: pointBorderColor,
                pointHoverBackgroundColor: pointBorderColor,
                pointHoverBorderColor: lineColor,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        };

        const config = {
            type: 'line',
            data: chartData,
            options: {
                chartArea: { // This makes the drawing area itself dark
                    backgroundColor: chartAreaBackgroundColor
                },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        title: { display: true, text: 'Value (USD)', color: textColor },
                        ticks: { color: textColor, callback: function(value) { return '$' + value.toFixed(2); }},
                        grid: { color: gridColor, borderColor: gridColor }
                    },
                    x: {
                        title: { display: true, text: 'Year', color: textColor },
                        ticks: { color: textColor },
                        grid: { color: gridColor, borderColor: gridColor }
                    }
                },
                plugins: {
                    legend: { display: true, position: 'bottom', labels: { color: textColor }},
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(10, 10, 10, 0.85)',
                        titleColor: '#FFFFFF',
                        bodyColor: textColor,
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) { label += ': '; }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                hover: { mode: 'nearest', intersect: true }
            }
        };

        if (tokenValueChartInstance) {
            console.log("[DEBUG] [chart-logic.js] Destroying existing chart instance.");
            tokenValueChartInstance.destroy();
        }

        if (typeof Chart !== 'undefined') {
            console.log("[DEBUG] [chart-logic.js] Creating new chart instance.");
            tokenValueChartInstance = new Chart(tokenValueChartCanvas, config);
        } else {
            console.error("[DEBUG] [chart-logic.js] Chart.js library not loaded.");
            const ctx = tokenValueChartCanvas.getContext('2d');
            ctx.clearRect(0, 0, tokenValueChartCanvas.width, tokenValueChartCanvas.height);
            ctx.font = '16px Inter, sans-serif';
            ctx.fillStyle = '#FFD54F'; // Amber/Yellow for warning
            ctx.textAlign = 'center';
            ctx.fillText('Chart.js library not found.', tokenValueChartCanvas.width / 2, tokenValueChartCanvas.height / 2);
        }

    }, (error) => {
        console.error("[DEBUG] [chart-logic.js] Firebase onValue error:", error);
        const ctx = tokenValueChartCanvas.getContext('2d');
        if (tokenValueChartInstance) {
            tokenValueChartInstance.destroy();
            tokenValueChartInstance = null;
        }
        ctx.clearRect(0, 0, tokenValueChartCanvas.width, tokenValueChartCanvas.height);
        ctx.font = '16px Inter, sans-serif';
        ctx.fillStyle = '#FF8A80'; // Light Red for error
        ctx.textAlign = 'center';
        ctx.fillText('Error loading chart data.', tokenValueChartCanvas.width / 2, tokenValueChartCanvas.height / 2);
    });
}
