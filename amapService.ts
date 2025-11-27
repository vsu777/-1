import { CityData, GeoJSON } from "../types";
import { CHINA_GEO_JSON_URL, CITY_COORDINATES, PROVINCE_ALIASES } from "../constants";

// Cache for the GeoJSON
let cachedGeoJson: GeoJSON | null = null;

export const fetchChinaGeoJSON = async (): Promise<GeoJSON> => {
  if (cachedGeoJson) return cachedGeoJson;
  try {
    const response = await fetch(CHINA_GEO_JSON_URL);
    if (!response.ok) throw new Error("Failed to load map data");
    const data = await response.json();
    cachedGeoJson = data;
    return data;
  } catch (e) {
    console.error("Map fetch error:", e);
    throw e;
  }
};

export const searchCityLocation = async (queryName: string): Promise<CityData> => {
  // Normalize query: remove '市' suffix if present for city lookup
  // But keep original for province check potentially
  const cleanName = queryName.replace(/市$/, '');
  
  // 1. Check if it matches a known coordinate (City)
  // Try exact match first, then clean name
  const cityData = CITY_COORDINATES[queryName] || CITY_COORDINATES[cleanName];
  
  if (cityData) {
    return {
      name: queryName, // Use user input or key? Better to use the key found or input? Let's use clean key.
      coordinates: cityData.coordinates,
      type: 'city',
      province: cityData.province
    };
  }

  // 2. Check if it matches a Province
  const normalizedQuery = queryName.replace(/(省|市|自治区|特别行政区)$/, '');
  
  const isProvince = Object.values(PROVINCE_ALIASES).includes(normalizedQuery) || 
                     Object.keys(PROVINCE_ALIASES).includes(queryName) || 
                     Object.values(PROVINCE_ALIASES).includes(queryName);

  if (isProvince) {
    const shortName = PROVINCE_ALIASES[queryName] || (Object.values(PROVINCE_ALIASES).includes(queryName) ? queryName : normalizedQuery);
    return {
      name: shortName,
      type: 'province'
    };
  }

  // 3. Fallback
  throw new Error(`City '${queryName}' not found. Please try a major city.`);
};
