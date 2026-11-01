// Weather: Open-Meteo (free, no API key needed)
// Change the coordinates to your own location if you like
export const LATITUDE = -26.2041; // Johannesburg
export const LONGITUDE = 28.0473;

export const WEATHER_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current_weather=true`;

// News: DummyJSON posts (free, no API key needed)
export const NEWS_URL = "https://dummyjson.com/posts?limit=5";