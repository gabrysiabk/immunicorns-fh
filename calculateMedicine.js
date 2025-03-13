import { csv, select, scaleBand, scaleLinear, axisBottom, axisLeft, max } from "d3";

// Required quantities for 100 doses
const required = {
    "Yeast": 1,
    "Culture media": 200,
    "Chromatography solution": 25,
    "Filtration equipment": 25,
    "Syringes": 1
};

csv("./components_cure.csv").then(data => {
  const dosesPerIngredient = data.map((d) => {
    const product = d.product.trim();
    const available = +d.litre;
    let requiredAmount;
    if (product.toLowerCase().includes("yeast")) {
      requiredAmount = required["Yeast"];
    } else if (product.toLowerCase().includes("culture")) {
      requiredAmount = required["Culture media"];
    } else if (product.toLowerCase().includes("chromatography")) {
      requiredAmount = required["Chromatography solution"];
    } else if (product.toLowerCase().includes("filtration")) {
      requiredAmount = required["Filtration equipment"];
    } else if (product.toLowerCase().includes("syringes")) {
      requiredAmount = required["Syringes"];
    }
    const doses = (available * 100) / requiredAmount;
    return { product, available, requiredAmount, doses };
  });

  // Identify the limiting ingredient (smallest number of producible doses)
  const limitingDoses = Math.min(...dosesPerIngredient.map((d) => d.doses));

  console.log("Doses per ingredient:", dosesPerIngredient);
  console.log("Limiting doses:", limitingDoses);

  // Define initial dimensions
  const width = 700;
  const height = 400;

  // Create SVG with a viewBox, preserving aspect ratio
  const svg = select("#medicineChart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`) // The drawing area
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%") // Make SVG responsive
    .style("height", "auto"); // Height adjusts automatically

  // The desired order of ingredients
  const order = [
    "Yeast",
    "Culture media",
    "Chromatography solution",
    "Filtration equipment",
    "Syringes",
  ];

  // x-scale
  const x = scaleBand()
    .domain(order)
    .range([60, width - 20])
    .padding(0.1);

  // y-scale
  const y = scaleLinear()
    .domain([0, max(dosesPerIngredient, (d) => d.doses)])
    .range([height - 50, 20]);

  // Draw bars
  svg
    .selectAll("rect")
    .data(dosesPerIngredient)
    .enter()
    .append("rect")
    .attr("x", (d) => x(d.product))
    .attr("y", (d) => y(d.doses))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - 50 - y(d.doses))
    .attr("fill", (d) => (d.doses === limitingDoses ? "#e1a145" : "#82afa2"));

  // x-axis
  svg
    .append("g")
    .attr("transform", `translate(0,${height - 40})`)
    .call(axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(0)")
    .style("text-anchor", "middle");

  // y-axis
  svg.append("g").attr("transform", `translate(60,0)`).call(axisLeft(y));

  // Display text for the limiting doses
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text(`Maximum producible doses: ${Math.floor(limitingDoses)}`);

  // Add resize handling with debounce
  let resizeTimeout;
  function resizeMedicineChart() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Update dimensions
      const newWidth = Math.min(window.innerWidth * 0.7, 1000);
      const newHeight = Math.min(window.innerHeight * 0.4, 600);

      // Update scales
      x.range([60, newWidth - 20]);
      y.range([newHeight - 50, 20]);

      // Update SVG viewBox
      svg.attr("viewBox", `0 0 ${newWidth} ${newHeight}`);

      // Update bars
      svg
        .selectAll("rect")
        .attr("x", (d) => x(d.product))
        .attr("y", (d) => y(d.doses))
        .attr("width", x.bandwidth())
        .attr("height", (d) => newHeight - 50 - y(d.doses));

      // Update axes
      svg
        .selectAll("g")
        .filter(
          (d) =>
            d &&
            d.attr("transform") &&
            d.attr("transform").includes("translate(0,")
        )
        .attr("transform", `translate(0,${newHeight - 40})`);

      // Update title text position
      svg
        .selectAll("text")
        .filter(
          (d) => d && d.attr("text-anchor") === "middle" && d.attr("y") === "15"
        )
        .attr("x", newWidth / 2);
    }, 250);
  }

  // Add resize event listener
  window.addEventListener("resize", resizeMedicineChart);
});


// progressbar for medicine

document.getElementById("startButton").addEventListener("click", () => {
    const progressBar = select("#progressBar");

    // Reset the bar and text in case of repeated clicks:
    progressBar.style("width", "0%");
    select("#progressText").text("");

    // Animate the progress bar to fill over 10 seconds
    progressBar.transition()
        .duration(10000) // 10 seconds
        .style("width", "100%")
        .on("end", () => {
            select("#progressText").text("Medicine produced!");
        });
});
