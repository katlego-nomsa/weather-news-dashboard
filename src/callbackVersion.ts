import https from "https";
import { NEWS_URL, WEATHER_URL, getCommentsUrl } from "./config";
import { printComments, printHeader, printNews, printWeather } from "./display";
import { CommentsResponse, NewsResponse, WeatherResponse } from "./types";

// Node-style callback: the first argument is an error (or null), the second is the data
type Callback<T> = (error: Error | null, data?: T) => void;

/** Fetches a URL with the https module and gives the parsed JSON to a callback. */
function fetchJson<T>(url: string, callback: Callback<T>): void {
  const request = https.get(url, (res) => {
    if (res.statusCode !== 200) {
      res.resume(); // discard the body so the connection closes
      return callback(new Error(`Request failed with status ${res.statusCode}`));
    }

    let raw = "";
    res.on("data", (chunk) => (raw += chunk));
    res.on("end", () => {
      let parsed: T;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return callback(new Error("Response was not valid JSON"));
      }
      callback(null, parsed);
    });
  });

  // Give up if the server takes longer than 10 seconds
  request.setTimeout(10000, () => request.destroy(new Error("Request timed out")));

  // Network problems (no internet, DNS failure, timeout)
  request.on("error", (err) => callback(err));
}

// ---------------------------------------------------------------
// CALLBACK HELL: each request needs the one before it to finish,
// so every step is nested inside the previous callback.
// Notice the pyramid shape and the error check repeated 3 times.
// ---------------------------------------------------------------
printHeader("CALLBACK VERSION");

fetchJson<WeatherResponse>(WEATHER_URL, (weatherError, weather) => {
  if (weatherError || !weather) {
    console.error(`Weather failed: ${weatherError?.message}`);
    return;
  }
  printHeader("Weather");
  printWeather(weather);

  fetchJson<NewsResponse>(NEWS_URL, (newsError, news) => {
    if (newsError || !news) {
      console.error(`News failed: ${newsError?.message}`);
      return;
    }
    printHeader("News headlines");
    printNews(news.posts);

    const firstPost = news.posts[0];
    if (!firstPost) return;

    fetchJson<CommentsResponse>(getCommentsUrl(firstPost.id), (commentsError, comments) => {
      if (commentsError || !comments) {
        console.error(`Comments failed: ${commentsError?.message}`);
        return;
      }
      printHeader("Comments on the top story");
      printComments(firstPost.title, comments.comments);
      console.log("\nDone.");
    });
  });
});