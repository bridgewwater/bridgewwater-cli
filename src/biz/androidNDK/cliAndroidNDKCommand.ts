import commander, { Command } from 'commander'
import { checkUpdate } from '../../utils/checkUpdate'
import { androidNDKTemplate, writeProxyAndroidNDKTemplate } from '../../config/userConfig'
import { ExitZeroByHelp } from '../../globalBiz'
import { logWarning } from '../../nlog/nLog'
import { binName } from '../../utils/pkgInfo'
import { AndroidNDKProjectMaker } from './AndroidNDKProjectMaker'


export const cliAndroidNDKCommand = (): commander.Command => {
  const alias = 'android-ndk'
  const build = new Command(alias)
  build
    .option('-t, --template <path>', 'template address, support git address and local path')
    .option('-l, --library', 'only make library in project path')
    .option('--application', 'only make application in project path')
    .option('--printProxyTemplate', 'show proxy template')
    .on('option:printProxyTemplate', (): void => {
      checkUpdate()
      console.log(`-> now proxy template: ${androidNDKTemplate().proxyTemplateUrl}`)
      ExitZeroByHelp()
    })
    .option('-p, --proxyTemplate <path>', 'set proxy template, close use --proxyTemplate ""')
    .on('option:proxyTemplate', (cmd): void => {
      checkUpdate()
      if (!cmd) {
        logWarning('Warning: will close use proxyTemplate')
      }
      writeProxyAndroidNDKTemplate(cmd, alias)
      ExitZeroByHelp()
    })
    .arguments('<targetName>')
    .action(async (targetName, cmd) => {
      checkUpdate()
      if (cmd.library) {
        // const androidLibraryJavaMaker = new AndroidLibraryJavaMaker(
        //   targetName, alias, cmd.template)
        // await androidLibraryJavaMaker.execute()
        return
      }

      if (cmd.application) {
        // const androidApplicationJavaMaker = new AndroidApplicationJavaMaker(
        //   targetName, alias, cmd.template)
        // await androidApplicationJavaMaker.execute()
        return
      }
      const androidNDKProjectMaker = new AndroidNDKProjectMaker(targetName, cmd.template)
      await androidNDKProjectMaker.execute()
    })
    .usage('[options] <targetName>')
    .description(`clone and build project, as: ${binName()} ${alias} targetName
    default template use: ${androidNDKTemplate().templateUrl}
`)
  return build
}