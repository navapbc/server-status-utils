//
// Unit tests for lib/time.js.
//

const { assert } = require("chai")

const time = require("../lib/time")

describe("lib/time", () => {
  it("time.ago renders a time", () => {
    assert.strictEqual(time.ago(10), "10\u00a0seconds")
    assert.strictEqual(time.ago(100), "1\u00a0mins 40\u00a0secs")
    assert.strictEqual(time.ago(1000), "16\u00a0mins 40\u00a0secs")
    assert.strictEqual(time.ago(10000), "2\u00a0hours 46\u00a0mins")
    assert.strictEqual(time.ago(100000), "1\u00a0days 3\u00a0hours 46\u00a0mins")
  })
})
