import commander, { Command } from 'commander'
import { checkUpdate } from '../../utils/checkUpdate'
import { ExitZeroByHelp } from '../../globalBiz'
import { androidJavaTemplate, writeProxyAndroidJavaTemplate } from '../../config/userConfig'
import { binName } from '../../utils/pkgInfo'
import { logWarning } from '../../nlog/nLog'
import { AndroidModuleJavaLibraryMaker } from './AndroidModuleJavaLibraryMaker'
import { AndroidModuleJavaApplicationMaker } from './AndroidModuleJavaApplicationMaker'
import { AndroidJavaProjectMaker } from './androidJavaProjectMaker'

export const cliAndroidJavaCommand = (): commander.Command => {
  const alias = 'android-java'
  const build = new Command(alias)
  build
    .option('-t, --template <path>', 'template address, support git address and local path')
    .option('-l, --library', 'only make library in project path')
    .option('--application', 'only make application in project path')
    .option('--printProxyTemplate', 'show proxy template')
    .on('option:printProxyTemplate', (): void => {
      checkUpdate()
      console.log(`-> now proxy template: ${androidJavaTemplate().proxyTemplateUrl}`)
      ExitZeroByHelp()
    })
    .option('-p, --proxyTemplate <path>', 'set proxy template, close use --proxyTemplate ""')
    .on('option:proxyTemplate', (cmd): void => {
      checkUpdate()
      if (!cmd) {
        logWarning('Warning: will close use proxyTemplate')
      }
      writeProxyAndroidJavaTemplate(cmd, alias)
      ExitZeroByHelp()
    })
    .arguments('<targetName>')
    .action(async (targetName, cmd) => {
      checkUpdate()
      if (cmd.library) {
        const androidLibraryJavaMaker = new AndroidModuleJavaLibraryMaker(
          targetName, alias, cmd.template)
        await androidLibraryJavaMaker.execute()
        return
      }

      if (cmd.application) {
        const androidApplicationJavaMaker = new AndroidModuleJavaApplicationMaker(
          targetName, alias, cmd.template)
        await androidApplicationJavaMaker.execute()
        return
      }

      const androidJavaMaker = new AndroidJavaProjectMaker(targetName, cmd.template)
      await androidJavaMaker.execute()
    })
    .usage('[options] <targetName>')
    .description(`clone and build project, as: ${binName()} ${alias} targetName
    default template use: ${androidJavaTemplate().templateUrl}
`)
  return build
}