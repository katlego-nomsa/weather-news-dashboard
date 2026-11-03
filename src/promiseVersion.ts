import { printError } from "./errors";
import { NEWS_URL, WEATHER_URL, getCommentsUrl } from "./config";
import { printComments, printHeader, printNews, printWeather } from "./display";
import { fetchJson } from "./fetchJson";
import { CommentsResponse, NewsResponse, Post, WeatherResponse } from "./types";


function runChain(): Promise<void> {
  printHeader("PART 1: Promise chain");

  
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


function runRace(): Promise<void> {
  printHeader("PART 3: Promise.race (fastest response wins)");
  const start = Date.now();

  
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


printHeader("PROMISE VERSION");

runChain()
  .then(runAll)
  .then(runRace)
  .then(() => console.log("\nDone."))
    .catch(printError);