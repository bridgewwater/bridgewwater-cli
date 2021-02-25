import path from 'path'
import fsExtra from 'fs-extra'
import { addTextOneLineAfter, replaceTextLineByLineAtPath } from '../common/commonLanguage'

export class GradleSettings {
  ProjectRootPath: string

  SettingsGradlePath: string

  constructor(ProjectRootPath: string) {
    this.ProjectRootPath = path.resolve(ProjectRootPath)
    this.SettingsGradlePath = path.join(this.ProjectRootPath, 'settings.gradle')
  }

  renameSettingGradleInclude(from: string, to: string): Error | null {
    if (!fsExtra.existsSync(this.SettingsGradlePath)) {
      return new Error(`settings.gradle not exists: ${this.SettingsGradlePath}`)
    }
    const fromText = `include ':${from}'`
    const toText = `include ':${to}'`
    replaceTextLineByLineAtPath(this.SettingsGradlePath, fromText, toText)
    return null
  }

  addGradleModuleInclude(addModule: string): Error | null {
    if (!fsExtra.existsSync(this.SettingsGradlePath)) {
      return new Error(`settings.gradle not exists: ${this.SettingsGradlePath}`)
    }
    addTextOneLineAfter(
      this.SettingsGradlePath,
      /^include .*/,
      `include ':${addModule}'`
    )
    return null
  }
}