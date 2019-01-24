//
// Get metadata about the program.
//

const fs = require("fs")

//
// Get program name and version from package.json or command line.
//
function getProgramVersion(readFileSync = fs.readFileSync) {
  // Read package.json for program name and version number. We can't use the npm
  // automatic environment variables as the application may not run under npm in
  // minimal deployments.
  let packageJson = {}
  try {
    packageJson = JSON.parse(readFileSync("package.json"))
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err
    }
  }

  return {
    // Program name from package.json or command line.
    name: packageJson.name || process.argv[1],
    // Program version from package.json.
    version: packageJson.version || "unknown",
  }
}

module.exports = {
  getProgramVersion: getProgramVersion,
}
