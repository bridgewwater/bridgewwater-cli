import commander, { Command } from 'commander'
import { checkUpdate } from '../../utils/checkUpdate'
import { binName } from '../../utils/pkgInfo'
import { AndroidJavaMaker } from './androidJavaMaker'

export const cliAndroidJavaCommand = (): commander.Command => {
  const build = new Command('android-java')
  build
    .arguments('<appName>')
    .option('-t, --template <path>', 'template address, support git address and local path')
    .action(async (appName, cmd) => {
      checkUpdate()
      const androidJavaMaker = new AndroidJavaMaker(appName, cmd.template)
      await androidJavaMaker.execute()
      // createNodeApp(appName, cmd.template)
    })
    .usage('[options] <appName>')
    .description(`clone and build project, as: ${binName()} build appName`)
  return build
}