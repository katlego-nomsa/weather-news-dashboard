export type ErrorKind = "network" | "timeout" | "http" | "parse";

/** One error type used by all three versions. */
export class ApiError extends Error {
  constructor(
    public source: string, // which request failed
    public kind: ErrorKind, // what kind of failure it was
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** "https://dummyjson.com/posts?limit=5" becomes "dummyjson.com/posts" */
export function sourceName(url: string): string {
  const { hostname, pathname } = new URL(url);
  return `${hostname}${pathname}`;
}

/** Turns a raw Node network error into a readable ApiError. */
export function networkError(url: string, err: NodeJS.ErrnoException): ApiError {
  const source = sourceName(url);
  switch (err.code) {
    case "ENOTFOUND":
      return new ApiError(source, "network", "Could not find the server. Check your internet connection or the web address.");
    case "ECONNREFUSED":
      return new ApiError(source, "network", "The server refused the connection.");
    case "ECONNRESET":
      return new ApiError(source, "network", "The connection was cut off before the server finished replying.");
    default:
      return new ApiError(source, "network", err.message);
  }
}

/** Prints any error in the same readable format, and marks the run as failed. */
export function printError(err: unknown): void {
  console.error("\n[ERROR]");
  if (err instanceof ApiError) {
    console.error(`  Source:  ${err.source}`);
    console.error(`  Type:    ${err.kind}`);
    if (err.statusCode) console.error(`  Status:  ${err.statusCode}`);
    console.error(`  Message: ${err.message}`);
  } else if (err instanceof Error) {
    console.error(`  Message: ${err.message}`);
  } else {
    console.error(`  Message: ${String(err)}`);
  }
  process.exitCode = 1; // non-zero exit code means "this run failed"
}