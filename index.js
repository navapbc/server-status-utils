//
// Server status page showing useful info for diagnostics or troubleshooting.
//

const serverStatus = require("./lib/server_status")

module.exports = {
  ServerStatus: serverStatus.ServerStatus,
}
