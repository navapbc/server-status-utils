//
// Unit tests for lib/request_counter.js.
//

const { assert } = require("chai")

const requestCounter = require("../lib/request_counter")

describe("class RequestCounter", () => {
  it("counts requests", () => {
    const count = new requestCounter.RequestCounter()
    count.countRequest({ method: "GET", originalUrl: "/aaa" }, { statusCode: 200 })
    count.countRequest({ method: "GET", originalUrl: "/bbb" }, { statusCode: 404 })
    count.countRequest({ method: "POST", originalUrl: "/aaa" }, { statusCode: 200 })
    count.countRequest({ method: "POST", originalUrl: "/bbb" }, { statusCode: 404 })
    count.countRequest({ method: "GET", originalUrl: "/aaa" }, { statusCode: 200 })
    assert.strictEqual(count.totalCount(), 5)
    assert.deepEqual(count.tableHeaders(), ["Request", 200, 404, "Total"])
    assert.deepEqual(count.tableData(3), [
      ["GET\t/aaa", 2, "", 2],
      ["GET\t/bbb", "", 1, 1],
      ["POST\t/aaa", 1, "", 1],
    ])
  })

  it("counts many requests and truncates tableData", () => {
    const count = new requestCounter.RequestCounter()
    for (let i = 0; i !== 1000; i++) {
      count.countRequest({ method: "GET", originalUrl: `/get${i % 333}` }, { statusCode: 200 })
      count.countRequest({ method: "GET", originalUrl: `/no${i}` }, { statusCode: 404 })
      count.countRequest({ method: "POST", originalUrl: `/post${i}` }, { statusCode: 200 })
    }
    assert.strictEqual(count.totalCount(), 3000)
    assert.deepEqual(count.tableHeaders(), ["Request", 200, 404, "Total"])
    const data = count.tableData()
    assert.strictEqual(data.length, 100)
    assert.deepEqual(data[0], ["GET\t/get0", 4, "", 4])
  })
})
