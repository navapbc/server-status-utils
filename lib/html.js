//
// Useful functions for rendering HTML.
//

const escapeHTML = require("underscore.string/escapeHTML")
const sprintf = require("sprintf-js").sprintf

//
// Generate a very simple HTML table from an array.
//
function renderTable(headers, body) {
  const table = ["<table>"]
  const cells = headers.map(renderTableHeader)
  table.push("<tr>" + cells.join("") + "</tr>")
  for (const row of body) {
    const cells = row.map(value => renderTableCell(value))
    table.push("<tr>" + cells.join("") + "</tr>")
  }
  table.push("</table>")
  return table.join("\n")
}

//
// Generate HTML for a table cell.
//
function renderTableCell(value, element = "td") {
  const escaped = escapeHTML(String(value))
  return sprintf("<%s>%s</%s>", element, escaped, element)
}

//
// Generate HTML for a table header.
//
function renderTableHeader(value) {
  return renderTableCell(value, "th")
}

module.exports = {
  renderTable: renderTable,
}
