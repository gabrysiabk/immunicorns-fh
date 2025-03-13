import {
  axisBottom,
  axisLeft,
  extent,
  min,
  max,
  line,
  scaleLinear,
  pointer,
  transition,
  median,
  quantile,
  select,
  easeLinear,
} from 'd3';

import { getData, getDataIll } from './getData-vitals.js';

const getColumnData = (data, columnName) => data.map((d) => d[columnName]);

const createGrid = (svgElement, scaleY, positionX) => {
  // Add horizontal grid lines at each major tick
  const ticks = scaleY.ticks(); // Get major tick values

  // create a group for the grid
  const group = svgElement
    .selectAll('g')
    .data([null])
    .join('g')
    .attr('class', 'ticks');

  // create a function that plots the line according to scaleY
  const pathline = line(
    (d) => d.x,
    (d) => scaleY(d.y)
  );

  // create a d element for each tick so the gridlines are created
  group
    .selectAll('path')
    .data(
      ticks.map((tick) => {
        return [
          { x: 40, y: tick },
          { x: positionX + 50, y: tick },
        ];
      })
    )
    .join('path')
    .transition(transition().duration(500))
    .attr('d', pathline)
    .attr('stroke', 'lightgray') // Light gray for grid lines
    .attr('stroke-width', 1);
};

const createBoxplot = (
  dataArray,
  svgElement,
  boxWidth,
  positionX,
  scaleY,
  minAll,
  categoryLabel
) => {
  // create group for each category that gets a boxplot
  const group = svgElement
    .selectAll(`g.${categoryLabel}`)
    .data([null])
    .join('g')
    .attr('class', 'boxplot');

  // calculate the statistical values to later create the boxplot
  const minValue = min(dataArray);
  const q1 = quantile(dataArray, 0.25);
  const medianValue = median(dataArray);
  const q3 = quantile(dataArray, 0.75);
  const maxValue = max(dataArray);

  // create the box of the boxplot
  group
    .selectAll('rect')
    .data([null])
    .join('rect')
    .transition(transition().duration(500))
    .attr('x', positionX - 20) // Center the box
    .attr('y', scaleY(q3)) // Start at Q3 (higher value)
    .attr('width', boxWidth) // Box width
    .attr('height', scaleY(q1) - scaleY(q3)) // Box height from Q3 to Q1
    .attr('fill', '#e1a145')
    .attr('stroke', 'black');

  // Draw the median line
  group
    .selectAll('g.median-line') // Use a class to differentiate
    .data([null])
    .join('line')
    .transition(transition().duration(500))
    .attr('class', 'median-line') // Set the class
    .attr('x1', positionX - boxWidth / 2)
    .attr('x2', positionX + boxWidth / 2)
    .attr('y1', scaleY(medianValue))
    .attr('y2', scaleY(medianValue))
    .attr('stroke', 'black')
    .attr('stroke-width', 2);

  // Draw the min-max lines (whiskers)
  group
    .selectAll('g.whisker-line') // Different class name
    .data([null])
    .join('line')
    .transition(transition().duration(500))
    .attr('class', 'whisker-line') // Set the class
    .attr('x1', positionX)
    .attr('x2', positionX)
    .attr('y1', scaleY(minValue))
    .attr('y2', scaleY(q1))
    .attr('stroke', 'black');

  // Draw the median line
  group
    .selectAll('.median-line')
    .data([null])
    .join('line')
    .transition(transition().duration(500))
    .attr('class', 'median-line')
    .attr('x1', positionX - boxWidth / 2)
    .attr('x2', positionX + boxWidth / 2)
    .attr('y1', scaleY(medianValue))
    .attr('y2', scaleY(medianValue))
    .attr('stroke', 'black')
    .attr('stroke-width', 2);

  // Draw the min-max lines (whiskers)
  group
    .selectAll('.whisker-line-min')
    .data([null])
    .join('line')
    .transition(transition().duration(500))
    .attr('class', 'whisker-line-min')
    .attr('x1', positionX)
    .attr('x2', positionX)
    .attr('y1', scaleY(minValue))
    .attr('y2', scaleY(q1))
    .attr('stroke', 'black');

  group
    .selectAll('.whisker-line-max')
    .data([null])
    .join('line')
    .transition(transition().duration(500))
    .attr('class', 'whisker-line-max')
    .attr('x1', positionX)
    .attr('x2', positionX)
    .attr('y1', scaleY(q3))
    .attr('y2', scaleY(maxValue))
    .attr('stroke', 'black');

  // Draw the whisker caps
  group
    .selectAll('.whisker-cap-min')
    .data([null])
    .join('line')
    .transition(transition().duration(500))
    .attr('class', 'whisker-cap-min')
    .attr('x1', positionX - 10)
    .attr('x2', positionX + 10)
    .attr('y1', scaleY(minValue))
    .attr('y2', scaleY(minValue))
    .attr('stroke', 'black');

  group
    .selectAll('.whisker-cap-max')
    .data([null])
    .join('line')
    .transition(transition().duration(500))
    .attr('class', 'whisker-cap-max')
    .attr('x1', positionX - 10)
    .attr('x2', positionX + 10)
    .attr('y1', scaleY(maxValue))
    .attr('y2', scaleY(maxValue))
    .attr('stroke', 'black');
  
  //  add a tooltip with the statistics over the svg group
  const tooltip = select('.tooltip-vitals');

  group.on('mouseover', (event) => {
    const [xPos, yPos] = pointer(event);
    tooltip
      .style('display', 'block')
      .style('top', `${yPos}px`)
      .style('left', `${xPos}px`)
      .style('background-color', '#d6e5cf')
      .style('color', `white`)
      .html(
        `max: ${maxValue} <BR/> q3: ${q3} <BR/> median: ${medianValue} <BR/> q1: ${q1} <BR/> min: ${minValue}`
      )
      .on('mouseleave', (event) => {
        setTimeout(() => tooltip.style('display', 'none'), 500);
      });
  });

  // Plot an axis scale
  group
    .selectAll('.y-axis')
    .data([null])
    .join('g') // 'g' should be used instead of 'y-axis'
    .attr('class', 'y-axis')
    .attr('transform', 'translate(40, 0)') // Move the axis to the left
    .call(axisLeft(scaleY));

  // Add category label below the boxplot
  svgElement
    .append('text')
    .attr('x', positionX) // Centered below the boxplot
    .attr('y', scaleY(minAll) + 60) // Slightly below the min value
    .attr('text-anchor', 'middle') // Center text alignment
    .attr('font-size', '14px')
    .attr('fill', 'black')
    .text(categoryLabel);
};

const createSelect = (numericColumns) => {
  const featureSelect = select('#feature-select');
  featureSelect
    .selectAll('option')
    .data(numericColumns)
    .join('option')
    .attr('value', (d) => d.toLowerCase())
    .html((d) => d);
  return featureSelect;
};

const main = async () => {
  const { data_healthy, columns, getDataByGender, numericColumns } =
    await getData('./healthyControlGroup.csv');
  // console.log(data_healthy, columns);

  const { data_ill, columns2, getDataByGender2, numericColumns2 } =
    await getDataIll('./infectedTestSubject.csv');
  // console.log(data_ill, columns2, numericColumns2);

  const width = 500;
  const height = 500;
  const margin = { top: 20, right: 30, bottom: 60, left: 30 };

  const svg = select('#vitals')
    .selectAll('svg')
    .data([null])
    .join('svg')
    .attr('width', width)
    .attr('height', height);

  const createChart = (width, data_healthy, data_ill, feature) => {
    // get the data of a specific feature of the data for both healthy and ill (e.g. 'temperature')
    const columnHealthyArray = getColumnData(data_healthy, feature);
    const columnIllArray = getColumnData(data_ill, feature);

    // calculate the min and max of both data arrays
    const minHealthy = min(columnHealthyArray);
    const minIll = min(columnIllArray);
    const maxHealthy = max(columnHealthyArray);
    const maxIll = max(columnIllArray);

    // calculate the overall min and max of the two data arrays
    const minAll = Math.min(minHealthy, minIll);
    const maxAll = Math.max(maxHealthy, maxIll);
    const rangeAll = maxAll - minAll;

    // define a linear scale for the data values
    const scaleY = scaleLinear()
      .domain([minAll - 0.1 * rangeAll, maxAll + 0.1 * rangeAll]) // domain from min - 10% of the overall range to max + 10% of overall
      .range([height - margin.bottom, margin.top]); // Invert range (higher values at the top)

    // define positions of the two boxplots
    const posX1 = (width * 1) / 3; // Place the box plot on the X-axis
    const posX2 = (width * 2) / 3;

    // call figure creation functions
    createGrid(svg, scaleY, posX2);
    createBoxplot(
      columnHealthyArray,
      svg,
      40,
      posX1,
      scaleY,
      minAll,
      'healthy'
    );
    createBoxplot(columnIllArray, svg, 40, posX2, scaleY, minAll, 'ill');
  };
  createChart(width, data_healthy, data_ill, 'bmi');

  // create selection tool and change data when selection is altered
  const features = createSelect(numericColumns);
  features.on('change', (event) => {
    const { currentTarget } = event;
    let featureToShow = currentTarget.value.toString();
    createChart(width, data_healthy, data_ill, featureToShow);
  });
};

window.onresize = main;
main();
