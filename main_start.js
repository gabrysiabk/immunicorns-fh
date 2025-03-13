import {
  select,
  selectAll,
  pointer,
  transition,
  geoMercator,
  geoPath,
  json,
  csv,
} from "d3";
const chartContainer = document.getElementById("start");

const width = window.innerWidth * 0.9;
const height = window.innerHeight * 0.6;

const svg = select(chartContainer)
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Add resize handling with debounce
let resizeTimeout;
function resizeStartChart() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // Update dimensions
    const newWidth = window.innerWidth * 0.9;
    const newHeight = window.innerHeight * 0.6;

    // Update SVG dimensions
    svg.attr("width", newWidth).attr("height", newHeight);

    // Update projection
    projection
      .center([13.5, 47.5])
      .scale(newWidth * 5)
      .translate([newWidth / 2, newHeight / 2]);

    // Update path generator
    path.projection(projection);

    // Redraw the map if data is available
    if (mapData) {
      svg.selectAll(".land").data(mapData.features).attr("d", path);
    }
  }, 250);
}

// Add resize event listener
window.addEventListener("resize", resizeStartChart);

const projection = geoMercator()
  .center([13.5, 47.5]) // center the map
  .scale(width * 5)
  .translate([width / 2, height / 2]);

const path = geoPath(projection);

//TODO: read csv
const rawData = [
  [
    '"Burgenland"',
    '"294436"',
    '"296010"',
    '"297583"',
    '"301250"',
    '"301951"',
    '"301819"\r',
  ],
  [
    '"Kaernten"',
    '"561293"',
    '"562089"',
    '"564513"',
    '"568984"',
    '"569744"',
    '"570194"\r',
  ],
  [
    '"Niederoesterreich"',
    '"1684287"',
    '"1690879"',
    '"1698796"',
    '"1718373"',
    '"1723723"',
    '"1727759"\r',
  ],
  [
    '"Oberoesterreich"',
    '"1490279"',
    '"1495608"',
    '"1505140"',
    '"1522825"',
    '"1530349"',
    '"1535677"\r',
  ],
  [
    '"Salzburg"',
    '"558410"',
    '"560710"',
    '"562606"',
    '"568346"',
    '"571479"',
    '"572905"\r',
  ],
  [
    '"Steiermark"',
    '"1246395"',
    '"1247077"',
    '"1252922"',
    '"1265198"',
    '"1269801"',
    '"1271940"\r',
  ],
  [
    '"Tirol"',
    '"757634"',
    '"760105"',
    '"764102"',
    '"771304"',
    '"775970"',
    '"777773"\r',
  ],
  [
    '"Vorarlberg"',
    '"397139"',
    '"399237"',
    '"401674"',
    '"406395"',
    '"409973"',
    '"411748"\r',
  ],
  [
    '"Wien"',
    '"1911191"',
    '"1920949"',
    '"1931593"',
    '"1982097"',
    '"2005760"',
    '"2028399"\r',
  ],
];

// Clean the data
const cleanedData = rawData.map((row) => {
  return row.map((cell) => cell.replace(/"/g, "").trim().replace(/\r$/, ""));
});

// Now we extract only the first column (province name) and the last column (population data)
const transformedData = cleanedData.map((row) => {
  const province = row[0]; // First column is province name
  const population = row[row.length - 1]; // Last column is the most recent population
  return { province, population: Number(population) }; // Convert population to a number
});

console.log(transformedData);

// Create a tooltip div and style it
const tooltip = select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("visibility", "hidden") // Initially hidden
  .style("background-color", "white")
  .style("color", "black")
  .style("border-radius", "4px")
  .style("padding", "5px")
  .style("font-size", "14px");

// Function to find the population for a given province name
function getPopulation(provinceName) {
  const provinceData = transformedData.find((d) => d.province === provinceName);
  console.log("Found province data:", provinceData); // Debugging log
  return provinceData ? provinceData.population : "No data available";
}

let infectedArray = [
  [
    '"Day"',
    '"Burgenland"',
    '"Kaernten"',
    '"Niederösterreich"',
    '"Oberoesterreich"',
    '"Salzburg"',
    '"Steiermark"',
    '"Tirol"',
    '"Vorarlberg"',
    '"Wien"',
  ],
  [1, 0, 0, 5, 0, 0, 0, 0, 0, 0], // Initial number of infections for each region
];

let infectionDelays = {
  Wien: 2,
  Burgenland: 3,
  Oberoesterreich: 3,
  Salzburg: 4,
  Steiermark: 4,
  Tirol: 5,
  Kaernten: 6,
  Vorarlberg: 6,
};

// Function to calculate new infections for each day and increment the day
function newDay(infectedArray, infectRate) {
  // Increment the day (first value of the second row)
  infectedArray[1][0] += 1; // This updates the "Day" value by 1

  // Loop through each region's data (starting from index 1, as index 0 is the day)
  for (let i = 1; i < infectedArray[1].length; i++) {
    const provinceName = infectedArray[0][i].replace(/"/g, ""); // Get the province name (remove quotes)
    const delay = infectionDelays[provinceName] || 0; // Get the delay for the province (default 0 if not specified)
    const currentDay = infectedArray[1][0];

    // If the current day is greater than or equal to the delay, apply the infection rate
    if (currentDay > delay) {
      // If infection is still 0 and delay is over, start the infection with a small value (e.g., 1)
      if (infectedArray[1][i] === 0) {
        infectedArray[1][i] = 5; // Start with 5 infection
      } else {
        // Apply exponential growth
        infectedArray[1][i] =
          infectedArray[1][i] * Math.pow(infectRate, currentDay - delay);
      }
    }
  }

  return infectedArray;
}

// Function to calculate percentage of infections for each province
function calculateInfectionPercentage(infectedArray, populationData) {
  const infectionPercentages = [];

  // Loop through the daily data to calculate the percentages
  for (let i = 1; i < infectedArray.length; i++) {
    const dailyData = infectedArray[i];
    const percentagesForDay = [];

    // Loop through each province
    for (let j = 1; j < dailyData.length; j++) {
      const provinceName = populationData[j - 1].province;
      const population = populationData[j - 1].population;
      const infected = dailyData[j];

      // Calculate the percentage of infected people
      const percentage = (infected / population) * 100;
      percentagesForDay.push(percentage);
    }

    infectionPercentages.push(percentagesForDay);
  }

  return infectionPercentages;
}

// Example usage:
let infectRate = 1.05; // Growth rate (10% increase per day)
let dailyData = []; // To store daily infection data

// Add the first day's data
dailyData.push([...infectedArray[1]]); // First day data

// Run the function for 20 days
for (let i = 0; i < 20; i++) {
  infectedArray = newDay(infectedArray, infectRate); // Calculate new day data
  dailyData.push([...infectedArray[1]]); // Add the updated data for this day
}

// Now calculate the infection percentages for each day
const infectionPercentages = calculateInfectionPercentage(
  dailyData,
  transformedData
);

// Log the results
console.log(infectionPercentages);

// Create an array to hold the data in a new format: for each day, we associate the province with its infection percentage
const provinceNames = transformedData.map((d) => d.province);

// New structure to hold daily data for each province
const dailyInfectionData = infectionPercentages.map((dayData, index) => {
  // For each day, pair the province name with the infection percentage
  const dayDataWithProvince = dayData.map((percentage, i) => ({
    province: provinceNames[i],
    infectionPercentage: percentage,
  }));

  return dayDataWithProvince;
});

console.log(dailyInfectionData);

let mapData; // Declare a global variable to store the map data

json("oesterreich.json").then((data) => {
  // Store the loaded map data in the global variable
  mapData = data;

  svg
    .selectAll(".land")
    .data(data.features)
    .enter()
    .append("path")
    .attr("data-province", (d) => d.properties.name) // Add this line when creating the path
    .attr("class", "land")
    .attr("d", path)
    .attr("fill", "#cccccc")
    .attr("stroke", "black")
    .attr("stroke-width", 0.5)
    .attr("fill", function (d) {
      const provinceName = d.properties.name;
      const currentDayData = dailyInfectionData[0]; // Assume we're showing the data for the first day
      const provinceData = currentDayData.find(
        (p) => p.province === provinceName
      );

      if (provinceData) {
        let percentage = (provinceData.infectionPercentage * 100).toFixed(2); // Convert to percentage

        // Ensure percentage doesn't exceed 100
        if (percentage > 100) {
          percentage = 100;
        }

        // Determine color based on infection percentage
        if (percentage < 5) {
          return "#d6e5cf";
        } else if (percentage >= 5 && percentage <= 50) {
          return "#f3dccf";
        } else {
          return "#e1a145";
        }
      }
      return "#cccccc"; // Default color if no data found
    })
    .on("mouseover", function (event, d) {
      const provinceName = d.properties.name;
      const currentDayData = dailyInfectionData[0]; // Assume we're showing the data for the first day
      const provinceData = currentDayData.find(
        (p) => p.province === provinceName
      );

      if (provinceData) {
        const percentage = (provinceData.infectionPercentage * 100).toFixed(2); // Convert to percentage
        tooltip
          .style("visibility", "visible")
          .html(`<strong>${provinceName}</strong><br>Infected: ${percentage}%`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY + 10 + "px");
      }
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px");
    })
    .on("mouseout", function () {
      tooltip.style("visibility", "hidden");
    });
  //.append("title")
  //.text(d => d.properties.name);
});

// Now the slider event listener
const slider1 = document.getElementById("daySlider1");
const dayLabel1 = document.getElementById("dayLabel1");

// Handle slider change event
slider1.addEventListener("input", function () {
  const dayIndex1 = slider1.value; // Get the selected day (from 0 to 19)
  dayLabel1.textContent = parseInt(dayIndex1) + 1; // Update the label to show the correct day (1-indexed)

  // Get the infection data for the selected day
  const dayData = dailyInfectionData[dayIndex1];

  // Update the map tooltip for each province with the selected day's data
  svg
    .selectAll(".land")
    .data(mapData.features) // Use the globally available mapData
    .attr("fill", function (d) {
      const provinceName = d.properties.name;
      const provinceData = dayData.find((p) => p.province === provinceName);

      if (provinceData) {
        let percentage = (provinceData.infectionPercentage * 100).toFixed(2); // Convert to percentage

        // Ensure percentage doesn't exceed 100
        if (percentage > 100) {
          percentage = 100;
        }

        // Determine color based on infection percentage
        if (percentage < 5) {
          return "#d6e5cf";
        } else if (percentage >= 5 && percentage <= 50) {
          return "#f3dccf";
        } else {
          return "#e1a145";
        }
      }
      return "#cccccc"; // Default color if no data found
    })
    .on("mouseover", function (event, d) {
      const provinceName = d.properties.name;
      const provinceData = dayData.find((p) => p.province === provinceName);

      if (provinceData) {
        let percentage = (provinceData.infectionPercentage * 100).toFixed(2);

        // Ensure percentage doesn't exceed 100
        if (percentage > 100) {
          percentage = 100;
        }
        tooltip
          .style("visibility", "visible")
          .html(`<strong>${provinceName}</strong><br>Infected: ${percentage}%`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY + 10 + "px");
      }
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px");
    })
    .on("mouseout", function () {
      tooltip.style("visibility", "hidden");
    });
});
