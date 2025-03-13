import {
  line,
  select,
  selectAll,
  transition,
  geoMercator,
  geoPath,
  json,
  csv,
  svg,
} from "d3";

const width = window.innerWidth * 0.9;
const height = window.innerHeight * 0.8;

const maps = ["distr", "cure"];
const projections = {};
const svgs = {};

// create svgs for both maps
maps.forEach((id) => {
  svgs[id] = select(`#${id}`)
    .selectAll("svg")
    .data([null])
    .join("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");;

  // initialize map for both containers
  projections[id] = geoMercator()
    .center([13.5, 47.5])    // centers map
    .scale(width * 5)
    .translate([width / 2, height / 2]);
});

const path = geoPath().projection(projections["distr"]);

// load map of Austria
json("oesterreich.json").then((data) => {
  maps.forEach((id) => {
    svgs[id]
      .selectAll(".land")
      .data(data.features)
      .enter()
      .append("path")
      .attr("class", "land")
      .attr("d", path)
      .attr("fill", "#d6e5cf")
      .attr("stroke", "#2a284b")
      .attr("stroke-width", 0.5)
      .append("title");
  });

  // load csv with location data (important: Do that within the json-thingy because otherwhise the dots were hiding behind the map :) )
  csv("travelorder_geo.csv").then((locations) => {
    maps.forEach((id) => {
      let circles = svgs[id]
        .selectAll(".location")
        .data(locations)
        .enter()
        .append("circle")
        .attr("class", "location")
        .attr("cx", (d) => projections[id]([+d.longitude, +d.latitude])[0])
        .attr("cy", (d) => projections[id]([+d.longitude, +d.latitude])[1])
        .attr("r", 6)
        .attr("fill", "#e1a145")
        .attr("stroke", "#2a284b")
        .attr("stroke-width", 0.5)
        .append("title")
        .text((d) => d.location);
    });

    window.addEventListener("resize", resize);

    // initialize animations
    setupScrollAnimation("distr", locations);
    setupButtonAnimation("cure", locations);
  });
});

// scroll animation for distribution map
function setupScrollAnimation(id, locations) {
  let animationStarted = false;
  let timeout;
  let orderedPoints = locations.map((d) => [+d.longitude, +d.latitude]);   // maps points to geo coordinates

  // starts animation as soon as element is visible with a little delay
  window.addEventListener("scroll", () => {
    if (animationStarted) return;                                         // animation can only be triggered once
    if (svgs[id].node().getBoundingClientRect().top < window.innerHeight) {
      animationStarted = true;
      timeout = setTimeout(() => {
        startDistributionAnimation(locations, orderedPoints);
      }, 2000);    // 2 seconds delay
    }
  });
}

// turns dots green and draws lines between dots to display the distribution route
function startDistributionAnimation(locations, orderedPoints) {
  // colour of dots change to green
  locations.forEach((d, i) => {
    svgs["distr"]
      .selectAll(".location")
      .filter((l) => l.location === d.location)
      .transition()
      .attr("fill", "#82afa2")
      .delay(i * 100)    // dots change colour one after the other
      .duration(1000);
  });

  // draws a line between the dots
  locations.forEach((d, i) => {
    // makes sure that the last pair of points is not connected
    if (i < locations.length - 1) {
      let lineGenerator = line()
        .x((d) => projections["distr"](d)[0])
        .y((d) => projections["distr"](d)[1]);

      // creates pairs of consecutively points
      let pointsPair = [orderedPoints[i], orderedPoints[i + 1]];

      // creates the line between each dots
      svgs["distr"]
        .append("path")
        .datum(pointsPair)
        .attr("fill", "none")
        .attr("stroke", "#82afa2")
        .attr("stroke-width", 2)
        .attr("d", lineGenerator)
        .style("opacity", 0)    // first the line is invisible (Note to myself: The line is already there, but should appear bit by bit :) )
        .transition()
        .delay(i * 100)    // lines appear one after the other
        .duration(1000)    // has to be the same as the colour chance function in order to animate simultaneously
        .style("opacity", 1);    // line becomes visible
    }
  });
}

// button animation for "cure"
function setupButtonAnimation(id, locations) {
  let animationStarted = false;

  // initialize start button
  select("#start-button").on("click", () => {
    if (animationStarted) return;
    animationStarted = true;
    startCureAnimation(locations);
  });
}

function startCureAnimation(locations) {
  locations.forEach((d, i) => {
    selectAll(".location")
      .filter((l) => l === d)
      .transition()
      .duration(200)
      .attr("fill", "#82afa2")
      .on("end", function () {
        let pointCoord = projections["cure"]([+d.longitude, +d.latitude]);

        let spreadCircle = svgs["cure"]
          .append("circle")
          .attr("cx", pointCoord[0])
          .attr("cy", pointCoord[1])
          .attr("r", 6)
          .attr("fill", "#82afa2");

        const randomDuration = Math.random() * 20000 + 5000;
        spreadCircle
          .transition()
          .duration(randomDuration)
          .attr("r", 45)
          .attr("opacity", 0.5);
      });
  });
}

// scroll effect for infobox-overlay over distribution map
document.addEventListener("scroll", () => {
  // selects needed section
  const scrolly = document.querySelector(".distr-scrolly");
  const distr = document.querySelector("#distr");

  // describes size and position of sticky element
  let distrRect = distr.getBoundingClientRect();

  let offset = window.innerHeight * 0.1;

  // creates the actual scrolling process
  let scrollProgress = Math.max(
    0,
    Math.min(1, 1 - (distrRect.top - offset) / window.innerHeight)
  );

  // defines length of scrolling process
  scrolly.style.transform = `translate(-40%, ${scrollProgress * 150}%)`;

  // makes infobox invisible at the end of scrolling
  scrolly.style.opacity = 1 - Math.max(0, scrollProgress - 0.8) * 5;
});
