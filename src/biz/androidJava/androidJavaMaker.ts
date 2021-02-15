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
      message: `new android project name [${this.name}]?`,
      default: this.name
    },
    {
      type: 'input',
      name: 'projectVersionName',
      message: `project version name, will auto add -SNAPSHOT [${androidTemplate().versionName}]?`,
      default: androidTemplate().versionName
    },
    {
      type: 'input',
      name: 'projectVersionCode',
      message: `project version code [${androidTemplate().versionCode}]?`,
      default: androidTemplate().versionCode
    },
    {
      type: 'input',
      name: 'libraryModuleName',
      message: `android library module name [${androidTemplate().library.name}]?`,
      default: androidTemplate().library.name
    },
    {
      type: 'input',
      name: 'libraryPackage',
      message: `android library module package [${androidTemplate().library.source.package}]?`,
      default: androidTemplate().library.source.package
    },
    {
      type: 'input',
      name: 'libraryMvnGroup',
      message: `android library module mvn group [${androidTemplate().library.mvn.group}]?`,
      default: androidTemplate().library.mvn.group
    },
    {
      type: 'input',
      name: 'libraryMvnPomArtifactId',
      message: `android library module mvn POM_ARTIFACT_ID [${androidTemplate().library.mvn.pomArtifactId}]?`,
      default: androidTemplate().library.mvn.pomArtifactId
    },
    {
      type: 'list',
      name: 'libraryMvnPomPackaging',
      message: 'android library module mvn POM_PACKAGING [aar|jar]?',
      default: androidTemplate().library.mvn.pomPackaging,
      choices: [
        {
          name: 'library aar',
          value: 'aar'
        },
        {
          name: 'library jar',
          value: 'jar'
        }
      ]
    },
    {
      type: 'input',
      name: 'applicationModuleName',
      message: `android application module name [${androidTemplate().application.name}]?`,
      default: androidTemplate().application.name
    },
    {
      type: 'input',
      name: 'applicationPackage',
      message: `android application module package [${androidTemplate().application.source.package}]?`,
      default: androidTemplate().application.source.package
    },
    {
      type: 'input',
      name: 'applicationApplicationId',
      message: `android application module applicationId (${androidTemplate().application.applicationId})?`,
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
      libraryModuleName, libraryPackage,
      libraryMvnGroup, libraryMvnPomArtifactId, libraryMvnPomPackaging,
      applicationModuleName, applicationPackage, applicationApplicationId
    }) => {
      this.downloadTemplate(true)
      this.generateProject(
        projectName,
        projectVersionName,
        projectVersionCode
      )
      this.generateLibrary(
        libraryModuleName,
        libraryPackage,
        libraryMvnGroup,
        libraryMvnPomArtifactId,
        libraryMvnPomPackaging
      )
      this.generateApplication(
        applicationModuleName,
        applicationPackage,
        applicationApplicationId
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
    libraryModuleName: string, libraryPackage: string,
    libraryMvnGroup: string, libraryMvnPomArtifactId: string,
    libraryMvnPomPackaging: 'aar') => {
    logVerbose(`generate Library
template module Name: ${androidTemplate().library.name}
library name: ${libraryModuleName}
library package: ${libraryPackage}
mvn group: ${libraryMvnGroup}
mvn POM_ARTIFACT_ID: ${libraryMvnPomArtifactId}
mvn POM_NAME: ${libraryMvnPomArtifactId}
mvn POM_PACKAGING: ${libraryMvnPomPackaging}
`)
    const fixLibraryModuleName = libraryModuleName
      .replace(new RegExp('-'), '')
      .replace(new RegExp(' ', 'g'), '')
      .toLowerCase()
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
      logInfo(`=> refactor library package from: ${libraryFromPackage}\n\tto: ${libraryPackage}`)
      // replace library main java source
      const libraryJavaScrRoot = path.join(libraryNowPath, androidTemplate().library.source.javaPath)
      const javaSourcePackageRefactor = new JavaPackageRefactor(
        libraryJavaScrRoot, libraryFromPackage, libraryPackage)
      let err = javaSourcePackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames library javaSourcePackageRefactor err: ${err}`)
      }
      // replace library test java source
      const libraryTestScrRoot = path.join(libraryNowPath, androidTemplate().library.source.testJavaPath)
      const testPackageRefactor = new JavaPackageRefactor(
        libraryTestScrRoot, libraryFromPackage, libraryPackage)
      err = testPackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames library testPackageRefactor err: ${err}`)
      }
      // replace androidManifestPath
      replaceTextByPathList(libraryFromPackage, libraryPackage,
        path.join(libraryNowPath, androidTemplate().library.source.androidManifestPath))
    }
    if (fixLibraryModuleName !== androidTemplate().library.name) {
      // replace module makefile
      const makeFileRefactor = new MakeFileRefactor(
        this.fullPath, path.join(androidTemplate().library.name, 'z-plugin.mk')
      )
      let err = makeFileRefactor.renameTargetLineByLine(androidTemplate().library.name, fixLibraryModuleName)
      if (err) {
        logError(`doJavaCodeRenames library renameTargetLineByLine err: ${err}`)
      }
      err = makeFileRefactor.renameRootInclude(androidTemplate().library.name, fixLibraryModuleName)
      if (err) {
        logError(`doJavaCodeRenames library renameRootInclude err: ${err}`)
      }
      // replace module path and setting.gradle
      const libraryNewPath = path.join(this.fullPath, fixLibraryModuleName)
      fsExtra.moveSync(libraryNowPath, libraryNewPath)
      const gradleSettings = new GradleSettings(this.fullPath)
      err = gradleSettings.renameSettingGradleInclude(androidTemplate().library.name, fixLibraryModuleName)
      if (err) {
        logError(`doJavaCodeRenames library renameSettingGradleInclude err: ${err}`)
      }
    }
  }


  private generateApplication = (
    applicationModuleName: string,
    applicationPackage: string, applicationApplicationId: string) => {
    logVerbose(`generating application
template module Name: ${androidTemplate().application.name}
module Name: ${applicationModuleName}
module package: ${applicationPackage}
module applicationId: ${applicationApplicationId}
    `)
    const fixApplicationModuleName = applicationModuleName
      .replace(new RegExp('-'), '')
      .replace(new RegExp(' ', 'g'), '')
      .toLowerCase()
    const applicationNowPath = path.join(this.fullPath, androidTemplate().application.name)
    const applicationFromPackage = androidTemplate().application.source.package
    if (applicationPackage !== applicationFromPackage) {
      logInfo(`=> refactor application package from: ${applicationFromPackage}\n\tto: ${applicationPackage}`)
      // replace application main java source
      const applicationJavaScrRoot = path.join(
        applicationNowPath, androidTemplate().library.source.javaPath)
      const javaSourcePackageRefactor = new JavaPackageRefactor(
        applicationJavaScrRoot, applicationFromPackage, applicationPackage)
      let err = javaSourcePackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames application javaSourcePackageRefactor err: ${err}`)
      }
      // replace application test java source
      const applicationTestScrRoot = path.join(applicationNowPath, androidTemplate().application.source.testJavaPath)
      const testPackageRefactor = new JavaPackageRefactor(
        applicationTestScrRoot, applicationFromPackage, applicationPackage)
      err = testPackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames application testPackageRefactor err: ${err}`)
      }
      // replace application androidTest java source
      const androidTestScrRoot = path.join(applicationNowPath, androidTemplate().application.source.androidTestJavaPath)
      const androidTestPackageRefactor = new JavaPackageRefactor(
        androidTestScrRoot, applicationFromPackage, applicationPackage)
      err = androidTestPackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames application androidTestPackageRefactor err: ${err}`)
      }
      // replace androidManifestPath
      replaceTextByPathList(applicationFromPackage, applicationPackage,
        path.join(applicationNowPath, androidTemplate().application.source.androidManifestPath))
    }
    if (applicationApplicationId !== androidTemplate().application.applicationId) {
      logInfo(`=> refactor applicationId from: ${androidTemplate().application.applicationId}\n\tto: ${applicationApplicationId}`)
      const appBuildGradlePath = path.join(applicationNowPath, 'build.gradle')
      replaceTextByPathList(`applicationId "${androidTemplate().application.applicationId}"`,
        `applicationId "${applicationApplicationId}"`,
        appBuildGradlePath)
      replaceTextByPathList(`testApplicationId "${androidTemplate().application.applicationId}`,
        `testApplicationId "${applicationApplicationId}`,
        appBuildGradlePath)
    }
    if (fixApplicationModuleName !== androidTemplate().application.name) {
      // replace application module makefile
      const makeFileRefactor = new MakeFileRefactor(
        this.fullPath, path.join(androidTemplate().application.name, 'z-application.mk')
      )
      let err = makeFileRefactor.renameTargetLineByLine(
        androidTemplate().application.name, fixApplicationModuleName)
      if (err) {
        logError(`doJavaCodeRenames application renameTargetLineByLine err: ${err}`)
      }
      err = makeFileRefactor.renameRootInclude(androidTemplate().application.name, fixApplicationModuleName)
      if (err) {
        logError(`doJavaCodeRenames application renameRootInclude err: ${err}`)
      }
      // replace module path and setting.gradle
      const libraryNewPath = path.join(this.fullPath, fixApplicationModuleName)
      fsExtra.moveSync(applicationNowPath, libraryNewPath)
      const gradleSettings = new GradleSettings(this.fullPath)
      err = gradleSettings.renameSettingGradleInclude(androidTemplate().application.name, fixApplicationModuleName)
      if (err) {
        logError(`doJavaCodeRenames application renameSettingGradleInclude err: ${err}`)
      }
    }
  }

  async onPostCreateApp(): Promise<void> {
    logInfo(`finish: create android java project at: ${this.fullPath}`)
    ProjectInitComplete()
  }
}