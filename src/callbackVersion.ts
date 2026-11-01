import https from "https";
import { NEWS_URL, WEATHER_URL, getCommentsUrl } from "./config";
import { printComments, printHeader, printNews, printWeather } from "./display";
import { ApiError, networkError, printError, sourceName } from "./errors";
import { CommentsResponse, NewsResponse, WeatherResponse } from "./types";

// Node-style callback: the first argument is an error (or null), the second is the data
type Callback<T> = (error: ApiError | null, data?: T) => void;

/** Fetches a URL with the https module and gives the parsed JSON to a callback. */
function fetchJson<T>(url: string, callback: Callback<T>): void {
  const source = sourceName(url);

  // Make sure the callback runs only once, even if several things go wrong
  let finished = false;
  const done: Callback<T> = (error, data) => {
    if (finished) return;
    finished = true;
    callback(error, data);
  };

  const request = https.get(url, (res) => {
    if (res.statusCode !== 200) {
      res.resume(); // discard the body so the connection closes
      return done(
        new ApiError(source, "http", `The server replied with status ${res.statusCode}`, res.statusCode)
      );
    }

    let raw = "";
    res.on("data", (chunk) => (raw += chunk));
    res.on("end", () => {
      let parsed: T;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return done(new ApiError(source, "parse", "The server's reply was not valid JSON"));
      }
      done(null, parsed);
    });
  });

  // Give up if the server takes longer than 10 seconds
  request.setTimeout(10000, () =>
    request.destroy(new ApiError(source, "timeout", "The server took longer than 10 seconds to respond"))
  );

  // Network problems (no internet, DNS failure, timeout)
  request.on("error", (err: NodeJS.ErrnoException) =>
    done(err instanceof ApiError ? err : networkError(url, err))
  );
}

// ---------------------------------------------------------------
// CALLBACK HELL: each request needs the one before it to finish,
// so every step is nested inside the previous callback.
// Notice the pyramid shape and the error check repeated 3 times.
// ---------------------------------------------------------------
printHeader("CALLBACK VERSION");

fetchJson<WeatherResponse>(WEATHER_URL, (weatherError, weather) => {
  if (weatherError || !weather) {
    return printError(weatherError);
  }
  printHeader("Weather");
  printWeather(weather);

  fetchJson<NewsResponse>(NEWS_URL, (newsError, news) => {
    if (newsError || !news) {
      return printError(newsError);
    }
    printHeader("News headlines");
    printNews(news.posts);

    const firstPost = news.posts[0];
    if (!firstPost) return;

    fetchJson<CommentsResponse>(getCommentsUrl(firstPost.id), (commentsError, comments) => {
      if (commentsError || !comments) {
        return printError(commentsError);
      }
      printHeader("Comments on the top story");
      printComments(firstPost.title, comments.comments);
      console.log("\nDone.");
    });
  });
});