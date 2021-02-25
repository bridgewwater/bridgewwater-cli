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

export class AndroidLibraryJavaMaker extends AppCache {

  /**
   * command prompt
   */
  prompts = [
    {
      type: 'input',
      name: 'libraryPackage',
      message: `android library module package [${androidTemplate().library.source.package}]?`,
      default: androidTemplate().library.source.package
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
    if (fsExtra.existsSync(this.targetLibraryFullPath)) {
      ErrorAndExit(-127, `Error: library path exists: ${this.targetLibraryFullPath}`)
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
    inquirer.prompt(this.prompts).then(({
      libraryPackage,
      libraryMvnPomArtifactId, libraryMvnPomPackaging,
      gradlewBuild
    }) => {
      this.cacheTemplate()
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
    logInfo(`-> generate Library
template module Name: ${androidTemplate().library.name}
library name: ${this.fixModuleName}
library path: ${this.targetLibraryFullPath}
library package: ${libraryPackage}
mvn POM_ARTIFACT_ID: ${libraryMvnPomArtifactId}
mvn POM_NAME: ${libraryMvnPomArtifactId}
mvn POM_PACKAGING: ${libraryMvnPomPackaging}
`)

    const libraryFromPath = path.join(this.cachePath, androidTemplate().library.name)
    fsExtra.copySync(libraryFromPath, this.targetLibraryFullPath)
    replaceTextByPathList(androidTemplate().library.mvn.pomArtifactId, libraryMvnPomArtifactId,
      path.join(this.targetLibraryFullPath, 'gradle.properties'))
    replaceTextByPathList(androidTemplate().library.mvn.pomName, libraryMvnPomArtifactId,
      path.join(this.targetLibraryFullPath, 'gradle.properties'))
    replaceTextByPathList(androidTemplate().library.mvn.pomPackaging, libraryMvnPomPackaging,
      path.join(this.targetLibraryFullPath, 'gradle.properties'))
    const libraryFromPackage = androidTemplate().library.source.package
    if (libraryPackage !== libraryFromPackage) {
      logInfo(`=> refactor library package from: ${libraryFromPackage}\n\tto: ${libraryPackage}`)
      // replace library main java source
      const libraryJavaScrRoot = path.join(this.targetLibraryFullPath, androidTemplate().library.source.javaPath)
      const javaSourcePackageRefactor = new JavaPackageRefactor(
        libraryJavaScrRoot, libraryFromPackage, libraryPackage)
      let err = javaSourcePackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames library javaSourcePackageRefactor err: ${err}`)
      }
      // replace library test java source
      const libraryTestScrRoot = path.join(this.targetLibraryFullPath, androidTemplate().library.source.testJavaPath)
      const testPackageRefactor = new JavaPackageRefactor(
        libraryTestScrRoot, libraryFromPackage, libraryPackage)
      err = testPackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames library testPackageRefactor err: ${err}`)
      }
      // replace androidManifestPath
      replaceTextByPathList(libraryFromPackage, libraryPackage,
        path.join(this.targetLibraryFullPath, androidTemplate().library.source.androidManifestPath))
    }
    if (this.fixModuleName !== androidTemplate().library.name) {
      logInfo(`=> refactor module from: ${androidTemplate().library.name}\n\tto: ${this.fixModuleName}`)
      // replace module makefile
      const makeFileRefactor = new MakeFileRefactor(
        this.rootProjectFullPath, path.join(this.fixModuleName, 'z-plugin.mk')
      )
      let err = makeFileRefactor.renameTargetLineByLine(
        androidTemplate().library.name, this.fixModuleName)
      if (err) {
        logError(`makeFileRefactor library renameTargetLineByLine err: ${err}`)
      }
      err = makeFileRefactor.addRootIncludeModule(this.fixModuleName,
        'z-plugin.mk',
        ` help-${this.fixModuleName}`)
      if (err) {
        logError(`makeFileRefactor library addRootInclude err: ${err}`)
      }
      // setting.gradle
      const gradleSettings = new GradleSettings(this.rootProjectFullPath)
      err = gradleSettings.addGradleModuleInclude(this.fixModuleName)
      if (err) {
        logError(`doJavaCodeRenames library addGradleModuleInclude err: ${err}`)
      }
    }
  }
}