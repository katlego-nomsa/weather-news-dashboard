export type ErrorKind = "network" | "timeout" | "http" | "parse";


export class ApiError extends Error {
  constructor(
    public source: string, 
    public kind: ErrorKind, 
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}


export function sourceName(url: string): string {
  const { hostname, pathname } = new URL(url);
  return `${hostname}${pathname}`;
}


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
  process.exitCode = 1; 
}