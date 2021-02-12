import { AppMaker } from '../appMaker/AppMaker'
import fsExtra from 'fs-extra'
import path from 'path'
import { logDebug, logInfo, logVerbose } from '../../nlog/nLog'
import { ErrorAndExit, ProjectInitComplete } from '../../globalBiz'
import inquirer from 'inquirer'
import { initGitLocal } from '../../gitHelp/gitLocalInit'
import { androidTemplate } from '../../config/userConfig'
import { androidGradleBuildEnvironment } from '../../language/android/androidGradlewTasks'
import { replaceTextByFileSuffix, replaceTextByPathList } from '../../language/common/commonLanguage'

export class AndroidJavaMaker extends AppMaker {

  /**
   * command prompt
   */
  prompts = [
    {
      type: 'input',
      name: 'projectName',
      message: 'new android project name ?',
      default: this.name
    },
    {
      type: 'input',
      name: 'projectVersionName',
      message: 'project version name, will auto add -SNAPSHOT ?',
      default: androidTemplate().versionName
    },
    {
      type: 'input',
      name: 'projectVersionCode',
      message: 'project version name ?',
      default: androidTemplate().versionCode
    },
    {
      type: 'input',
      name: 'libraryName',
      message: 'android library name ?',
      default: androidTemplate().library.name
    },
    {
      type: 'input',
      name: 'libraryPackage',
      message: 'android library package ?',
      default: androidTemplate().library.source.package
    },
    {
      type: 'input',
      name: 'libraryMvnGroup',
      message: 'android library mvn group ?',
      default: androidTemplate().library.mvn.group
    },
    {
      type: 'input',
      name: 'libraryMvnPomArtifactId',
      message: 'android library mvn POM_ARTIFACT_ID ?',
      default: androidTemplate().library.mvn.pomArtifactId
    },
    {
      type: 'input',
      name: 'libraryMvnPomName',
      message: 'android library mvn POM_NAME ?',
      default: androidTemplate().library.mvn.pomName
    },
    {
      type: 'input',
      name: 'libraryMvnPomPackaging',
      message: 'android library mvn POM_PACKAGING ?',
      default: androidTemplate().library.mvn.pomPackaging
    },
    {
      type: 'input',
      name: 'appPackage',
      message: 'android application package ?',
      default: androidTemplate().application.source.package
    },
    {
      type: 'input',
      name: 'applicationId',
      message: 'android application applicationId ?',
      default: androidTemplate().application.applicationId
    },
    {
      type: 'confirm',
      name: 'git',
      message: 'Initialize git ?',
      default: false
    },
    {
      type: 'confirm',
      name: 'buildEnvironment',
      message: 'Check gradlew buildEnvironment ?',
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
    inquirer.prompt(this.prompts).then(({
      git, buildEnvironment,
      projectName, projectVersionName, projectVersionCode,
      libraryName, libraryPackage,
      libraryMvnGroup, libraryMvnPomArtifactId, libraryMvnPomName, libraryMvnPomPackaging
    }) => {
      this.downloadTemplate(true)
      this.generateProject(
        projectName,
        projectVersionName,
        projectVersionCode
      )
      this.generateLibrary(
        libraryName,
        libraryPackage,
        libraryMvnGroup,
        libraryMvnPomArtifactId,
        libraryMvnPomName,
        libraryMvnPomPackaging
      )
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

  private generateProject = (projectName: string, projectVersionName: string, projectVersionCode: string) => {
    let finalVersionName = projectVersionName
    if (!finalVersionName.endsWith('-SNAPSHOT')) {
      finalVersionName = `${projectVersionName}-SNAPSHOT`
    }
    logVerbose(`generating project
template project Name: ${androidTemplate().templateProjectName}
project Name: ${projectName}
project VersionName: ${finalVersionName}
project VersionCode: ${projectVersionCode}
    `)

    replaceTextByPathList(androidTemplate().templateProjectName, projectName,
      path.join(this.fullPath, 'README.md'))
    replaceTextByFileSuffix(androidTemplate().templateProjectName, projectName,
      path.join(this.fullPath, androidTemplate().application.name, androidTemplate().application.source.srcRoot), 'xml')
    replaceTextByFileSuffix(androidTemplate().versionName, finalVersionName,
      this.fullPath, 'properties')
    replaceTextByFileSuffix(androidTemplate().versionCode, projectVersionCode,
      this.fullPath, 'properties')
  }

  private generateLibrary = (
    libraryName: string, libraryPackage: string,
    libraryMvnGroup: string, libraryMvnPomArtifactId: string,
    libraryMvnPomName: string, libraryMvnPomPackaging: 'aar') => {
    logVerbose(`generate Library
library name: ${libraryName}
library package: ${libraryPackage}
mvn group: ${libraryMvnGroup}
mvn POM_ARTIFACT_ID: ${libraryMvnPomArtifactId}
mvn POM_NAME: ${libraryMvnPomName}
mvn POM_PACKAGING: ${libraryMvnPomPackaging}
`)
    const libraryNowPath = path.join(this.fullPath, androidTemplate().library.name)
    replaceTextByPathList(androidTemplate().library.mvn.group, libraryMvnGroup,
      path.join(this.fullPath, 'gradle.properties'))
    replaceTextByPathList(androidTemplate().library.mvn.pomArtifactId, libraryMvnPomArtifactId,
      path.join(libraryNowPath, 'gradle.properties'))
    replaceTextByPathList(androidTemplate().library.mvn.pomName, libraryMvnPomName,
      path.join(libraryNowPath, 'gradle.properties'))
    replaceTextByPathList(androidTemplate().library.mvn.pomPackaging, libraryMvnPomPackaging,
      path.join(libraryNowPath, 'gradle.properties'))
  }

  async onPostCreateApp(): Promise<void> {
    logInfo(`finish: create android java project at: ${this.fullPath}`)
    ProjectInitComplete()
  }
}