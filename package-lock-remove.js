// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs')
// eslint-disable-next-line array-callback-return
fs.unlink('package-lock.json', (err) => {
  if (err) {
    console.log(err)
  } else {
    console.log('delete ok')
  }
})