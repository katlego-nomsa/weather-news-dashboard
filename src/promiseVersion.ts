import { printError } from "./errors";
import { NEWS_URL, WEATHER_URL, getCommentsUrl } from "./config";
import { printComments, printHeader, printNews, printWeather } from "./display";
import { fetchJson } from "./fetchJson";
import { CommentsResponse, NewsResponse, Post, WeatherResponse } from "./types";

// ---------------------------------------------------------------
// PART 1: Promise chain (weather -> news -> comments)
// Same dependent calls as the callback version, but flat.
// One .catch() at the end handles an error from ANY step.
// ---------------------------------------------------------------
function runChain(): Promise<void> {
  printHeader("PART 1: Promise chain");

  // A chain's weakness: to use data from an earlier step later on,
  // it has to be saved in a variable outside the chain.
  let firstPost: Post | undefined;

  return fetchJson<WeatherResponse>(WEATHER_URL)
    .then((weather) => {
      printHeader("Weather");
      printWeather(weather);
      return fetchJson<NewsResponse>(NEWS_URL);
    })
    .then((news) => {
      printHeader("News headlines");
      printNews(news.posts);

      firstPost = news.posts[0];
      if (!firstPost) throw new Error("No news posts were returned");
      return fetchJson<CommentsResponse>(getCommentsUrl(firstPost.id));
    })
    .then((comments) => {
      printHeader("Comments on the top story");
      printComments(firstPost?.title ?? "", comments.comments);
    });
}

// ---------------------------------------------------------------
// PART 2: Promise.all()
// Weather and news do not depend on each other, so start both at
// once and wait until BOTH are finished. If either one fails,
// the whole Promise.all() fails.
// ---------------------------------------------------------------
function runAll(): Promise<void> {
  printHeader("PART 2: Promise.all (weather + news at the same time)");
  const start = Date.now();

  return Promise.all([
    fetchJson<WeatherResponse>(WEATHER_URL),
    fetchJson<NewsResponse>(NEWS_URL),
  ]).then(([weather, news]) => {
    printWeather(weather);
    console.log("");
    printNews(news.posts);
    console.log(`\nBoth finished after ${Date.now() - start} ms`);
  });
}

// ---------------------------------------------------------------
// PART 3: Promise.race()
// Start both requests and use whichever one finishes FIRST.
// The slower request keeps running, but we ignore its result.
// ---------------------------------------------------------------
function runRace(): Promise<void> {
  printHeader("PART 3: Promise.race (fastest response wins)");
  const start = Date.now();

  // Label each result so we can tell which request won
  const weatherRequest = fetchJson<WeatherResponse>(WEATHER_URL).then((data) => ({
    source: "weather" as const,
    data,
  }));
  const newsRequest = fetchJson<NewsResponse>(NEWS_URL).then((data) => ({
    source: "news" as const,
    data,
  }));

  return Promise.race([weatherRequest, newsRequest]).then((winner) => {
    console.log(`Fastest: ${winner.source} (after ${Date.now() - start} ms)`);
    if (winner.source === "weather") {
      printWeather(winner.data);
    } else {
      printNews(winner.data.posts);
    }
  });
}

// ---------------------------------------------------------------
// Run the three parts one after another
// ---------------------------------------------------------------
printHeader("PROMISE VERSION");

runChain()
  .then(runAll)
  .then(runRace)
  .then(() => console.log("\nDone."))
  .catch(printError);