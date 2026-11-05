# Async Weather & News Dashboard

A Node.js + TypeScript project that fetches weather data and news headlines from public APIs, and shows the **same job written three ways**: callbacks, promises, and async/await. It also demonstrates `Promise.all()` and `Promise.race()`.

## APIs used
- **Weather:** [Open-Meteo](https://open-meteo.com/) (free, no API key)
- **News and comments:** [DummyJSON posts](https://dummyjson.com/docs/posts) (free, no API key)

No API keys or `.env` file are needed.

## Getting started
Requires Node.js 18 or newer.

```bash
npm install
npm run callback   # callback version
npm run promise    # promise version
npm run async      # async/await version
```

Other scripts:

```bash
npm run build      # type-check and compile to dist/
```

To change the location, edit `LATITUDE` and `LONGITUDE` in `src/config.ts`.

## Project structure
```
src/
├── config.ts             # API addresses and location
├── types.ts              # TypeScript types for the API responses
├── display.ts            # Shared printing functions (same output for all versions)
├── errors.ts             # ApiError type and readable error printing
├── fetchJson.ts          # Promise-based https helper (used by versions 2 and 3)
├── callbackVersion.ts    # Version 1: callbacks (has its own callback-based helper)
├── promiseVersion.ts     # Version 2: promises, Promise.all, Promise.race
└── asyncAwaitVersion.ts  # Version 3: async/await with try...catch
```

## What each version does
Every version fetches weather, then news, then the comments on the first news post. The last request needs the post's ID from the news result, so these three requests **depend on each other** and must run in order.

### 1. Callback version (`npm run callback`)
Uses Node's `https` module. Each request takes a callback that runs when the response arrives. Because each step needs the previous result, the calls are nested inside each other. This is **callback hell**: the code drifts to the right and the error check is repeated at every level.

### 2. Promise version (`npm run promise`)
`fetchJson()` returns a Promise. The three dependent calls become a flat `.then()` chain with one `.catch()` at the end. It also includes:
- **`Promise.all()`**: starts weather and news at the same time and waits for both. If either fails, the whole thing fails.
- **`Promise.race()`**: starts both and uses whichever finishes first.

### 3. Async/await version (`npm run async`)
The same logic written to read top to bottom. Errors are handled with `try...catch...finally`. Part 2 times a sequential run against `Promise.all()` to show the speed-up.

## Error handling
All three versions use one `ApiError` type with a **source** (which request failed), a **kind** (`network`, `timeout`, `http` or `parse`) and a readable message. `printError()` prints every error in the same format. Requests give up after 10 seconds.

## Sample output

> Values such as temperatures, headlines and timings will differ each time you run it.

### Callback version
```
PASTE YOUR REAL OUTPUT OF npm run callback HERE
```

### Promise version
```
PASTE YOUR REAL OUTPUT OF npm run promise HERE
```

### Async/await version
```
PASTE YOUR REAL OUTPUT OF npm run async HERE
```

### Error output (same format in all three versions)
Network error (weather address changed to a non-existent host):
```
[ERROR]
  Source:  api.open-meteo.invalid/v1/forecast
  Type:    network
  Message: Could not find the server. Check your internet connection or the web address.
```

HTTP error (news address changed to a page that does not exist):
```
[ERROR]
  Source:  dummyjson.com/postz
  Type:    http
  Status:  404
  Message: The server replied with status 404
```

## Comparison

| | Callbacks | Promises | Async/await |
|---|---|---|---|
| Dependent calls | Nested pyramid | Flat `.then()` chain | Reads top to bottom |
| Error handling | Check in every callback | One `.catch()` | `try...catch` |
| Sharing data between steps | Variables from outer scopes | Needs a variable outside the chain | Normal variables |
| Running in parallel | Manual bookkeeping | `Promise.all()` | `await Promise.all()` |
| Readability | Hardest | Better | Best |

## Learning outcomes

**The event loop.** Node runs your JavaScript on a single thread. A network request does not block it: Node hands the request off, keeps running other code, and when the response arrives, the callback (or promise handler) is queued and runs when the thread is free. All three styles are different ways of saying "run this code later, when the data arrives."

**Callbacks** are the original pattern, but dependent calls nest deeper with every step and each level needs its own error check.

**Promises** represent a value that will arrive later. They can be chained flat, and one `.catch()` handles an error from any step. A weakness is sharing data between steps in a chain.

**Async/await** is built on promises. `await` pauses only the current function, not the whole program, so code reads in order while Node stays free to do other work.

**`Promise.all()` vs sequential `await`.** Awaiting two independent requests one after another takes about the sum of both times. `Promise.all()` starts both at once and takes about as long as the slower one. In the async version, the "Sequential vs Promise.all" timing in the sample output shows this.

**`Promise.race()`** resolves or rejects with whichever promise settles first. The slower request still runs, but its result is ignored.

**Consistent error handling.** Converting low-level errors (like `ENOTFOUND`) into one `ApiError` type with a readable message means every version reports problems the same way.

## Notes
- Requests are made with Node's built-in `https` module (no `fetch` or `axios`), as the task requires.
- The APIs are free public services and may occasionally return errors such as 503. The error handling is designed to show a clear message in that case.
