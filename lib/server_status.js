//
// Server status page showing useful info for diagnostics or troubleshooting.
//
// Includes middleware to collect request statistics for all requests.
//

const os = require("os")
const escapeHTML = require("underscore.string/escapeHTML")
const ipaddr = require("ipaddr.js")
const sprintf = require("sprintf-js").sprintf

const html = require("./html")
const programMeta = require("./program_meta")
const requestCounter = require("./request_counter")
const time = require("./time")

// Environment variables matching this pattern are hidden.
const SECRET_REGEXP = RegExp("pass|key|secret|jwt")

// Number of recent requests to display.
const MAX_RECENT_REQUESTS = 100

// How long to keep RPS data in seconds.
const OLDEST_REQUEST_TIME = 300

// HTML template for status page.
const STATUS_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <title>%(title)s</title>
  <style type='text/css'>
    html { font-family: sans-serif; }
    h1, h2 { color: #558; }
    table { border-collapse: collapse; font-size: 90%%; }
    th, td { border: solid 1px gray; padding: 3px; }
  </style>
</head>

<body>
<h1>%(title)s</h1>

<dl>
<dt id="started">Started: %(start_time)s (%(start_time_ago)s ago)</dt>
<dt>Version: %(version)s</dt>
<dt>Node version: %(nodejs)s</dt>
<dt>Platform: %(platform)s</dt>
<dt>Hostname: %(hostname)s</dt>
<dt>User: %(user)s</dt>
<dt>Command line: %(command_line)s</dt>
<dt>Memory usage: RSS %(memory_rss)i,
  heap %(memory_heap_used)i/%(memory_heap_total)i,
  external %(memory_external)i</dt>
<dt>Local address: %(local_addr)s</dt>
<dt>Remote address: %(remote_addr)s</dt>
</dl>

<h2>Request statistics</h2>
<dl>
<dt id="totalrequests">Total requests: %(total_requests)i</dt>
<dt id="rps">Requests per second: 5s %(rps_5s).1frps,
  60s %(rps_60s).1frps, 5m %(rps_300s).1frps</dt>
</dl>
%(requests)s
<p>(Top 100 by total count)</p>

<h2>Recent requests</h2>
%(recent_requests)s

<h2>Environment</h2>
%(env)s

</body></html>
`

//
// Class for rendering and support for a server status page.
//
class ServerStatus {
  //
  // Constructor for a ServerStatus object.
  //
  constructor() {
    // Program name and version.
    this.program = programMeta.getProgramVersion()

    // Server start time approximated by the time this object is created.
    this.startTime = new Date()

    // Global count of requests for display on the status page.
    this.requestCount = new requestCounter.RequestCounter()

    // Array of recent requests, most recent first. MAX_RECENT_REQUESTS are kept.
    this.recentRequests = []

    // Array of recent request start times, most recent first. Kept to
    // OLDEST_REQUEST_TIME ago.
    this.recentRequestTimes = []
  }

  //
  // Middleware that keeps a count of requests for display on the status page.
  //
  // Express has no way to install middleware that is called at the end of request
  // handling. Instead, this middleware should be installed at the beginning. It
  // then uses the 'finish' event on the response to record statistics.
  //
  collectRequestStats(req, res, next) {
    const entry = {
      request: req,
      remoteIp: req.ip,
      response: res,
      startTime: new Date(),
      finished: false,
    }
    this.recentRequests.unshift(entry)
    this.recentRequests.splice(MAX_RECENT_REQUESTS)

    const requestTime = entry.startTime.getTime()
    this.recentRequestTimes.unshift(requestTime)
    const expired = this.recentRequestTimes.findIndex(
        x => x < requestTime - OLDEST_REQUEST_TIME * 1000)
    if (expired !== -1) {
      this.recentRequestTimes.splice(expired)
    }

    res.on("finish", () => {
      this.requestCount.countRequest(req, res)
      entry.finished = true
      entry.endTime = new Date()
    })

    next()
  }

  //
  // Request handler that renders the status page.
  //
  statusPage(req, res, next) {
    // Restrict to requests from private or loopback addresses.
    const remoteAddress = ipaddr.process(req.ip)
    if (!["loopback", "private"].includes(remoteAddress.range())) {
      return next()
    }

    const now = new Date()
    const memory = process.memoryUsage()
    const context = {
      title: sprintf("Status for %s on %s", this.program.name, os.hostname()),
      start_time: this.startTime.toISOString(),
      start_time_ago: time.ago((now - this.startTime) / 1000),
      version: this.program.version,
      nodejs: process.release.name + " " + process.version,
      platform: process.platform,
      hostname: os.hostname(),
      user: process.getuid(),
      command_line: escapeHTML(process.argv.join(" ")),
      memory_rss: memory.rss,
      memory_heap_used: memory.heapUsed,
      memory_heap_total: memory.heapTotal,
      memory_external: memory.external,
      local_addr: res.socket.localAddress + " " + res.socket.localPort,
      remote_addr: req.ip + " " + res.socket.remotePort,
      total_requests: this.requestCount.totalCount(),
      requests: html.renderTable(this.requestCount.tableHeaders(),
          this.requestCount.tableData(100)),
    }

    this.computeRPS(now, context)
    this.renderRecentRequests(now, context)
    this.renderEnvironmentVariables(context)

    const body = sprintf(STATUS_TEMPLATE, context)
    const expires = new Date()
    res.header("Cache-Control", "max-age=0")
    res.header("Expires", expires.toUTCString())
    res.status(200).send(body)
  }

  //
  // Compute RPS over last 5s, 60s, 5m.
  //
  computeRPS(now, context) {
    const unixTime = now.getTime()
    const requestCounts = { last5s: 0, last60s: 0, last300s: 0 }
    this.recentRequestTimes.forEach(x => {
      if (unixTime - 5000 < x) {
        requestCounts.last5s++
      }
      if (unixTime - 60000 < x) {
        requestCounts.last60s++
      }
      if (unixTime - 300000 < x) {
        requestCounts.last300s++
      }
    })
    context.rps_5s = requestCounts.last5s / 5
    context.rps_60s = requestCounts.last60s / 60
    context.rps_300s = requestCounts.last300s / 300
  }

  //
  // Render recent requests as a table.
  //
  renderRecentRequests(now, context) {
    context.recent_requests = html.renderTable(
        ["Start time", "Remote IP", "Request", "Duration", "Status", "Request ID"],
        this.recentRequests.map(entry =>
          [
            entry.startTime.toISOString(),
            entry.remoteIp,
            entry.request.method + " " + entry.request.originalUrl,
            ((entry.finished ? entry.endTime : now) - entry.startTime) + "ms",
            entry.finished ? entry.response.statusCode : "in progress",
            entry.request.requestId,
          ]
        ))
  }

  //
  // Collect and sanitize environment variables and render as a table.
  //
  renderEnvironmentVariables(context) {
    const env = []
    for (const key of Object.keys(process.env).sort()) {
      const value = process.env[key]
      if (SECRET_REGEXP.test(key.toLowerCase())) {
        env.push([key, "..."])
      } else {
        env.push([key, value])
      }
    }
    context.env = html.renderTable(["Name", "Value"], env)
  }
}

module.exports = {
  ServerStatus: ServerStatus,
}
