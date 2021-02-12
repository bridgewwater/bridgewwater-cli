import { CMDType } from '../../utils/cmdType'
import { SpawnSyncReturns } from 'child_process'
import { logDebug } from '../../nlog/nLog'
import { runCmd } from '../../utils/cmdRunner'
import { isPlatformWindows } from '../../utils/systemInfoUtils'

export const androidGradleBuildEnvironment = (
  path: string = process.cwd()): SpawnSyncReturns<Buffer> => {
  logDebug(`cli: android gradle buildEnvironment at: ${path}`)
  return runCmd({
    cmd: isPlatformWindows() ? './gradlew.bat' : './gradlew',
    args: ['clean', 'buildEnvironment', '--warning-mode', 'all'],
    cwd: path
  })
}