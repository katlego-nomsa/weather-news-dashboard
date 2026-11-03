import { printError } from "./errors";
import { NEWS_URL, WEATHER_URL, getCommentsUrl } from "./config";
import { printComments, printHeader, printNews, printWeather } from "./display";
import { fetchJson } from "./fetchJson";
import { CommentsResponse, NewsResponse, WeatherResponse } from "./types";

async function runSequential(): Promise<void> {
  printHeader("PART 1: Dependent calls with await");

  const weather = await fetchJson<WeatherResponse>(WEATHER_URL);
  printHeader("Weather");
  printWeather(weather);

  const news = await fetchJson<NewsResponse>(NEWS_URL);
  printHeader("News headlines");
  printNews(news.posts);

  const firstPost = news.posts[0];
  if (!firstPost) throw new Error("No news posts were returned");

  const comments = await fetchJson<CommentsResponse>(getCommentsUrl(firstPost.id));
  printHeader("Comments on the top story");
  printComments(firstPost.title, comments.comments);
}


async function runParallel(): Promise<void> {
  printHeader("PART 2: Sequential vs Promise.all");

  
  let start = Date.now();
  await fetchJson<WeatherResponse>(WEATHER_URL);
  await fetchJson<NewsResponse>(NEWS_URL);
  const sequentialMs = Date.now() - start;

  
  start = Date.now();
  const [weather, news] = await Promise.all([
    fetchJson<WeatherResponse>(WEATHER_URL),
    fetchJson<NewsResponse>(NEWS_URL),
  ]);
  const parallelMs = Date.now() - start;

  printWeather(weather);
  console.log("");
  printNews(news.posts);
  console.log(`\nOne after another: ${sequentialMs} ms`);
  console.log(`Promise.all:       ${parallelMs} ms`);
}


async function runRace(): Promise<void> {
  printHeader("PART 3: Promise.race (fastest response wins)");
  const start = Date.now();

  const winner = await Promise.race([
    fetchJson<WeatherResponse>(WEATHER_URL).then((data) => ({ source: "weather" as const, data })),
    fetchJson<NewsResponse>(NEWS_URL).then((data) => ({ source: "news" as const, data })),
  ]);

  console.log(`Fastest: ${winner.source} (after ${Date.now() - start} ms)`);
  if (winner.source === "weather") {
    printWeather(winner.data);
  } else {
    printNews(winner.data.posts);
  }
}


async function main(): Promise<void> {
  printHeader("ASYNC/AWAIT VERSION");

  try {
    await runSequential();
    await runParallel();
    await runRace();
    console.log("\nDone.");
    } catch (err) {
    printError(err);
  } finally {
    
    console.log("(finished)");
  }
}

main();