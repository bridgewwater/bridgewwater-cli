import { AppMaker } from '../appMaker/AppMaker'
import fsExtra from 'fs-extra'
import path from 'path'
import { logDebug, logError, logInfo, logVerbose } from '../../nlog/nLog'
import { ErrorAndExit, ProjectInitComplete } from '../../globalBiz'
import inquirer from 'inquirer'
import { initGitLocal } from '../../gitHelp/gitLocalInit'
import { androidTemplate } from '../../config/userConfig'
import { androidGradleBuildEnvironment } from '../../language/android/androidGradlewTasks'
import { replaceTextByFileSuffix, replaceTextByPathList } from '../../language/common/commonLanguage'
import { JavaPackageRefactor } from '../../language/java/javaPackageRefactor'
import { GradleSettings } from '../../language/gradle/GradleSettings'
import { MakeFileRefactor } from '../../language/makefile/MakeFileRefactor'

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
      libraryMvnGroup, libraryMvnPomArtifactId, libraryMvnPomPackaging
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
    libraryMvnPomPackaging: 'aar') => {
    logVerbose(`generate Library
library name: ${libraryName}
library package: ${libraryPackage}
mvn group: ${libraryMvnGroup}
mvn POM_ARTIFACT_ID: ${libraryMvnPomArtifactId}
mvn POM_NAME: ${libraryMvnPomArtifactId}
mvn POM_PACKAGING: ${libraryMvnPomPackaging}
`)
    const libraryNowPath = path.join(this.fullPath, androidTemplate().library.name)
    // replace gradle.properties
    replaceTextByPathList(androidTemplate().library.mvn.group, libraryMvnGroup,
      path.join(this.fullPath, 'gradle.properties'))
    replaceTextByPathList(androidTemplate().library.mvn.pomArtifactId, libraryMvnPomArtifactId,
      path.join(libraryNowPath, 'gradle.properties'))
    replaceTextByPathList(androidTemplate().library.mvn.pomName, libraryMvnPomArtifactId,
      path.join(libraryNowPath, 'gradle.properties'))
    replaceTextByPathList(androidTemplate().library.mvn.pomPackaging, libraryMvnPomPackaging,
      path.join(libraryNowPath, 'gradle.properties'))
    const libraryFromPackage = androidTemplate().library.source.package
    if (libraryPackage !== libraryFromPackage) {
      logInfo(`=> refactor package from: ${libraryFromPackage}\n\tto: libraryPackage`)
      // replace library main java source
      const libraryJavaScrRoot = path.join(libraryNowPath, androidTemplate().library.source.javaPath)
      const javaSourcePackageRefactor = new JavaPackageRefactor(
        libraryJavaScrRoot, libraryFromPackage, libraryPackage)
      let err = javaSourcePackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames javaSourcePackageRefactor err: ${err}`)
      }
      // replace library test java source
      const libraryTestScrRoot = path.join(libraryNowPath, androidTemplate().library.source.testJavaPath)
      const testPackageRefactor = new JavaPackageRefactor(
        libraryTestScrRoot, libraryFromPackage, libraryPackage)
      err = testPackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames testPackageRefactor err: ${err}`)
      }
      // replace androidManifestPath
      replaceTextByPathList(`package="${libraryFromPackage}"`, `package="${libraryPackage}"`,
        androidTemplate().library.source.androidManifestPath)
    }
    if (libraryName !== androidTemplate().library.name) {
      // replace module makefile
      const makeFileRefactor = new MakeFileRefactor(
        this.fullPath, path.join(androidTemplate().library.name, 'z-plugin.mk')
      )
      let err = makeFileRefactor.renameTargetLineByLine(androidTemplate().library.name, libraryName)
      if (err) {
        logError(`doJavaCodeRenames renameTargetLineByLine err: ${err}`)
      }
      err = makeFileRefactor.renameRootInclude(androidTemplate().library.name, libraryName)
      if (err) {
        logError(`doJavaCodeRenames renameRootInclude err: ${err}`)
      }
      // replace module path and setting.gradle
      const libraryNewPath = path.join(this.fullPath, libraryName)
      fsExtra.moveSync(libraryNowPath, libraryNewPath)
      const gradleSettings = new GradleSettings(this.fullPath)
      err = gradleSettings.renameSettingGradleInclude(androidTemplate().library.name, libraryName)
      if (err) {
        logError(`doJavaCodeRenames renameSettingGradleInclude err: ${err}`)
      }
    }
  }

  async onPostCreateApp(): Promise<void> {
    logInfo(`finish: create android java project at: ${this.fullPath}`)
    ProjectInitComplete()
  }
}