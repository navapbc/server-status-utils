//
// Unit tests for lib/server_status.js.
//

const { assert } = require("chai")
const express = require("express")
const libxmljs = require("libxmljs")
const request = require("supertest")
const sinon = require("sinon")

const serverStatus = require("../lib/server_status")

describe("server-status router", () => {
  beforeEach(() => {
    this.clock = sinon.useFakeTimers({toFake: ["Date"]})
    this.app = express()
    this.app.enable("trust proxy") // For testing request IP using X-Forwarded-For header.
    const ss = new serverStatus.ServerStatus()
    this.app.use("/", ss.collectRequestStats.bind(ss))
    this.app.get("/", (req, res) => res.send("ok ok"))
    this.app.get("/one", (req, res) => res.send("ok 1"))
    this.app.get("/status", ss.statusPage.bind(ss))
  })

  afterEach(() => {
    this.clock.restore()
  })

  it("returns a server status page", async() => {
    // 100 requests at 10s intervals:
    for (let count = 0; count !== 100; count++) {
      this.clock.tick("00:10")
      await request(this.app)
        .get("/one")
        .expect(200)
    }
    // Then 100 requests at 0.5s intervals:
    for (let count = 0; count !== 100; count++) {
      this.clock.tick(500)
      await request(this.app)
        .get("/two")
        .expect(404)
    }
    // Then the status page:
    await request(this.app)
      .get("/status")
      .expect(200)
      .expect(res => {
        assert.match(res.text, /<html>/)
        assert.match(res.text, /<title>Status for/)

        // Check that the HTML is valid (or at least satisfies libxml).
        const document = libxmljs.parseHtmlString(res.text)
        assert.strictEqual(document.errors.length, 0)
        assert.strictEqual(document.root().name(), "html")

        function assertElementText(id, expected) {
          const element = document.get(`//*[@id="${id}"]`)
          assert.isDefined(element)
          assert.instanceOf(element, libxmljs.Element)
          const text = element.text().replace(/\s+/g, " ")
          assert.strictEqual(text, expected)
        }

        assert.match(document.root().get("/html/head/title").text(), /^Status for/)
        assert.match(document.root().get("/html/body/h1").text(), /^Status for/)
        assertElementText("started",
            "Started: 1970-01-01T00:00:00.000Z (17 mins 30 secs ago)")
        assertElementText("totalrequests", "Total requests: 200")
        assertElementText("rps", "Requests per second: 5s 2.2rps, 60s 1.7rps, 5m 0.4rps")
      })
  })

  it("returns a 404 when request is from a public IP address", () => {
    return request(this.app)
      .get("/status")
      .set("X-Forwarded-For", "64.32.16.8")
      .expect(404)
  })
})
