import commander, { Command } from 'commander'
import { checkUpdate } from '../../utils/checkUpdate'
import { androidNDKTemplate, writeProxyAndroidNDKTemplate } from '../../config/userConfig'
import { ExitZeroByHelp } from '../../globalBiz'
import { logWarning } from '../../nlog/nLog'
import { binName } from '../../utils/pkgInfo'
import { AndroidNDKProjectMaker } from './AndroidNDKProjectMaker'
import { AndroidNDKLibraryMaker } from './AndroidNDKLibraryMaker'
import { AndroidNDKApplicationMaker } from './AndroidNDKApplicationMaker'


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
        const androidNDKLibraryMaker = new AndroidNDKLibraryMaker(
          targetName, alias, cmd.template)
        await androidNDKLibraryMaker.execute()
        return
      }

      if (cmd.application) {
        const androidNDKApplicationMaker = new AndroidNDKApplicationMaker(
          targetName, alias, cmd.template)
        await androidNDKApplicationMaker.execute()
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