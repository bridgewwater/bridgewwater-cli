import path from 'path'
import fsExtra from 'fs-extra'
import LineReader from 'n-readlines-next'

export class GradleSettings {
  ProjectRootPath: string

  SettingsGradlePath: string

  constructor(ProjectRootPath: string) {
    this.ProjectRootPath = path.resolve(ProjectRootPath)
    this.SettingsGradlePath = path.join(this.ProjectRootPath, 'settings.gradle')
  }

  private replaceTextLineByLine(
    replacePath: string = this.SettingsGradlePath, fromText: string, toText: string,
    encoding?: 'utf-8'
  ) {
    const liner = new LineReader(replacePath)
    const lineEach = []
    let line = liner.next()
    let mustReplace = false
    do {
      const lS = line.toString(encoding)
      if (lS.search(fromText) !== -1) {
        lineEach.push(lS.replace(fromText, toText))
        mustReplace = true
      } else {
        lineEach.push(lS)
      }
      line = liner.next()
    } while (line)
    if (mustReplace) {
      const newFileContent = lineEach.join('\n')
      // logDebug(`newFileContent:\n${newFileContent}`)
      fsExtra.writeFileSync(replacePath, newFileContent)
    }
  }

  renameSettingGradleInclude(from: string, to: string): Error | null {
    if (!fsExtra.existsSync(this.SettingsGradlePath)) {
      return new Error(`settings.gradle not exists: ${this.SettingsGradlePath}`)
    }
    const fromText = `include ':${from}'`
    const toText = `include ':${to}'`
    this.replaceTextLineByLine(this.SettingsGradlePath, fromText, toText)
    return null
  }
}