//
// Unit tests for lib/program_meta.js.
//

const { assert } = require("chai")

const programMeta = require("../lib/program_meta")

describe("lib/program_meta", () => {
  it("programMeta.getProgramVersion reads data from package.data", () => {
    const expectedVersion = {
      "name": "server-status-utils",
      "version": "1.0.2",
    }
    const version = programMeta.getProgramVersion()
    assert.deepEqual(version, expectedVersion)
  })

  it("programMeta.getProgramVersion handles missing package.data", () => {
    const err = new Error("no such file or directory")
    err.code = "ENOENT"
    function readFileSync(name) {
      throw err
    }
    const expectedVersion = {
      "name": process.argv[1],
      "version": "unknown",
    }
    const version = programMeta.getProgramVersion(readFileSync)
    assert.deepEqual(version, expectedVersion)
  })

  it("programMeta.getProgramVersion throws other errors", () => {
    const err = new Error("permission denied")
    err.code = "EACCES"
    function readFileSync(name) {
      throw err
    }
    assert.throws(() => programMeta.getProgramVersion(readFileSync), err)
  })
})
