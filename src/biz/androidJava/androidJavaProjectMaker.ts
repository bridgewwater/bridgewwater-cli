import { AppMaker } from '../appMaker/AppMaker'
import fsExtra from 'fs-extra'
import path from 'path'
import { logDebug, logError, logInfo, logVerbose, logWarning } from '../../nlog/nLog'
import { ErrorAndExit, ProjectInitComplete } from '../../globalBiz'
import inquirer from 'inquirer'
import { initGitLocal } from '../../gitHelp/gitLocalInit'
import { androidJavaTemplate } from '../../config/userConfig'
import { androidGradleBuildEnvironment } from '../../language/android/androidGradlewTasks'
import { replaceTextByFileSuffix, replaceTextByPathList } from '../../language/common/commonLanguage'
import { JavaPackageRefactor } from '../../language/java/javaPackageRefactor'
import { GradleSettings } from '../../language/gradle/GradleSettings'
import { MakeFileRefactor } from '../../language/makefile/MakeFileRefactor'
import GitURLParse from 'git-url-parse'
import lodash from 'lodash'

export class AndroidJavaProjectMaker extends AppMaker {

  /**
   * command prompt
   */
  prompts = [
    {
      type: 'input',
      name: 'projectRepoURL',
      message: `new project git path [${this.parseTemplateRepoUrl()}]?`,
      default: this.parseTemplateRepoUrl()
    },
    {
      type: 'input',
      name: 'projectAppName',
      message: `android App name [${this.name}]?`,
      default: this.name
    },
    {
      type: 'input',
      name: 'projectVersionName',
      message: `project version name, will auto add -SNAPSHOT [${androidJavaTemplate().versionName}]?`,
      default: androidJavaTemplate().versionName
    },
    {
      type: 'input',
      name: 'projectVersionCode',
      message: `project version code [${androidJavaTemplate().versionCode}]?`,
      default: androidJavaTemplate().versionCode
    },
    {
      type: 'input',
      name: 'libraryModuleName',
      message: `android library module name [${androidJavaTemplate().library.name}]?`,
      default: androidJavaTemplate().library.name
    },
    {
      type: 'input',
      name: 'libraryPackage',
      message: `android library module package [${androidJavaTemplate().library.source.package}]?`,
      default: androidJavaTemplate().library.source.package
    },
    {
      type: 'input',
      name: 'libraryMvnGroup',
      message: `android library module mvn group [${androidJavaTemplate().library.mvn.group}]?`,
      default: androidJavaTemplate().library.mvn.group
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
      type: 'input',
      name: 'applicationModuleName',
      message: `android application module name [${androidJavaTemplate().application.name}]?`,
      default: androidJavaTemplate().application.name
    },
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
    if (!this.doCheckAppPath()) {
      ErrorAndExit(-127, `Error: can not new project path at: ${this.fullPath}`)
    }
    logInfo(`ready create android java project from template: ${this.parseTemplateGitUrl()}`)
    await this.onCreateApp()
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
      git, buildEnvironment, useProxyTemplateUrl,
      projectAppName, projectRepoURL, projectVersionName, projectVersionCode,
      libraryModuleName, libraryPackage,
      libraryMvnGroup, libraryMvnPomArtifactId, libraryMvnPomPackaging,
      applicationModuleName, applicationPackage, applicationApplicationId
    }) => {
      const checkPrompts = [
        {
          itemName: 'projectAppName',
          target: projectAppName,
          canEmpty: false
        },
        {
          itemName: 'projectRepoURL',
          target: projectRepoURL,
          canEmpty: false
        },
        {
          itemName: 'projectVersionName',
          target: projectVersionName,
          canEmpty: false
        },
        {
          itemName: 'projectVersionCode',
          target: projectVersionCode,
          canEmpty: false
        },
        {
          itemName: 'libraryModuleName',
          target: libraryModuleName,
          canEmpty: false,
          notAllowList: [
            'test', 'dist', 'build', 'gradle', 'keystore', 'assemble', 'install', 'depend',
            androidJavaTemplate().application.name]
        },
        {
          itemName: 'libraryPackage',
          target: libraryPackage,
          canEmpty: false
        },
        {
          itemName: 'libraryMvnGroup',
          target: libraryMvnGroup,
          canEmpty: false
        },
        {
          itemName: 'libraryMvnPomArtifactId',
          target: libraryMvnPomArtifactId,
          canEmpty: false
        },
        {
          itemName: 'applicationPackage',
          target: applicationPackage,
          canEmpty: false
        },
        {
          itemName: 'applicationModuleName',
          target: applicationModuleName,
          canEmpty: false,
          notAllowList: [
            'test', 'dist', 'build', 'gradle', 'keystore', 'assemble', 'install',
            androidJavaTemplate().library.name]
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
      this.downloadTemplate(process.cwd(), this.name, useProxyTemplateUrl)
      this.generateProject(
        projectAppName,
        projectRepoURL,
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

  private generateProject = (
    projectAppName: string, projectRepoURL: string,
    projectVersionName: string, projectVersionCode: string
  ) => {
    let finalVersionName = projectVersionName
    if (!finalVersionName.endsWith('-SNAPSHOT')) {
      finalVersionName = `${projectVersionName}-SNAPSHOT`
    }
    logVerbose(`generating project
template project Name: ${androidJavaTemplate().templateProjectName}
project repo: ${projectRepoURL}
project App Name: ${projectAppName}
project VersionName: ${finalVersionName}
project VersionCode: ${projectVersionCode}
    `)

    const nowGitURLParse = GitURLParse(`http://${projectRepoURL}`)
    replaceTextByPathList(new RegExp(this.parseTemplateRepoUrl(), 'g'), projectRepoURL,
      path.join(this.fullPath, 'README.md'))
    replaceTextByPathList(androidJavaTemplate().templateProjectName, projectAppName,
      path.join(this.fullPath, 'README.md'))
    replaceTextByPathList(new RegExp(this.parseTemplateOwnerAndName(), 'g'), `${nowGitURLParse.owner}/${nowGitURLParse.name}`,
      path.join(this.fullPath, 'gradle.properties'))
    replaceTextByPathList(new RegExp(this.parseTemplateSource(), 'g'), nowGitURLParse.source,
      path.join(this.fullPath, 'gradle.properties'))
    replaceTextByFileSuffix(androidJavaTemplate().templateProjectName, projectAppName,
      path.join(this.fullPath,
        androidJavaTemplate().application.name, androidJavaTemplate().application.source.srcRoot), 'xml')
    replaceTextByFileSuffix(androidJavaTemplate().versionName, finalVersionName,
      this.fullPath, 'properties')
    replaceTextByFileSuffix(androidJavaTemplate().versionCode, projectVersionCode,
      this.fullPath, 'properties')
  }

  private generateLibrary = (
    libraryModuleName: string, libraryPackage: string,
    libraryMvnGroup: string, libraryMvnPomArtifactId: string,
    libraryMvnPomPackaging: 'aar') => {
    logVerbose(`generate Library
template module Name: ${androidJavaTemplate().library.name}
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
    const libraryNowPath = path.join(this.fullPath, androidJavaTemplate().library.name)
    // replace gradle.properties
    replaceTextByPathList(androidJavaTemplate().library.mvn.group, libraryMvnGroup,
      path.join(this.fullPath, 'gradle.properties'))
    replaceTextByPathList(androidJavaTemplate().library.mvn.pomArtifactId, libraryMvnPomArtifactId,
      path.join(libraryNowPath, 'gradle.properties'))
    replaceTextByPathList(androidJavaTemplate().library.mvn.pomName, libraryMvnPomArtifactId,
      path.join(libraryNowPath, 'gradle.properties'))
    replaceTextByPathList(androidJavaTemplate().library.mvn.pomPackaging, libraryMvnPomPackaging,
      path.join(libraryNowPath, 'gradle.properties'))
    const libraryFromPackage = androidJavaTemplate().library.source.package
    if (libraryPackage !== libraryFromPackage) {
      logDebug(`=> refactor library package from: ${libraryFromPackage}\n\tto: ${libraryPackage}`)
      // replace library main java source
      const libraryJavaScrRoot = path.join(libraryNowPath, androidJavaTemplate().library.source.javaPath)
      const javaSourcePackageRefactor = new JavaPackageRefactor(
        libraryJavaScrRoot, libraryFromPackage, libraryPackage)
      let err = javaSourcePackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames library javaSourcePackageRefactor err: ${err}`)
      }
      // replace library test java source
      const libraryTestScrRoot = path.join(libraryNowPath, androidJavaTemplate().library.source.testJavaPath)
      const testPackageRefactor = new JavaPackageRefactor(
        libraryTestScrRoot, libraryFromPackage, libraryPackage)
      err = testPackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames library testPackageRefactor err: ${err}`)
      }
      // replace androidManifestPath
      replaceTextByPathList(libraryFromPackage, libraryPackage,
        path.join(libraryNowPath, androidJavaTemplate().library.source.androidManifestPath))
    }
    if (fixLibraryModuleName !== androidJavaTemplate().library.name) {
      // replace module makefile
      const makeFileRefactor = new MakeFileRefactor(
        this.fullPath, path.join(androidJavaTemplate().library.name, androidJavaTemplate().library.moduleMakefile)
      )
      let err = makeFileRefactor.renameTargetLineByLine(androidJavaTemplate().library.name, fixLibraryModuleName)
      if (err) {
        logError(`makeFileRefactor library renameTargetLineByLine err: ${err}`)
      }
      err = makeFileRefactor.renameRootInclude(androidJavaTemplate().library.name, fixLibraryModuleName)
      if (err) {
        logError(`makeFileRefactor library renameRootInclude err: ${err}`)
      }
      fsExtra.moveSync(makeFileRefactor.MakefileTargetPath, path.join(
        this.fullPath, androidJavaTemplate().library.name, `z-${fixLibraryModuleName}.mk`))
      // replace module path and setting.gradle
      const libraryNewPath = path.join(this.fullPath, fixLibraryModuleName)
      fsExtra.moveSync(libraryNowPath, libraryNewPath)
      const gradleSettings = new GradleSettings(this.fullPath)
      err = gradleSettings.renameSettingGradleInclude(androidJavaTemplate().library.name, fixLibraryModuleName)
      if (err) {
        logError(`gradleSettings library renameSettingGradleInclude err: ${err}`)
      }
    }
  }


  private generateApplication = (
    applicationModuleName: string,
    applicationPackage: string, applicationApplicationId: string) => {
    logVerbose(`generating application
template module Name: ${androidJavaTemplate().application.name}
module Name: ${applicationModuleName}
module package: ${applicationPackage}
module applicationId: ${applicationApplicationId}
    `)
    const fixApplicationModuleName = applicationModuleName
      .replace(new RegExp('-'), '')
      .replace(new RegExp(' ', 'g'), '')
      .toLowerCase()
    const applicationNowPath = path.join(this.fullPath, androidJavaTemplate().application.name)
    const applicationFromPackage = androidJavaTemplate().application.source.package
    if (applicationPackage !== applicationFromPackage) {
      logDebug(`=> refactor application package from: ${applicationFromPackage}\n\tto: ${applicationPackage}`)
      // replace application main java source
      const applicationJavaScrRoot = path.join(
        applicationNowPath, androidJavaTemplate().library.source.javaPath)
      const javaSourcePackageRefactor = new JavaPackageRefactor(
        applicationJavaScrRoot, applicationFromPackage, applicationPackage)
      let err = javaSourcePackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames application javaSourcePackageRefactor err: ${err}`)
      }
      // replace application test java source
      const applicationTestScrRoot = path.join(
        applicationNowPath, androidJavaTemplate().application.source.testJavaPath)
      const testPackageRefactor = new JavaPackageRefactor(
        applicationTestScrRoot, applicationFromPackage, applicationPackage)
      err = testPackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames application testPackageRefactor err: ${err}`)
      }
      // replace application androidTest java source
      const androidTestScrRoot = path.join(
        applicationNowPath, androidJavaTemplate().application.source.androidTestJavaPath)
      const androidTestPackageRefactor = new JavaPackageRefactor(
        androidTestScrRoot, applicationFromPackage, applicationPackage)
      err = androidTestPackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames application androidTestPackageRefactor err: ${err}`)
      }
      // replace androidManifestPath
      replaceTextByPathList(applicationFromPackage, applicationPackage,
        path.join(applicationNowPath, androidJavaTemplate().application.source.androidManifestPath))
    }
    if (applicationApplicationId !== androidJavaTemplate().application.applicationId) {
      logDebug(`=> refactor applicationId from: ${androidJavaTemplate().application.applicationId}\n\tto: ${applicationApplicationId}`)
      const appBuildGradlePath = path.join(applicationNowPath, 'build.gradle')
      replaceTextByPathList(`applicationId "${androidJavaTemplate().application.applicationId}"`,
        `applicationId "${applicationApplicationId}"`,
        appBuildGradlePath)
      replaceTextByPathList(`testApplicationId "${androidJavaTemplate().application.applicationId}`,
        `testApplicationId "${applicationApplicationId}`,
        appBuildGradlePath)
      const appMakefile = path.join(this.fullPath,
        androidJavaTemplate().application.name, androidJavaTemplate().application.moduleMakefile)
      replaceTextByPathList(`${androidJavaTemplate().application.applicationId}`, applicationApplicationId, appMakefile)
      if (applicationApplicationId.search(androidJavaTemplate().application.name) !== -1) {
        logWarning(`-> new applicationId contains ${androidJavaTemplate().application.name}, will let makefile error
Please fix it by yourself at: ${path.join(fixApplicationModuleName, `z-${fixApplicationModuleName}.mk`)}`)
      }
    }
    if (fixApplicationModuleName !== androidJavaTemplate().application.name) {
      // replace application module makefile
      const makeFileRefactor = new MakeFileRefactor(
        this.fullPath, path.join(
          androidJavaTemplate().application.name, androidJavaTemplate().application.moduleMakefile)
      )
      let err = makeFileRefactor.renameTargetLineByLine(
        androidJavaTemplate().application.name, fixApplicationModuleName)
      if (err) {
        logError(`makeFileRefactor application renameTargetLineByLine err: ${err}`)
      }
      err = makeFileRefactor.renameRootInclude(androidJavaTemplate().application.name, fixApplicationModuleName)
      if (err) {
        logError(`makeFileRefactor application renameRootInclude err: ${err}`)
      }
      fsExtra.moveSync(makeFileRefactor.MakefileTargetPath, path.join(
        this.fullPath, androidJavaTemplate().application.name, `z-${fixApplicationModuleName}.mk`))
      // replace module path and setting.gradle
      const libraryNewPath = path.join(this.fullPath, fixApplicationModuleName)
      fsExtra.moveSync(applicationNowPath, libraryNewPath)
      const gradleSettings = new GradleSettings(this.fullPath)
      err = gradleSettings.renameSettingGradleInclude(androidJavaTemplate().application.name, fixApplicationModuleName)
      if (err) {
        logError(`gradleSettings application renameSettingGradleInclude err: ${err}`)
      }
    }
  }

  async onPostCreateApp(): Promise<void> {
    logInfo(`finish: create android java project at: ${this.fullPath}`)
    ProjectInitComplete()
  }
}