//
// Useful functions for handling time.
//

const sprintf = require("sprintf-js").sprintf

//
// Display a duration in seconds in a human readable way.
//
function ago(secs) {
  if (secs >= 86400) {
    return sprintf("%i\u00a0days %i\u00a0hours %i\u00a0mins",
        secs / 86400, (secs % 86400) / 3600, (secs % 3600) / 60)
  } else if (secs >= 3600) {
    return sprintf("%i\u00a0hours %i\u00a0mins", secs / 3600, (secs % 3600) / 60)
  } else if (secs >= 60) {
    return sprintf("%i\u00a0mins %i\u00a0secs", secs / 60, secs % 60)
  }
  return sprintf("%i\u00a0seconds", secs)
}

module.exports = {
  ago: ago,
}
