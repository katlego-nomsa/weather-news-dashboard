

export const LATITUDE = -26.2041; 
export const LONGITUDE = 28.0473;

export const WEATHER_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current_weather=true`;


export const NEWS_URL = "https://dummyjson.com/posts?limit=5";


export const getCommentsUrl = (postId: number) =>
  `https://dummyjson.com/posts/${postId}/comments`;