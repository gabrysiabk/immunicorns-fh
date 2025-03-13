import { csv } from "d3";

const numericColumns = [
  'BMI',
  'Age',
  'Height',
  'Weight',
  'HearthbeatRate',
  'RespiratoryRate',
  'DiastolicPressure',
  'SystolicPressure',
  'Temperature'
];

const initRow = (d) => {
  const keys = Object.keys(d);
  return keys.reduce((acc, key) => {
    const value = numericColumns.includes(key) ? +d[key] : d[key];
    return { ...acc, [key.toLowerCase()]: value };
  }, {});
};

export const getData = async (url) => {
  const data_healthy = await csv(url, initRow);
  const getDataByGender = (gender) => data_healthy.filter((d) => d.gender === gender);
  const columns = data_healthy.columns.map((d) => d.toLowerCase());
  return { data_healthy, columns, getDataByGender, numericColumns };
};

// same function as getData but a second time to import ill data
export const getDataIll = async (url) => {
  const data_ill = await csv(url, initRow);
  const getDataByGender2 = (gender) => data_ill.filter((d) => d.gender === gender);
  const columns2 = data_ill.columns.map((d) => d.toLowerCase());
  return { data_ill, columns2, getDataByGender2, numericColumns };
};
