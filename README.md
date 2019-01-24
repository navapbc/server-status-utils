# Server status utilities

This module provides an internal status page for Express based servers. The
status page is aimed for developers and shows useful info for diagnostics or
troubleshooting, for example the application version and recent requests.

See an [example of the status page](http://htmlpreview.github.io/?https://github.com/navapbc/server-status-utils/blob/master/example/example_status.html).

## Usage

To use, first require the module and create a ServerStatus object:

```javascript
const serverStatus = require("server-status-utils")
const ss = new serverStatus.ServerStatus()
```

Connect the collectRequestStats handler to track all requests (before all other handlers that may
respond to a request). It is safest to put this as the first handler:

```javascript
app.use("/", ss.collectRequestStats.bind(ss))
```

Connect the statusPage handler to a specific GET path of your choice. This can be done at any
point in your express handlers:

```javascript
app.get("/status", ss.statusPage.bind(ss))
```

A usage example is [included](example/example_server.js). To run the example use npm:

```
npm install
npm run example
```

## Tests

To run the test suite use npm:

```
npm install
npm test
```

A coverage report will be produced in the `coverage` directory.

