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

export const androidTaskModuleBuild = (
  path: string = process.cwd(),
  moduleName: string
): SpawnSyncReturns<Buffer> => {
  logDebug(`cli: android gradle module [ ${moduleName} ] build at: ${path}`)
  return runCmd({
    cmd: isPlatformWindows() ? './gradlew.bat' : './gradlew',
    args: [`:${moduleName}:build`, '--warning-mode', 'all'],
    cwd: path
  })
}