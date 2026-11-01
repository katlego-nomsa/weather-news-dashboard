import https from "https";
import { ApiError, networkError, sourceName } from "./errors";

/** Fetches a URL with the https module and returns a Promise of the parsed JSON. */
export function fetchJson<T>(url: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const source = sourceName(url);

    const request = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        res.resume(); // discard the body so the connection closes
        return reject(
          new ApiError(source, "http", `The server replied with status ${res.statusCode}`, res.statusCode)
        );
      }

      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new ApiError(source, "parse", "The server's reply was not valid JSON"));
        }
      });
    });

    // Give up if the server takes longer than 10 seconds
    request.setTimeout(10000, () =>
      request.destroy(new ApiError(source, "timeout", "The server took longer than 10 seconds to respond"))
    );

    // Network problems (no internet, DNS failure, timeout)
    request.on("error", (err: NodeJS.ErrnoException) =>
      reject(err instanceof ApiError ? err : networkError(url, err))
    );
  });
}