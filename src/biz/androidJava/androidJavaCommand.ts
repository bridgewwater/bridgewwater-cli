import commander, { Command } from 'commander'
import { checkUpdate } from '../../utils/checkUpdate'
import { binName } from '../../utils/pkgInfo'
import { AndroidJavaMaker } from './androidJavaMaker'
import { androidTemplate } from '../../config/userConfig'
import { AndroidLibraryJavaMaker } from './AndroidLibraryJavaMaker'

export const cliAndroidJavaCommand = (): commander.Command => {
  const build = new Command('android-java')
  build
    .arguments('<targetName>')
    .option('-t, --template <path>', 'template address, support git address and local path')
    .option('-l, --library', 'only make library in project path')
    .option('--application', 'only make application in project path')
    .action(async (targetName, cmd) => {
      checkUpdate()

      if (cmd.library) {
        console.log('do library')
        const androidLibraryJavaMaker = new AndroidLibraryJavaMaker(
          targetName, 'android-java', cmd.template)
        await androidLibraryJavaMaker.execute()
        return
      }

      if (cmd.application) {
        console.log('do application')
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