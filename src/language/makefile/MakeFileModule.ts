import path from 'path'

export class MakeFileModule {
  ProjectRootPath: string

  RootMakefilePath: string

  ModuleNameList: string[] = []

  ModulePathList: string[] = []

  constructor(ProjectRootPath: string, ...moduleList: string[]) {
    this.ProjectRootPath = path.resolve(ProjectRootPath)
    this.RootMakefilePath = path.join(this.ProjectRootPath, 'Makefile')
    if (moduleList.length > 0) {
      moduleList.forEach((value) => {
        this.ModuleNameList.push(value)
        this.ModulePathList.push(path.join(this.ProjectRootPath, value))
      })
    }
  }
}