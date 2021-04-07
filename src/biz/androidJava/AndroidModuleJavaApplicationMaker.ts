import { androidJavaTemplate } from '../../config/userConfig'
import fsExtra from 'fs-extra'
import path from 'path'
import { logDebug, logError, logInfo, logWarning } from '../../nlog/nLog'
import { ErrorAndExit, ProjectInitComplete } from '../../globalBiz'
import inquirer from 'inquirer'
import { AppCacheMaker } from '../appMaker/AppCacheMaker'
import { replaceTextByFileSuffix, replaceTextByPathList } from '../../language/common/commonLanguage'
import { JavaPackageRefactor } from '../../language/java/javaPackageRefactor'
import { MakeFileRefactor } from '../../language/makefile/MakeFileRefactor'
import { GradleSettings } from '../../language/gradle/GradleSettings'
import { androidTaskModuleBuild } from '../../language/android/androidGradlewTasks'
import sleep from 'sleep'
import lodash from 'lodash'

export class AndroidModuleJavaApplicationMaker extends AppCacheMaker {

  /**
   * command prompt
   */
  prompts = [
    {
      type: 'input',
      name: 'applicationPackage',
      message: `android application module package [${androidJavaTemplate().application.source.package}]?`,
      default: androidJavaTemplate().application.source.package
    },
    {
      type: 'input',
      name: 'applicationApplicationId',
      message: `android application module applicationId (${androidJavaTemplate().application.applicationId})?`,
      default: androidJavaTemplate().application.applicationId
    },
    {
      type: 'input',
      name: 'moduleAppName',
      message: `android application module App name [${this.name}]?`,
      default: this.name
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
    return androidJavaTemplate().templateUrl
  }

  // eslint-disable-next-line class-methods-use-this
  doDefaultTemplateBranch(): string {
    return androidJavaTemplate().templateBranch
  }

  // eslint-disable-next-line class-methods-use-this
  doProxyTemplateBranch(): string {
    return androidJavaTemplate().proxyTemplateUrl
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
    if (!lodash.isEmpty(androidJavaTemplate().proxyTemplateUrl)) {
      this.prompts.splice(0, 0, {
        type: 'confirm',
        name: 'useProxyTemplateUrl',
        message: `use proxyTemplateUrl: [ ${androidJavaTemplate().proxyTemplateUrl} ] ?`,
        default: false
      })
    }
    inquirer.prompt(this.prompts).then(({
      useProxyTemplateUrl,
      applicationPackage,
      applicationApplicationId,
      moduleAppName,
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
        },
        {
          itemName: 'moduleAppName',
          target: moduleAppName,
          canEmpty: false
        }
      ]
      if (this.checkPrompts(checkPrompts)) {
        ErrorAndExit(-127, 'please check error above')
      }
      this.cacheTemplate(useProxyTemplateUrl)
      this.generateApplication(
        applicationPackage,
        applicationApplicationId,
        moduleAppName
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
    applicationApplicationId: string,
    moduleAppName: string
  ) => {
    logInfo(`-> generate application
application name: ${this.fixModuleName}
application path: ${this.targetApplicationFullPath}
application package: ${applicationPackage}
application applicationId: ${applicationApplicationId}
application module App name: ${moduleAppName}
template module Name: ${androidJavaTemplate().application.name}
`)

    const applicationFromPath = path.join(this.cachePath, androidJavaTemplate().application.name)
    fsExtra.copySync(applicationFromPath, this.targetApplicationFullPath)
    const applicationFromPackage = androidJavaTemplate().application.source.package
    let err = null
    if (applicationPackage !== applicationFromPackage) {
      logDebug(`=> refactor application package from: ${applicationFromPackage}\n\tto: ${applicationPackage}`)
      // replace application main java source
      logDebug('-> refactor application main code')
      const applicationJavaScrRoot = path.join(
        this.targetApplicationFullPath, androidJavaTemplate().application.source.javaPath)
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
        this.targetApplicationFullPath, androidJavaTemplate().application.source.testJavaPath)
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
        this.targetApplicationFullPath, androidJavaTemplate().application.source.androidTestJavaPath)
      const androidTestPackageRefactor = new JavaPackageRefactor(
        androidTestScrRoot, applicationFromPackage, applicationPackage)
      err = androidTestPackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames application androidTestPackageRefactor err: ${err}`)
      }
      sleep.msleep(1000)
      // replace androidManifestPath
      replaceTextByPathList(applicationFromPackage, applicationPackage,
        path.join(this.targetApplicationFullPath, androidJavaTemplate().application.source.androidManifestPath))
      // replace xml of templateProjectName
      replaceTextByFileSuffix(androidJavaTemplate().templateProjectName, moduleAppName,
        path.join(this.targetApplicationFullPath, androidJavaTemplate().application.source.srcRoot), 'xml')
    }
    if (applicationApplicationId !== androidJavaTemplate().application.applicationId) {
      logDebug(`=> refactor applicationId from: ${androidJavaTemplate().application.applicationId}\n\tto: ${applicationApplicationId}`)
      const appBuildGradlePath = path.join(this.targetApplicationFullPath, 'build.gradle')
      replaceTextByPathList(`applicationId "${applicationFromPackage}"`,
        `applicationId "${applicationApplicationId}"`,
        appBuildGradlePath)
      replaceTextByPathList(`testApplicationId "${applicationFromPackage}`,
        `testApplicationId "${applicationApplicationId}`,
        appBuildGradlePath)
      const appMakefilePath = path.join(
        this.targetApplicationFullPath, androidJavaTemplate().application.moduleMakefile)
      replaceTextByPathList(`${applicationFromPackage}`,
        `${applicationApplicationId}`,
        appMakefilePath)
      if (applicationApplicationId.search(androidJavaTemplate().application.name) !== -1) {
        logWarning(`-> new applicationId contains ${androidJavaTemplate().application.name}, will let makefile error
Please fix it by yourself at: ${path.join(this.fixModuleName, `z-${this.fixModuleName}.mk`)}`)
      }
    }
    logDebug(`=> refactor module from: ${androidJavaTemplate().application.name}\n\tto: ${this.fixModuleName}`)
    // replace module makefile
    const makeFileRefactor = new MakeFileRefactor(
      this.rootProjectFullPath, path.join(this.fixModuleName, androidJavaTemplate().application.moduleMakefile)
    )
    err = makeFileRefactor.renameTargetLineByLine(
      androidJavaTemplate().application.name, this.fixModuleName)
    if (err) {
      logError(`makeFileRefactor application renameTargetLineByLine err: ${err}`)
    }
    err = makeFileRefactor.addRootIncludeModule(this.fixModuleName,
      `z-${this.fixModuleName}.mk`,
      ` help-${this.fixModuleName}`)
    if (err) {
      logError(`makeFileRefactor application addRootInclude err: ${err}`)
    }
    if (this.fixModuleName !== androidJavaTemplate().application.name) {
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