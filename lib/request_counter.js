//
// Classes related to counting requests.
//

//
// Class that counts requests by method, path, and status code.
//
class RequestCounter {
  constructor() {
    this.total = 0
    this.codes = new Set() // all status codes seen
    this.countByMP = new Map() // by method, path
    this.countByMPC = new Map() // by method, path, code
  }

  //
  // Count a finished request.
  //
  countRequest(req, res) {
    const method = req.method
    const path = req.originalUrl
    const code = res.statusCode

    const keyMP = `${method}\t${path}`
    const keyMPC = `${method}\t${path}\t${code}`

    this.total++
    this.codes.add(code)

    if (!this.countByMP.has(keyMP)) {
      this.countByMP.set(keyMP, 0)
    }
    this.countByMP.set(keyMP, this.countByMP.get(keyMP) + 1)

    if (!this.countByMPC.has(keyMPC)) {
      this.countByMPC.set(keyMPC, 0)
    }
    this.countByMPC.set(keyMPC, this.countByMPC.get(keyMPC) + 1)
  }

  //
  // The total number of requests counted.
  //
  totalCount() {
    return this.total
  }

  //
  // An array of table headers showing requests by method, path, and status code.
  //
  tableHeaders() {
    const codes = [...this.codes].sort()
    return ["Request"].concat(codes).concat(["Total"])
  }

  //
  // An array of table rows showing requests by method, path, and status code.
  //
  tableData(limit = 100) {
    const codes = [...this.codes].sort()
    const methodPaths = [...this.countByMP].sort((a, b) => b[1] - a[1])
    const data = []

    for (const entry of methodPaths) {
      const methodPath = entry[0]
      const total = entry[1]
      const row = [methodPath]
      for (const code of codes) {
        row.push(this.countByMPC.get(methodPath + "\t" + code) || "")
      }
      row.push(total)
      data.push(row)
      if (data.length === limit) {
        break
      }
    }
    return data
  }
}

module.exports = {
  RequestCounter: RequestCounter,
}
