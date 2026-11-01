import { printError } from "./errors";
import { NEWS_URL, WEATHER_URL, getCommentsUrl } from "./config";
import { printComments, printHeader, printNews, printWeather } from "./display";
import { fetchJson } from "./fetchJson";
import { CommentsResponse, NewsResponse, WeatherResponse } from "./types";

// ---------------------------------------------------------------
// PART 1: Dependent calls (weather -> news -> comments)
// Each await pauses THIS function until the request finishes,
// but Node keeps running other work meanwhile. No nesting, and
// firstPost is a normal variable, so no tricks are needed.
// ---------------------------------------------------------------
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

// ---------------------------------------------------------------
// PART 2: Sequential vs parallel
// Weather and news do not depend on each other, so awaiting them
// one after another is wasteful. Promise.all() starts both at
// once. We time both ways so you can see the difference.
// ---------------------------------------------------------------
async function runParallel(): Promise<void> {
  printHeader("PART 2: Sequential vs Promise.all");

  // Slow way: the news request does not even start until weather is done
  let start = Date.now();
  await fetchJson<WeatherResponse>(WEATHER_URL);
  await fetchJson<NewsResponse>(NEWS_URL);
  const sequentialMs = Date.now() - start;

  // Fast way: both requests are in flight at the same time
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

// ---------------------------------------------------------------
// PART 3: Promise.race()
// Use whichever response arrives first.
// ---------------------------------------------------------------
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

// ---------------------------------------------------------------
// MAIN: try...catch replaces .catch(). If any await below fails,
// execution jumps straight to the catch block.
// ---------------------------------------------------------------
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
    // finally always runs, whether the code above succeeded or failed
    console.log("(finished)");
  }
}

main();