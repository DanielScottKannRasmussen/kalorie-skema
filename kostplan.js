let currentMonthIndex = 0; // Start med Januar
let kalorieChart = null;
let data = []; // global JSON data

fetch("månedplan.json")
    .then(response => response.json())
    .then(json => {
        data = json; // gem globalt

        const tableBody = document.getElementById("table-body");
        const monthTitle = document.getElementById("current-month");
        const nextMonthBtn = document.getElementById("next-month");
        const backMonthBtn = document.getElementById("back-month");

        function renderMonth() {
            const monthData = data[currentMonthIndex];
            const { måned, "antal dage": antalDage } = monthData;

            monthTitle.textContent = måned;
            monthTitle.style.color = monthData.farve;

            tableBody.innerHTML = "";

            for (let dag = 1; dag <= antalDage; dag++) {
                const row = document.createElement("tr");
                const inputId = `kalorier-${måned}-${dag}`;
                const savedValue = localStorage.getItem(inputId) || "";

                row.innerHTML = `
                    <td>${dag}</td>
                    <td><input type="number" id="${inputId}" value="${savedValue}" placeholder="Indtast kalorier"></td>
                `;

                const input = row.querySelector("input");
                input.addEventListener("input", function () {
                    localStorage.setItem(inputId, input.value);
                    updateGraph();
                    const updatedTotals = getTotalCaloriesPerMonth(data);
                    drawPieChart(updatedTotals);
                });

                tableBody.appendChild(row);
            }

            updateGraph();
        }

        renderMonth();
        drawPieChart(getTotalCaloriesPerMonth(data));

        nextMonthBtn.addEventListener("click", () => {
            currentMonthIndex = (currentMonthIndex + 1) % data.length;
            renderMonth();
        });

        backMonthBtn.addEventListener("click", () => {
            currentMonthIndex = (currentMonthIndex - 1 + data.length) % data.length;
            renderMonth();
        });

        function updateGraph() {
            const rows = document.querySelectorAll("#table-body tr");

            const labels = [];
            const dataPoints = [];

            rows.forEach((row, index) => {
                const input = row.querySelector("input");
                const value = parseInt(input.value);
                labels.push(`Dag ${index + 1}`);
                dataPoints.push(isNaN(value) ? 0 : value);
            });

            const ctx = document.getElementById("myChart").getContext("2d");

            if (kalorieChart) {
                kalorieChart.data.labels = labels;
                kalorieChart.data.datasets[0].data = dataPoints;
                kalorieChart.update();
            } else {
                kalorieChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Kalorier per dag',
                            backgroundColor: '#62ee60',
                            data: dataPoints
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
        }
    });

function getTotalCaloriesPerMonth(dataset) {
    const result = [];

    dataset.forEach(month => {
        const { måned, "antal dage": antalDage } = month;
        let total = 0;

        for (let dag = 1; dag <= antalDage; dag++) {
            const id = `kalorier-${måned}-${dag}`;
            const value = parseInt(localStorage.getItem(id));
            if (!isNaN(value)) {
                total += value;
            }
        }

        result.push({ måned, total });
    });

    return result;
}

function drawPieChart(dataset) {
    const svg = document.getElementById("pie-chart");
    svg.innerHTML = "";

    const width = svg.clientWidth;
    const height = svg.clientHeight;
    const radius = Math.min(width, height) / 2;

    const centerX = width / 2;
    const centerY = height / 2;

    const totalCalories = dataset.reduce((sum, d) => sum + d.total, 0);
    if (totalCalories === 0) return;

    let startAngle = 0;

    dataset.forEach(item => {
        const sliceAngle = (item.total / totalCalories) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        const x1 = centerX + radius * Math.cos(startAngle);
        const y1 = centerY + radius * Math.sin(startAngle);
        const x2 = centerX + radius * Math.cos(endAngle);
        const y2 = centerY + radius * Math.sin(endAngle);

        const largeArc = sliceAngle > Math.PI ? 1 : 0;

        const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
            `Z`
        ].join(" ");

        const match = data.find(m => m.måned === item.måned);
        const farve = match ? match.farve : "#ccc";

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathData);
        path.setAttribute("fill", farve);
        path.setAttribute("stroke", "white");
        path.setAttribute("stroke-width", "1");
        svg.appendChild(path);

        startAngle = endAngle;
    });
}
