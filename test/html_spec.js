//
// Unit tests for lib/html.js.
//

const { assert } = require("chai")

const html = require("../lib/html")

describe("lib/html", () => {
  it("html.renderTable renders an HTML table", () => {
    const htmlTable = html.renderTable(["Name", "Size"], [
      ["Alpha", 55], ["Bravo", 27], ["Charlie", ""],
    ])
    const expectedHtml = `<table>
<tr><th>Name</th><th>Size</th></tr>
<tr><td>Alpha</td><td>55</td></tr>
<tr><td>Bravo</td><td>27</td></tr>
<tr><td>Charlie</td><td></td></tr>
</table>`
    assert.strictEqual(htmlTable, expectedHtml)
  })
})
