data.forEach(by => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${kalender.år}</td>
        <td>${kalender.måned}</td>
        <td>${kalender.dag.toLocaleString()}</td>
    `;
    tableBody.appendChild(row);
});
