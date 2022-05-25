import { AppMaker } from '../appMaker/AppMaker'
import { androidNDKTemplate } from '../../config/userConfig'
import fsExtra from 'fs-extra'
import path from 'path'
import { logDebug, logError, logInfo, logVerbose } from '../../nlog/nLog'
import { ErrorAndExit, ProjectInitComplete } from '../../globalBiz'
import lodash from 'lodash'
import inquirer from 'inquirer'
import { initGitLocal } from '../../gitHelp/gitLocalInit'
import { androidGradleBuildEnvironment } from '../../language/android/androidGradlewTasks'
import GitURLParse from 'git-url-parse'
import { replaceTextByFileSuffix, replaceTextByPathList } from '../../language/common/commonLanguage'
import { JavaPackageRefactor } from '../../language/java/javaPackageRefactor'
import { MakeFileRefactor } from '../../language/makefile/MakeFileRefactor'
import { GradleSettings } from '../../language/gradle/GradleSettings'
import { JavaNDKCMakeRefactor } from '../../language/java/JavaNDKCMakeRefactor'

export class AndroidNDKProjectMaker extends AppMaker {

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
      message: `project version name, will auto add -SNAPSHOT [${androidNDKTemplate().versionName}]?`,
      default: androidNDKTemplate().versionName
    },
    {
      type: 'input',
      name: 'projectVersionCode',
      message: `project version code [${androidNDKTemplate().versionCode}]?`,
      default: androidNDKTemplate().versionCode
    },
    {
      type: 'input',
      name: 'libraryModuleName',
      message: `android library module name [${androidNDKTemplate().library.name}]?`,
      default: androidNDKTemplate().library.name
    },
    {
      type: 'input',
      name: 'libraryPackage',
      message: `android library module package [${androidNDKTemplate().library.source.package}]?`,
      default: androidNDKTemplate().library.source.package
    },
    {
      type: 'input',
      name: 'libraryMvnGroup',
      message: `android library module mvn group [${androidNDKTemplate().library.mvn.group}]?`,
      default: androidNDKTemplate().library.mvn.group
    },
    {
      type: 'input',
      name: 'libraryMvnPomArtifactId',
      message: `android library module mvn POM_ARTIFACT_ID [${androidNDKTemplate().library.mvn.pomArtifactId}]?`,
      default: androidNDKTemplate().library.mvn.pomArtifactId
    },
    {
      type: 'list',
      name: 'libraryMvnPomPackaging',
      message: 'android library module mvn POM_PACKAGING [aar|jar]?',
      default: androidNDKTemplate().library.mvn.pomPackaging,
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
      message: `android application module name [${androidNDKTemplate().application.name}]?`,
      default: androidNDKTemplate().application.name
    },
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
    if (!this.doCheckAppPath()) {
      ErrorAndExit(-127, `Error: can not new project path at: ${this.fullPath}`)
    }
    logInfo(`ready create android ndk project from template: ${this.parseTemplateGitUrl()}`)
    await this.onCreateApp()
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
            androidNDKTemplate().application.name]
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
            androidNDKTemplate().library.name]
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
      this.generateAndroidNDKProject(
        projectAppName,
        projectRepoURL,
        projectVersionName,
        projectVersionCode
      )
      this.generateNDKLibrary(
        libraryModuleName,
        libraryPackage,
        libraryMvnGroup,
        libraryMvnPomArtifactId,
        libraryMvnPomPackaging
      )
      this.generateApplication(
        applicationModuleName,
        applicationPackage,
        applicationApplicationId,
        libraryModuleName,
        libraryPackage
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

  async onPostCreateApp(): Promise<void> {
    logInfo(`finish: create android ndk application project at: ${this.fullPath}`)
    ProjectInitComplete()
  }

  private generateAndroidNDKProject = (
    projectAppName: string, projectRepoURL: string,
    projectVersionName: string, projectVersionCode: string
  ) => {
    let finalVersionName = projectVersionName
    if (!finalVersionName.endsWith('-SNAPSHOT')) {
      finalVersionName = `${projectVersionName}-SNAPSHOT`
    }
    logVerbose(`generating project
template project Name: ${androidNDKTemplate().templateProjectName}
project repo: ${projectRepoURL}
project App Name: ${projectAppName}
project VersionName: ${finalVersionName}
project VersionCode: ${projectVersionCode}
    `)
    const nowGitURLParse = GitURLParse(`http://${projectRepoURL}`)
    replaceTextByPathList(new RegExp(this.parseTemplateRepoUrl(), 'g'), projectRepoURL,
      path.join(this.fullPath, 'README.md'))
    replaceTextByPathList(androidNDKTemplate().templateProjectName, projectAppName,
      path.join(this.fullPath, 'README.md'))
    replaceTextByPathList(new RegExp(this.parseTemplateOwnerAndName(), 'g'), `${nowGitURLParse.owner}/${nowGitURLParse.name}`,
      path.join(this.fullPath, 'gradle.properties'))
    replaceTextByPathList(new RegExp(this.parseTemplateSource(), 'g'), nowGitURLParse.source,
      path.join(this.fullPath, 'gradle.properties'))
    replaceTextByFileSuffix(androidNDKTemplate().templateProjectName, projectAppName,
      path.join(this.fullPath,
        androidNDKTemplate().application.name, androidNDKTemplate().application.source.srcRoot), 'xml')
    replaceTextByFileSuffix(androidNDKTemplate().versionName, finalVersionName,
      this.fullPath, 'properties')
    replaceTextByFileSuffix(androidNDKTemplate().versionCode, projectVersionCode,
      this.fullPath, 'properties')
  }

  private generateNDKLibrary = (
    libraryModuleName: string, libraryPackage: string,
    libraryMvnGroup: string, libraryMvnPomArtifactId: string,
    libraryMvnPomPackaging: 'aar') => {
    logVerbose(`generate Library
template module Name: ${androidNDKTemplate().library.name}
library name: ${libraryModuleName}
library package: ${libraryPackage}
mvn group: ${libraryMvnGroup}
mvn POM_ARTIFACT_ID: ${libraryMvnPomArtifactId}
mvn POM_NAME: ${libraryMvnPomArtifactId}
mvn POM_PACKAGING: ${libraryMvnPomPackaging}
`)
    const fixLibraryModuleName = libraryModuleName
      // .replace(new RegExp('-'), '')
      .replace(new RegExp(' ', 'g'), '')
      .toLowerCase()
    const libraryNowPath = path.join(this.fullPath, androidNDKTemplate().library.name)
    // replace gradle.properties
    replaceTextByPathList(androidNDKTemplate().library.mvn.group, libraryMvnGroup,
      path.join(this.fullPath, 'gradle.properties'))
    replaceTextByPathList(androidNDKTemplate().library.mvn.pomArtifactId, libraryMvnPomArtifactId,
      path.join(libraryNowPath, 'gradle.properties'))
    replaceTextByPathList(androidNDKTemplate().library.mvn.pomName, libraryMvnPomArtifactId,
      path.join(libraryNowPath, 'gradle.properties'))
    replaceTextByPathList(androidNDKTemplate().library.mvn.pomPackaging, libraryMvnPomPackaging,
      path.join(libraryNowPath, 'gradle.properties'))
    const libraryFromPackage = androidNDKTemplate().library.source.package
    if (libraryPackage !== libraryFromPackage) {
      logDebug(`=> refactor library package from: ${libraryFromPackage}\n\tto: ${libraryPackage}`)
      // replace library main java source
      const libraryJavaScrRoot = path.join(libraryNowPath, androidNDKTemplate().library.source.javaPath)
      const javaSourcePackageRefactor = new JavaPackageRefactor(
        libraryJavaScrRoot, libraryFromPackage, libraryPackage)
      let err = javaSourcePackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames library javaSourcePackageRefactor err: ${err}`)
      }
      // replace cmake source
      const libraryNDKScrRoot = path.join(libraryNowPath, androidNDKTemplate().library.source.cppPath)
      logDebug(`=> refactor cmake source module path: ${libraryNDKScrRoot}
from: ${androidNDKTemplate().library.name}
to:${libraryModuleName}
package from: ${libraryFromPackage}
to: ${libraryPackage}`)
      const javaNDKCMakeRefactor = new JavaNDKCMakeRefactor(
        libraryNDKScrRoot, libraryJavaScrRoot,
        libraryFromPackage, libraryPackage)
      err = javaNDKCMakeRefactor.doJNICodeRefactor(androidNDKTemplate().library.name, libraryModuleName)
      if (err) {
        logError(`doJNICodeRefactor library err: ${err}`)
      }
      // replace library test java source
      const libraryTestScrRoot = path.join(libraryNowPath, androidNDKTemplate().library.source.testJavaPath)
      const testPackageRefactor = new JavaPackageRefactor(
        libraryTestScrRoot, libraryFromPackage, libraryPackage)
      err = testPackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames library testPackageRefactor err: ${err}`)
      }
      // replace androidManifestPath
      replaceTextByPathList(libraryFromPackage, libraryPackage,
        path.join(libraryNowPath, androidNDKTemplate().library.source.androidManifestPath))
    }
    if (fixLibraryModuleName !== androidNDKTemplate().library.name) {
      // replace module makefile
      const makeFileRefactor = new MakeFileRefactor(
        this.fullPath, path.join(androidNDKTemplate().library.name, androidNDKTemplate().library.moduleMakefile)
      )
      let err = makeFileRefactor.renameTargetLineByLine(androidNDKTemplate().library.name, fixLibraryModuleName)
      if (err) {
        logError(`makeFileRefactor library renameTargetLineByLine err: ${err}`)
      }
      err = makeFileRefactor.renameRootInclude(androidNDKTemplate().library.name, fixLibraryModuleName)
      if (err) {
        logError(`makeFileRefactor library renameRootInclude err: ${err}`)
      }
      fsExtra.moveSync(makeFileRefactor.MakefileTargetPath, path.join(
        this.fullPath, androidNDKTemplate().library.name, `z-${fixLibraryModuleName}.mk`))
      // replace module path and setting.gradle
      const libraryNewPath = path.join(this.fullPath, fixLibraryModuleName)
      fsExtra.moveSync(libraryNowPath, libraryNewPath)
      const gradleSettings = new GradleSettings(this.fullPath)
      err = gradleSettings.renameSettingGradleInclude(androidNDKTemplate().library.name, fixLibraryModuleName)
      if (err) {
        logError(`gradleSettings library renameSettingGradleInclude err: ${err}`)
      }
    }
  }

  private generateApplication = (
    applicationModuleName: string,
    applicationPackage: string,
    applicationApplicationId: string,
    libraryModuleName: string,
    libraryPackage: string
  ) => {
    logVerbose(`generating application
template module Name: ${androidNDKTemplate().application.name}
module Name: ${applicationModuleName}
module package: ${applicationPackage}
module applicationId: ${applicationApplicationId}
    `)
    const fixLibraryModuleName = libraryModuleName
      // .replace(new RegExp('-'), '')
      .replace(new RegExp(' ', 'g'), '')
      .toLowerCase()
    const fixApplicationModuleName = applicationModuleName
      // .replace(new RegExp('-'), '')
      .replace(new RegExp(' ', 'g'), '')
      .toLowerCase()
    const applicationNowPath = path.join(this.fullPath, androidNDKTemplate().application.name)
    const applicationFromPackage = androidNDKTemplate().application.source.package
    if (applicationPackage !== applicationFromPackage) {
      logDebug(`=> refactor application package from: ${applicationFromPackage}\n\tto: ${applicationPackage}`)
      // replace application main java source
      const applicationJavaScrRoot = path.join(
        applicationNowPath, androidNDKTemplate().application.source.javaPath)
      const javaSourcePackageRefactor = new JavaPackageRefactor(
        applicationJavaScrRoot, applicationFromPackage, applicationPackage)
      let err = javaSourcePackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames application javaSourcePackageRefactor err: ${err}`)
      }
      // replace application test java source
      const applicationTestScrRoot = path.join(
        applicationNowPath, androidNDKTemplate().application.source.testJavaPath)
      const testPackageRefactor = new JavaPackageRefactor(
        applicationTestScrRoot, applicationFromPackage, applicationPackage)
      err = testPackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames application testPackageRefactor err: ${err}`)
      }
      // replace application androidTest java source
      const androidTestScrRoot = path.join(
        applicationNowPath, androidNDKTemplate().application.source.androidTestJavaPath)
      const androidTestPackageRefactor = new JavaPackageRefactor(
        androidTestScrRoot, applicationFromPackage, applicationPackage)
      err = androidTestPackageRefactor.doJavaCodeRenames()
      if (err) {
        logError(`doJavaCodeRenames application androidTestPackageRefactor err: ${err}`)
      }
      // replace androidManifestPath
      replaceTextByPathList(applicationFromPackage, applicationPackage,
        path.join(applicationNowPath, androidNDKTemplate().application.source.androidManifestPath))
    }
    if (applicationApplicationId !== androidNDKTemplate().application.applicationId) {
      logDebug(`=> refactor applicationId from: ${androidNDKTemplate().application.applicationId}\n\tto: ${applicationApplicationId}`)
      const appBuildGradlePath = path.join(applicationNowPath, 'build.gradle')
      replaceTextByPathList(`applicationId "${androidNDKTemplate().application.applicationId}"`,
        `applicationId "${applicationApplicationId}"`,
        appBuildGradlePath)
      replaceTextByPathList(`testApplicationId "${androidNDKTemplate().application.applicationId}`,
        `testApplicationId "${applicationApplicationId}`,
        appBuildGradlePath)
    }
    // replace ndk module of use
    if (fixLibraryModuleName !== androidNDKTemplate().library.name) {
      const appBuildGradlePath = path.join(applicationNowPath, 'build.gradle')
      replaceTextByPathList(`':${androidNDKTemplate().library.name}'`,
        `':${fixLibraryModuleName}'`,
        appBuildGradlePath)
      replaceTextByFileSuffix(`${androidNDKTemplate().library.source.package}`,
        `${libraryPackage}`,
        path.join(
          applicationNowPath, androidNDKTemplate().application.source.javaPath), '.java')
    }
    if (fixApplicationModuleName !== androidNDKTemplate().application.name) {
      // replace application module makefile
      const makeFileRefactor = new MakeFileRefactor(
        this.fullPath, path.join(
          androidNDKTemplate().application.name, androidNDKTemplate().application.moduleMakefile)
      )
      let err = makeFileRefactor.renameTargetLineByLine(
        androidNDKTemplate().application.name, fixApplicationModuleName)
      if (err) {
        logError(`makeFileRefactor application renameTargetLineByLine err: ${err}`)
      }
      err = makeFileRefactor.renameRootInclude(androidNDKTemplate().application.name, fixApplicationModuleName)
      if (err) {
        logError(`makeFileRefactor application renameRootInclude err: ${err}`)
      }
      fsExtra.moveSync(makeFileRefactor.MakefileTargetPath, path.join(
        this.fullPath, androidNDKTemplate().application.name, `z-${fixApplicationModuleName}.mk`))
      // replace module path and setting.gradle
      const libraryNewPath = path.join(this.fullPath, fixApplicationModuleName)
      fsExtra.moveSync(applicationNowPath, libraryNewPath)
      const gradleSettings = new GradleSettings(this.fullPath)
      err = gradleSettings.renameSettingGradleInclude(androidNDKTemplate().application.name, fixApplicationModuleName)
      if (err) {
        logError(`gradleSettings application renameSettingGradleInclude err: ${err}`)
      }
    }
  }

}