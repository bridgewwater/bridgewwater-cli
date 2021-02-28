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
import sleep from 'sleep'
import lodash from 'lodash'

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
  doProxyTemplateBranch(): string {
    return androidTemplate().proxyTemplateUrl
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
      ErrorAndExit(-127, `Error: module application path exists: ${this.targetApplicationFullPath}`)
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
    if (!lodash.isEmpty(androidTemplate().proxyTemplateUrl)) {
      this.prompts.splice(0, 0 ,     {
        type: 'confirm',
        name: 'useProxyTemplateUrl',
        message: `use proxyTemplateUrl: [ ${androidTemplate().proxyTemplateUrl} ] ?`,
        default: false
      },)
    }
    inquirer.prompt(this.prompts).then(({
      useProxyTemplateUrl,
      applicationPackage,
      applicationApplicationId,
      gradlewBuild
    }) => {
      const checkPrompts = [
        {
          itemName: 'application module',
          target: this.fixModuleName,
          canEmpty: false,
          notAllowList: [
            'test', 'dist', 'build', 'gradle', 'keystore', 'assemble', 'install', 'depend'
          ]
        },
        {
          itemName: 'applicationPackage',
          target: applicationPackage,
          canEmpty: false
        },
        {
          itemName: 'applicationApplicationId',
          target: applicationApplicationId,
          canEmpty: false
        }
      ]
      if (this.checkPrompts(checkPrompts)) {
        ErrorAndExit(-127, 'please check error above')
      }
      this.cacheTemplate(useProxyTemplateUrl)
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
    logInfo(`-> generate application
application name: ${this.fixModuleName}
application path: ${this.targetApplicationFullPath}
application package: ${applicationPackage}
application applicationId: ${applicationApplicationId}
template module Name: ${androidTemplate().application.name}
`)

    const applicationFromPath = path.join(this.cachePath, androidTemplate().application.name)
    fsExtra.copySync(applicationFromPath, this.targetApplicationFullPath)
    const applicationFromPackage = androidTemplate().application.source.package
    let err = null
    if (applicationPackage !== applicationFromPackage) {
      logDebug(`=> refactor application package from: ${applicationFromPackage}\n\tto: ${applicationPackage}`)
      // replace application main java source
      logDebug('-> refactor application main code')
      const applicationJavaScrRoot = path.join(
        this.targetApplicationFullPath, androidTemplate().application.source.javaPath)
      const javaSourcePackageRefactor = new JavaPackageRefactor(
        applicationJavaScrRoot, applicationFromPackage, applicationPackage)
      err = javaSourcePackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames application javaSourcePackageRefactor err: ${err}`)
      }
      sleep.msleep(1000)
      // replace application test java source
      logDebug('-> refactor application test java source')
      const applicationTestScrRoot = path.join(
        this.targetApplicationFullPath, androidTemplate().application.source.testJavaPath)
      const testPackageRefactor = new JavaPackageRefactor(
        applicationTestScrRoot, applicationFromPackage, applicationPackage)
      err = testPackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames application testPackageRefactor err: ${err}`)
      }
      sleep.msleep(1000)
      // replace application androidTest java source
      logDebug('-> refactor application androidTest java source')
      const androidTestScrRoot = path.join(
        this.targetApplicationFullPath, androidTemplate().application.source.androidTestJavaPath)
      const androidTestPackageRefactor = new JavaPackageRefactor(
        androidTestScrRoot, applicationFromPackage, applicationPackage)
      err = androidTestPackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames application androidTestPackageRefactor err: ${err}`)
      }
      sleep.msleep(1000)
      // replace androidManifestPath
      replaceTextByPathList(applicationFromPackage, applicationPackage,
        path.join(this.targetApplicationFullPath, androidTemplate().application.source.androidManifestPath))
    }
    if (applicationApplicationId !== androidTemplate().application.applicationId) {
      logDebug(`=> refactor applicationId from: ${androidTemplate().application.applicationId}\n\tto: ${applicationApplicationId}`)
      const appBuildGradlePath = path.join(this.targetApplicationFullPath, 'build.gradle')
      replaceTextByPathList(`applicationId "${applicationFromPackage}"`,
        `applicationId "${applicationApplicationId}"`,
        appBuildGradlePath)
      replaceTextByPathList(`testApplicationId "${applicationFromPackage}`,
        `testApplicationId "${applicationApplicationId}`,
        appBuildGradlePath)
    }
    logDebug(`=> refactor module from: ${androidTemplate().application.name}\n\tto: ${this.fixModuleName}`)
    // replace module makefile
    const makeFileRefactor = new MakeFileRefactor(
      this.rootProjectFullPath, path.join(this.fixModuleName, androidTemplate().application.moduleMakefile)
    )
    err = makeFileRefactor.renameTargetLineByLine(
      androidTemplate().application.name, this.fixModuleName)
    if (err) {
      logError(`makeFileRefactor application renameTargetLineByLine err: ${err}`)
    }
    err = makeFileRefactor.addRootIncludeModule(this.fixModuleName,
      `z-${this.fixModuleName}.mk`,
      ` help-${this.fixModuleName}`)
    if (err) {
      logError(`makeFileRefactor application addRootInclude err: ${err}`)
    }
    if (this.fixModuleName !== androidTemplate().application.name) {
      fsExtra.moveSync(makeFileRefactor.MakefileTargetPath, path.join(
        this.rootProjectFullPath, this.fixModuleName, `z-${this.fixModuleName}.mk`))
    }
    // setting.gradle
    const gradleSettings = new GradleSettings(this.rootProjectFullPath)
    err = gradleSettings.addGradleModuleInclude(this.fixModuleName)
    if (err) {
      logError(`doJavaCodeRenames application addGradleModuleInclude err: ${err}`)
    }
  }
}