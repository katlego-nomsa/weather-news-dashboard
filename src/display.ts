import { Comment, Post, WeatherResponse } from "./types";

export function printHeader(title: string): void {
  console.log(`\n=== ${title} ===`);
}

export function printWeather(weather: WeatherResponse): void {
  const w = weather.current_weather;
  console.log(`Temperature: ${w.temperature}°C`);
  console.log(`Wind speed:  ${w.windspeed} km/h`);
  console.log(`Time:        ${w.time}`);
}

export function printNews(posts: Post[]): void {
  posts.forEach((post, i) => {
    console.log(`${i + 1}. ${post.title}`);
  });
}

export function printComments(postTitle: string, comments: Comment[]): void {
  console.log(`Comments on "${postTitle}":`);
  if (comments.length === 0) {
    console.log("  (no comments)");
    return;
  }
  comments.forEach((c) => {
    console.log(`  - ${c.user.username}: ${c.body}`);
  });
}