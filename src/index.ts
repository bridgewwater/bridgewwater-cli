import { checkNodeVersion } from './utils/envCheck'
import { initCommand } from './bridgewwater-cli'
import { ErrorAndExit } from './globalBiz'
import { binName } from './utils/pkgInfo'
import { userConfigJsonPath } from './config/userConfig'

checkNodeVersion()
try {
  initCommand()
} catch (e) {
  console.log(e)
  ErrorAndExit(
    -127,
    `maybe config error, please remove config at: ${userConfigJsonPath()}
or use: npm install -g ${binName()} to fix`
  )
}
