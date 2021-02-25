import { androidTemplate } from '../../config/userConfig'
import fsExtra from 'fs-extra'
import path from 'path'
import { logDebug, logInfo, logVerbose } from '../../nlog/nLog'
import { ErrorAndExit, ProjectInitComplete } from '../../globalBiz'
import inquirer from 'inquirer'
import { AppCache } from '../appMaker/AppCache'

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
      name: 'libraryVersionName',
      message: `project version name, will auto add -SNAPSHOT [${androidTemplate().versionName}]?`,
      default: androidTemplate().versionName
    },
    {
      type: 'input',
      name: 'libraryVersionCode',
      message: `project version code [${androidTemplate().versionCode}]?`,
      default: androidTemplate().versionCode
    },
    {
      type: 'confirm',
      name: 'gradlewBuild',
      message: 'Check gradlew build ?',
      default: false
    }
  ]

  constructor(name: string, alias: string, template: string, branch?: string) {
    super(name, alias, template, branch)
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
    if (AndroidLibraryJavaMaker.checkAndroidProjectPath()) {
      ErrorAndExit(-127, `Error: not in android project path: ${process.cwd()}`)
    }
    if (!this.doCheckAppPath()) {
      ErrorAndExit(-127, `Error: can not new library path at: ${this.fullPath}`)
    }
    logInfo(`ready create android java library from template: ${this.parseTemplateGitUrl()}`)
    await this.onCreateApp()
  }

  private static checkAndroidProjectPath() {
    const settingsGradlePath = path.join(process.cwd(), 'settings.gradle')
    if (!fsExtra.existsSync(settingsGradlePath)) {
      return true
    }
    return false
  }

  async onCreateApp(): Promise<void> {
    inquirer.prompt(this.prompts).then(({
      libraryPackage,
      libraryMvnGroup, libraryMvnPomArtifactId, libraryMvnPomPackaging,
      libraryVersionName, libraryVersionCode
    }) => {
      this.cacheTemplate()
      // this.downloadTemplate(true)
      this.generateLibrary(
        libraryPackage,
        libraryMvnGroup,
        libraryMvnPomArtifactId,
        libraryMvnPomPackaging,
        libraryVersionName,
        libraryVersionCode
      )
    })
  }

  async onPostCreateApp(): Promise<void> {
    logInfo(`finish: create android library project at: ${this.fullPath}`)
    ProjectInitComplete()
  }

  private generateLibrary = (
    libraryPackage: string,
    libraryMvnGroup: string, libraryMvnPomArtifactId: string,
    libraryMvnPomPackaging: 'aar',
    libraryVersionName: string, libraryVersionCode: string
  ) => {
    let finalVersionName = libraryVersionName
    if (!finalVersionName.endsWith('-SNAPSHOT')) {
      finalVersionName = `${libraryVersionName}-SNAPSHOT`
    }
    logVerbose(`generate Library
template module Name: ${androidTemplate().library.name}
library name: ${this.name}
library package: ${libraryPackage}
mvn group: ${libraryMvnGroup}
mvn POM_ARTIFACT_ID: ${libraryMvnPomArtifactId}
mvn POM_NAME: ${libraryMvnPomArtifactId}
mvn POM_PACKAGING: ${libraryMvnPomPackaging}
project VersionName: ${finalVersionName}
project VersionCode: ${libraryVersionCode}
`)
  }
}