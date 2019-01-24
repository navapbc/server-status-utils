//
// Example showing usage of server status page.
//

const express = require("express")
// 1. Require server-status-utils.
const serverStatus = require("../index")

const app = express()
const port = 4400

// 2. Create a ServerStatus object.
const ss = new serverStatus.ServerStatus()

// 3. Connect collectRequestStats handler to track all requests (before all
// other handlers that may respond to a request without calling next).
app.use("/", ss.collectRequestStats.bind(ss))

// 4. Connect statusPage handler to a specific GET path.
app.get("/status", ss.statusPage.bind(ss))

app.get("/", (req, res) => res.send("Hello World!"))

app.listen(port, () => console.log(`http://localhost:${port}/status`))
