import { androidTemplate } from '../../config/userConfig'
import fsExtra from 'fs-extra'
import path from 'path'
import { logDebug, logError, logInfo } from '../../nlog/nLog'
import { ErrorAndExit, ProjectInitComplete } from '../../globalBiz'
import inquirer from 'inquirer'
import { AppCache } from '../appMaker/AppCache'
import { replaceTextByPathList } from '../../language/common/commonLanguage'
import { JavaPackageRefactor } from '../../language/java/javaPackageRefactor'
import { MakeFileRefactor } from '../../language/makefile/MakeFileRefactor'
import { GradleSettings } from '../../language/gradle/GradleSettings'
import { androidTaskModuleBuild } from '../../language/android/androidGradlewTasks'

export class AndroidApplicationJavaMaker extends AppCache {

  /**
   * command prompt
   */
  prompts = [
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
      name: 'gradlewBuild',
      message: 'Check gradlew build ?',
      default: false
    }
  ]

  targetApplicationFullPath: string

  fixModuleName: string

  rootProjectFullPath: string

  constructor(name: string, alias: string, template: string, branch?: string) {
    super(name, alias, template, branch)
    this.fixModuleName = this.name
      .replace(new RegExp('-'), '')
      .replace(new RegExp(' ', 'g'), '')
      .toLowerCase()
    this.targetApplicationFullPath = path.resolve(process.cwd(), this.fixModuleName)
    this.rootProjectFullPath = path.dirname(this.targetApplicationFullPath)
  }

  // eslint-disable-next-line class-methods-use-this
  doDefaultTemplate(): string {
    return androidTemplate().templateUrl
  }

  // eslint-disable-next-line class-methods-use-this
  doDefaultTemplateBranch(): string {
    return androidTemplate().templateBranch
  }

  // eslint-disable-next-line class-methods-use-this
  doRemoveCiConfig(workPath: string): void {
    if (fsExtra.existsSync(path.join(workPath, '.github'))) {
      fsExtra.removeSync(path.join(workPath, '.github'))
      logDebug(`remove git action at path: ${workPath}`)
    }
  }

  async onPreCreateApp(): Promise<void> {
    if (this.checkAndroidProjectPath()) {
      ErrorAndExit(-127, `Error: not in android project path: ${process.cwd()}`)
    }
    if (fsExtra.existsSync(this.targetApplicationFullPath)) {
      ErrorAndExit(-127, `Error: application path exists: ${this.targetApplicationFullPath}`)
    }
    if (!this.doCheckAppPath()) {
      ErrorAndExit(-127, `Error: can not new application path at: ${this.fullPath}`)
    }
    logInfo(`ready create android java application from template: ${this.parseTemplateGitUrl()}`)
    await this.onCreateApp()
  }

  private checkAndroidProjectPath() {
    const settingsGradlePath = path.join(this.rootProjectFullPath, 'settings.gradle')
    return !fsExtra.existsSync(settingsGradlePath)
  }

  async onCreateApp(): Promise<void> {
    inquirer.prompt(this.prompts).then(({
      applicationPackage,
      applicationApplicationId,
      gradlewBuild
    }) => {
      this.cacheTemplate()
      this.generateApplication(
        applicationPackage,
        applicationApplicationId
      )
      if (gradlewBuild) {
        androidTaskModuleBuild(this.rootProjectFullPath, this.fixModuleName)
      }
      this.onPostCreateApp()
    })
  }

  async onPostCreateApp(): Promise<void> {
    logInfo(`finish: create android application project at: ${this.fullPath}`)
    ProjectInitComplete()
  }

  private generateApplication = (
    applicationPackage: string,
    applicationApplicationId: string
  ) => {
    logInfo(`-> generate Library
template module Name: ${androidTemplate().application.name}
application name: ${this.fixModuleName}
application path: ${this.targetApplicationFullPath}
application package: ${applicationPackage}
application applicationId: ${applicationApplicationId}
`)

    const applicationFromPath = path.join(this.cachePath, androidTemplate().application.name)
    fsExtra.copySync(applicationFromPath, this.targetApplicationFullPath)
    const applicationFromPackage = androidTemplate().application.source.package
    if (applicationPackage !== applicationFromPackage) {
      logInfo(`=> refactor application package from: ${applicationFromPackage}\n\tto: ${applicationPackage}`)
      // replace application main java source
      const applicationJavaScrRoot = path.join(
        this.targetApplicationFullPath, androidTemplate().application.source.javaPath)
      const javaSourcePackageRefactor = new JavaPackageRefactor(
        applicationJavaScrRoot, applicationFromPackage, applicationPackage)
      let err = javaSourcePackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames application javaSourcePackageRefactor err: ${err}`)
      }
      // replace application test java source
      const applicationTestScrRoot = path.join(
        this.targetApplicationFullPath, androidTemplate().application.source.testJavaPath)
      const testPackageRefactor = new JavaPackageRefactor(
        applicationTestScrRoot, applicationFromPackage, applicationPackage)
      err = testPackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames application testPackageRefactor err: ${err}`)
      }
      // replace application androidTest java source
      const androidTestScrRoot = path.join(
        this.targetApplicationFullPath, androidTemplate().application.source.androidTestJavaPath)
      const androidTestPackageRefactor = new JavaPackageRefactor(
        androidTestScrRoot, applicationFromPackage, applicationPackage)
      err = androidTestPackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames application androidTestPackageRefactor err: ${err}`)
      }
      // replace androidManifestPath
      replaceTextByPathList(applicationFromPackage, applicationPackage,
        path.join(this.targetApplicationFullPath, androidTemplate().application.source.androidManifestPath))
    }
    if (applicationApplicationId !== androidTemplate().application.applicationId) {
      logInfo(`=> refactor applicationId from: ${androidTemplate().application.applicationId}\n\tto: ${applicationApplicationId}`)
      const appBuildGradlePath = path.join(this.targetApplicationFullPath, 'build.gradle')
      replaceTextByPathList(`applicationId "${applicationFromPackage}"`,
        `applicationId "${applicationApplicationId}"`,
        appBuildGradlePath)
      replaceTextByPathList(`testApplicationId "${applicationFromPackage}`,
        `testApplicationId "${applicationApplicationId}`,
        appBuildGradlePath)
    }
    if (this.fixModuleName !== androidTemplate().application.name) {
      logInfo(`=> refactor module from: ${androidTemplate().application.name}\n\tto: ${this.fixModuleName}`)
      // replace module makefile
      const makeFileRefactor = new MakeFileRefactor(
        this.rootProjectFullPath, path.join(this.fixModuleName, 'z-application.mk')
      )
      let err = makeFileRefactor.renameTargetLineByLine(
        androidTemplate().application.name, this.fixModuleName)
      if (err) {
        logError(`makeFileRefactor application renameTargetLineByLine err: ${err}`)
      }
      err = makeFileRefactor.addRootIncludeModule(this.fixModuleName,
        'z-application.mk',
        ` help-${this.fixModuleName}`)
      if (err) {
        logError(`makeFileRefactor application addRootInclude err: ${err}`)
      }
      // setting.gradle
      const gradleSettings = new GradleSettings(this.rootProjectFullPath)
      err = gradleSettings.addGradleModuleInclude(this.fixModuleName)
      if (err) {
        logError(`doJavaCodeRenames application addGradleModuleInclude err: ${err}`)
      }
    }
  }
}