import { androidJavaTemplate } from '../../config/userConfig'
import fsExtra from 'fs-extra'
import path from 'path'
import { logDebug, logError, logInfo } from '../../nlog/nLog'
import { ErrorAndExit, ProjectInitComplete } from '../../globalBiz'
import inquirer from 'inquirer'
import { AppCacheMaker } from '../appMaker/AppCacheMaker'
import { replaceTextByPathList } from '../../language/common/commonLanguage'
import { JavaPackageRefactor } from '../../language/java/javaPackageRefactor'
import { MakeFileRefactor } from '../../language/makefile/MakeFileRefactor'
import { GradleSettings } from '../../language/gradle/GradleSettings'
import { androidTaskModuleBuild } from '../../language/android/androidGradlewTasks'
import lodash from 'lodash'

export class AndroidModuleJavaLibraryMaker extends AppCacheMaker {

  /**
   * command prompt
   */
  prompts = [
    {
      type: 'input',
      name: 'libraryPackage',
      message: `android library module package [${androidJavaTemplate().library.source.package}]?`,
      default: androidJavaTemplate().library.source.package
    },
    {
      type: 'input',
      name: 'libraryMvnPomArtifactId',
      message: `android library module mvn POM_ARTIFACT_ID [${androidJavaTemplate().library.mvn.pomArtifactId}]?`,
      default: androidJavaTemplate().library.mvn.pomArtifactId
    },
    {
      type: 'list',
      name: 'libraryMvnPomPackaging',
      message: 'android library module mvn POM_PACKAGING [aar|jar]?',
      default: androidJavaTemplate().library.mvn.pomPackaging,
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
      type: 'confirm',
      name: 'gradlewBuild',
      message: 'Check gradlew build ?',
      default: false
    }
  ]

  targetLibraryFullPath: string

  fixModuleName: string

  rootProjectFullPath: string

  constructor(name: string, alias: string, template: string, branch?: string) {
    super(name, alias, template, branch)
    this.fixModuleName = this.name
      .replace(new RegExp('-'), '')
      .replace(new RegExp(' ', 'g'), '')
      .toLowerCase()
    this.targetLibraryFullPath = path.resolve(process.cwd(), this.fixModuleName)
    this.rootProjectFullPath = path.dirname(this.targetLibraryFullPath)
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
    if (fsExtra.existsSync(this.targetLibraryFullPath)) {
      ErrorAndExit(-127, `Error: module library path exists: ${this.targetLibraryFullPath}`)
    }
    if (!this.doCheckAppPath()) {
      ErrorAndExit(-127, `Error: can not new library path at: ${this.fullPath}`)
    }
    logInfo(`ready create android java library from template: ${this.parseTemplateGitUrl()}`)
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
      libraryPackage,
      libraryMvnPomArtifactId, libraryMvnPomPackaging,
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
          itemName: 'libraryPackage',
          target: libraryPackage,
          canEmpty: false
        },
        {
          itemName: 'libraryMvnPomArtifactId',
          target: libraryMvnPomArtifactId,
          canEmpty: false
        },
        {
          itemName: 'libraryMvnPomPackaging',
          target: libraryMvnPomPackaging,
          canEmpty: false
        }
      ]
      if (this.checkPrompts(checkPrompts)) {
        ErrorAndExit(-127, 'please check error above')
      }
      this.cacheTemplate(useProxyTemplateUrl)
      this.generateLibrary(
        libraryPackage,
        libraryMvnPomArtifactId,
        libraryMvnPomPackaging
      )
      if (gradlewBuild) {
        androidTaskModuleBuild(this.rootProjectFullPath, this.fixModuleName)
      }
      this.onPostCreateApp()
    })
  }

  async onPostCreateApp(): Promise<void> {
    logInfo(`finish: create android library project at: ${this.fullPath}`)
    ProjectInitComplete()
  }

  private generateLibrary = (
    libraryPackage: string,
    libraryMvnPomArtifactId: string,
    libraryMvnPomPackaging: 'aar'
  ) => {
    logInfo(`-> generate library
library name: ${this.fixModuleName}
library path: ${this.targetLibraryFullPath}
library package: ${libraryPackage}
mvn POM_ARTIFACT_ID: ${libraryMvnPomArtifactId}
mvn POM_NAME: ${libraryMvnPomArtifactId}
mvn POM_PACKAGING: ${libraryMvnPomPackaging}
template module Name: ${androidJavaTemplate().library.name}
`)

    const libraryFromPath = path.join(this.cachePath, androidJavaTemplate().library.name)
    logDebug(`=> copy from: ${libraryFromPath}, to: ${this.targetLibraryFullPath}`)
    fsExtra.copySync(libraryFromPath, this.targetLibraryFullPath)
    replaceTextByPathList(androidJavaTemplate().library.mvn.pomArtifactId, libraryMvnPomArtifactId,
      path.join(this.targetLibraryFullPath, 'gradle.properties'))
    replaceTextByPathList(androidJavaTemplate().library.mvn.pomName, libraryMvnPomArtifactId,
      path.join(this.targetLibraryFullPath, 'gradle.properties'))
    replaceTextByPathList(androidJavaTemplate().library.mvn.pomPackaging, libraryMvnPomPackaging,
      path.join(this.targetLibraryFullPath, 'gradle.properties'))
    const libraryFromPackage = androidJavaTemplate().library.source.package
    let err = null
    if (libraryPackage !== libraryFromPackage) {
      logDebug(`=> refactor library package from: ${libraryFromPackage}\n\tto: ${libraryPackage}`)
      // replace library main java source
      const libraryJavaScrRoot = path.join(this.targetLibraryFullPath, androidJavaTemplate().library.source.javaPath)
      const javaSourcePackageRefactor = new JavaPackageRefactor(
        libraryJavaScrRoot, libraryFromPackage, libraryPackage)

      err = javaSourcePackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames library javaSourcePackageRefactor err: ${err}`)
      }
      // replace library test java source
      const libraryTestScrRoot = path.join(
        this.targetLibraryFullPath, androidJavaTemplate().library.source.testJavaPath)
      const testPackageRefactor = new JavaPackageRefactor(
        libraryTestScrRoot, libraryFromPackage, libraryPackage)
      err = testPackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames library testPackageRefactor err: ${err}`)
      }
      // replace androidManifestPath
      replaceTextByPathList(libraryFromPackage, libraryPackage,
        path.join(this.targetLibraryFullPath, androidJavaTemplate().library.source.androidManifestPath))
    }
    logDebug(`=> refactor module from: ${androidJavaTemplate().library.name}\n\tto: ${this.fixModuleName}`)
    // replace module makefile
    const makeFileRefactor = new MakeFileRefactor(
      this.rootProjectFullPath, path.join(this.fixModuleName, androidJavaTemplate().library.moduleMakefile)
    )
    err = makeFileRefactor.renameTargetLineByLine(
      androidJavaTemplate().library.name, this.fixModuleName)
    if (err) {
      logError(`makeFileRefactor library renameTargetLineByLine err: ${err}`)
    }
    err = makeFileRefactor.addRootIncludeModule(this.fixModuleName,
      `z-${this.fixModuleName}.mk`,
      ` help-${this.fixModuleName}`)
    if (err) {
      logError(`makeFileRefactor library addRootInclude err: ${err}`)
    }
    if (this.fixModuleName !== androidJavaTemplate().library.name) {
      fsExtra.moveSync(makeFileRefactor.MakefileTargetPath, path.join(
        this.rootProjectFullPath, this.fixModuleName, `z-${this.fixModuleName}.mk`))
    }
    // setting.gradle
    const gradleSettings = new GradleSettings(this.rootProjectFullPath)
    err = gradleSettings.addGradleModuleInclude(this.fixModuleName)
    if (err) {
      logError(`doJavaCodeRenames library addGradleModuleInclude err: ${err}`)
    }
  }
}