import https from "https";

/** Fetches a URL with the https module and returns a Promise of the parsed JSON. */
export function fetchJson<T>(url: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const request = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        res.resume(); // discard the body so the connection closes
        return reject(new Error(`Request failed with status ${res.statusCode}`));
      }

      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error("Response was not valid JSON"));
        }
      });
    });

    // Give up if the server takes longer than 10 seconds
    request.setTimeout(10000, () => request.destroy(new Error("Request timed out")));

    // Network problems (no internet, DNS failure, timeout)
    request.on("error", reject);
  });
}