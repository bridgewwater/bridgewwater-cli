import { AppMaker } from '../appMaker/AppMaker'
import fsExtra from 'fs-extra'
import path from 'path'
import { logDebug, logInfo } from '../../nlog/nLog'
import { ErrorAndExit, ProjectInitComplete } from '../../globalBiz'
import inquirer from 'inquirer'
import { initGitLocal } from '../../gitHelp/gitLocalInit'
import { runCmd } from '../../utils/cmdRunner'
import { androidTemplate } from '../../config/userConfig'
import { isPlatformWindows } from '../../utils/systemInfoUtils'
import { androidGradleBuildEnvironment } from '../../language/android/androidGradlewTasks'

export class AndroidJavaMaker extends AppMaker {

  /**
   * command prompt
   */
  prompts = [
    {
      type: 'confirm',
      name: 'git',
      message: 'Initialize git？',
      default: false
    },
    {
      type: 'confirm',
      name: 'buildEnvironment',
      message: 'Check gradlew buildEnvironment？',
      default: false
    }
  ]


  // eslint-disable-next-line class-methods-use-this
  doDefaultTemplate(): string {
    return androidTemplate().templateUrl
  }

  // eslint-disable-next-line class-methods-use-this
  doRemoveCiConfig(workPath: string): void {
    if (fsExtra.existsSync(path.join(workPath, '.github'))) {
      fsExtra.removeSync(path.join(workPath, '.github'))
      logDebug(`remove git action at path: ${workPath}`)
    }
  }

  async onPreCreateApp(): Promise<void> {
    if (!this.doCheckAppPath()) {
      ErrorAndExit(-127, `Error: can not new project path at: ${this.fullPath}`)
    }
    logInfo(`ready create android java project from template: ${this.parseTemplateGitUrl()}`)
    await this.onCreateApp()
  }

  async onCreateApp(): Promise<void> {
    inquirer.prompt(this.prompts).then(({ git, buildEnvironment }) => {
      this.downloadTemplate(true)
      if (git) {
        initGitLocal(this.fullPath)
        logInfo(`initGitLocal at: ${this.fullPath}`)
      }
      if (buildEnvironment) {
        logDebug(`check buildEnvironment at: ${this.fullPath}`)
        const checkEnvRes = androidGradleBuildEnvironment(this.fullPath)
        if (checkEnvRes.status) {
          ErrorAndExit(checkEnvRes.status, `cli path: ${this.fullPath} error: ${checkEnvRes.error}`)
        }
      }
      this.onPostCreateApp()
    })
  }

  async onPostCreateApp(): Promise<void> {
    logInfo(`finish: create android java project at: ${this.fullPath}`)
    ProjectInitComplete()
  }
}