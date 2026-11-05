import https from "https";
import { NEWS_URL, WEATHER_URL, getCommentsUrl } from "./config";
import { printComments, printHeader, printNews, printWeather } from "./display";
import { ApiError, networkError, printError, sourceName } from "./errors";
import { CommentsResponse, NewsResponse, WeatherResponse } from "./types";


type Callback<T> = (error: ApiError | null, data?: T) => void;


function fetchJson<T>(url: string, callback: Callback<T>): void {
  const source = sourceName(url);

  
  let finished = false;
  const done: Callback<T> = (error, data) => {
    if (finished) return;
    finished = true;
    callback(error, data);
  };

  const request = https.get(url, (res) => {
    if (res.statusCode !== 200) {
      res.resume(); 
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

  
  request.setTimeout(10000, () =>
    request.destroy(new ApiError(source, "timeout", "The server took longer than 10 seconds to respond"))
  );

  
  request.on("error", (err: NodeJS.ErrnoException) =>
    done(err instanceof ApiError ? err : networkError(url, err))
  );
}


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