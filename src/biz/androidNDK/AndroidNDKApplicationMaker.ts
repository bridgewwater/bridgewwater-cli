import { AppCacheMaker } from '../appMaker/AppCacheMaker'
import { androidNDKTemplate } from '../../config/userConfig'
import path from 'path'
import fsExtra from 'fs-extra'
import { logDebug, logError, logInfo } from '../../nlog/nLog'
import { ErrorAndExit, ProjectInitComplete } from '../../globalBiz'
import lodash from 'lodash'
import inquirer from 'inquirer'
import { androidTaskModuleBuild } from '../../language/android/androidGradlewTasks'
import { JavaPackageRefactor } from '../../language/java/javaPackageRefactor'
import sleep from 'sleep'
import { replaceTextByFileSuffix, replaceTextByPathList } from '../../language/common/commonLanguage'
import { MakeFileRefactor } from '../../language/makefile/MakeFileRefactor'
import { GradleSettings } from '../../language/gradle/GradleSettings'

export class AndroidNDKApplicationMaker extends AppCacheMaker {

  /**
   * command prompt
   */
  prompts = [
    {
      type: 'input',
      name: 'applicationPackage',
      message: `android application module package [${androidNDKTemplate().application.source.package}]?`,
      default: androidNDKTemplate().application.source.package
    },
    {
      type: 'input',
      name: 'applicationApplicationId',
      message: `android application module applicationId (${androidNDKTemplate().application.applicationId})?`,
      default: androidNDKTemplate().application.applicationId
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
    return androidNDKTemplate().templateUrl
  }

  // eslint-disable-next-line class-methods-use-this
  doDefaultTemplateBranch(): string {
    return androidNDKTemplate().templateBranch
  }

  // eslint-disable-next-line class-methods-use-this
  doProxyTemplateBranch(): string {
    return androidNDKTemplate().proxyTemplateUrl
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
    if (!lodash.isEmpty(androidNDKTemplate().proxyTemplateUrl)) {
      this.prompts.splice(0, 0, {
        type: 'confirm',
        name: 'useProxyTemplateUrl',
        message: `use proxyTemplateUrl: [ ${androidNDKTemplate().proxyTemplateUrl} ] ?`,
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
template module Name: ${androidNDKTemplate().application.name}
`)

    const applicationFromPath = path.join(this.cachePath, androidNDKTemplate().application.name)
    fsExtra.copySync(applicationFromPath, this.targetApplicationFullPath)
    const applicationFromPackage = androidNDKTemplate().application.source.package
    let err = null
    if (applicationPackage !== applicationFromPackage) {
      logDebug(`=> refactor application package from: ${applicationFromPackage}\n\tto: ${applicationPackage}`)
      // replace application main java source
      logDebug('-> refactor application main code')
      const applicationJavaScrRoot = path.join(
        this.targetApplicationFullPath, androidNDKTemplate().application.source.javaPath)
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
        this.targetApplicationFullPath, androidNDKTemplate().application.source.testJavaPath)
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
        this.targetApplicationFullPath, androidNDKTemplate().application.source.androidTestJavaPath)
      const androidTestPackageRefactor = new JavaPackageRefactor(
        androidTestScrRoot, applicationFromPackage, applicationPackage)
      err = androidTestPackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames application androidTestPackageRefactor err: ${err}`)
      }
      sleep.msleep(1000)
      // replace androidManifestPath
      replaceTextByPathList(applicationFromPackage, applicationPackage,
        path.join(this.targetApplicationFullPath, androidNDKTemplate().application.source.androidManifestPath))
      // replace xml of templateProjectName
      replaceTextByFileSuffix(androidNDKTemplate().templateProjectName, moduleAppName,
        path.join(this.targetApplicationFullPath, androidNDKTemplate().application.source.srcRoot), 'xml')
    }
    if (applicationApplicationId !== androidNDKTemplate().application.applicationId) {
      logDebug(`=> refactor applicationId from: ${androidNDKTemplate().application.applicationId}\n\tto: ${applicationApplicationId}`)
      const appBuildGradlePath = path.join(this.targetApplicationFullPath, 'build.gradle')
      replaceTextByPathList(`applicationId "${applicationFromPackage}"`,
        `applicationId "${applicationApplicationId}"`,
        appBuildGradlePath)
      replaceTextByPathList(`testApplicationId "${applicationFromPackage}`,
        `testApplicationId "${applicationApplicationId}`,
        appBuildGradlePath)
    }
    logDebug(`=> refactor module from: ${androidNDKTemplate().application.name}\n\tto: ${this.fixModuleName}`)
    // replace module makefile
    const makeFileRefactor = new MakeFileRefactor(
      this.rootProjectFullPath, path.join(this.fixModuleName, androidNDKTemplate().application.moduleMakefile)
    )
    err = makeFileRefactor.renameTargetLineByLine(
      androidNDKTemplate().application.name, this.fixModuleName)
    if (err) {
      logError(`makeFileRefactor application renameTargetLineByLine err: ${err}`)
    }
    err = makeFileRefactor.addRootIncludeModule(this.fixModuleName,
      `z-${this.fixModuleName}.mk`,
      ` help-${this.fixModuleName}`)
    if (err) {
      logError(`makeFileRefactor application addRootInclude err: ${err}`)
    }
    if (this.fixModuleName !== androidNDKTemplate().application.name) {
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