import commander, { Command } from 'commander'
import { checkUpdate } from '../../utils/checkUpdate'
import { binName } from '../../utils/pkgInfo'
import { AndroidJavaMaker } from './androidJavaMaker'
import { androidTemplate, writeProxyAndroidTemplate } from '../../config/userConfig'
import { AndroidLibraryJavaMaker } from './AndroidLibraryJavaMaker'
import { AndroidApplicationJavaMaker } from './AndroidApplicationJavaMaker'
import { ExitZeroByHelp } from '../../globalBiz'
import { logWarning } from '../../nlog/nLog'

export const cliAndroidJavaCommand = (): commander.Command => {
  const build = new Command('android-java')
  build
    .option('-t, --template <path>', 'template address, support git address and local path')
    .option('-l, --library', 'only make library in project path')
    .option('--application', 'only make application in project path')
    .option('--printProxyTemplate', 'show proxy template')
    .on('option:printProxyTemplate', (): void => {
      checkUpdate()
      console.log(`-> now proxy template: ${androidTemplate().proxyTemplateUrl}`)
      ExitZeroByHelp()
    })
    .option('-p, --proxyTemplate <path>', 'set proxy template, close use --proxyTemplate ""')
    .on('option:proxyTemplate', (cmd): void => {
      checkUpdate()
      if (!cmd) {
        logWarning('Warning: will close use proxyTemplate')
      }
      writeProxyAndroidTemplate(cmd, 'android-java')
      ExitZeroByHelp()
    })
    .arguments('<targetName>')
    .action(async (targetName, cmd) => {
      checkUpdate()
      if (cmd.library) {
        const androidLibraryJavaMaker = new AndroidLibraryJavaMaker(
          targetName, 'android-java', cmd.template)
        await androidLibraryJavaMaker.execute()
        return
      }

      if (cmd.application) {
        const androidApplicationJavaMaker = new AndroidApplicationJavaMaker(
          targetName, 'android-java', cmd.template)
        await androidApplicationJavaMaker.execute()
        return
      }

      const androidJavaMaker = new AndroidJavaMaker(targetName, cmd.template)
      await androidJavaMaker.execute()
      // createNodeApp(appName, cmd.template)
    })
    .usage('[options] <targetName>')
    .description(`clone and build project, as: ${binName()} android-java targetName
  default template use: ${androidTemplate().templateUrl}`)
  return build
}