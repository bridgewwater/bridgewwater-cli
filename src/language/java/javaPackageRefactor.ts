import path from 'path'
import { isExistPath } from '../../utils/filePlus'
import * as fsWalk from '@nodelib/fs.walk'
import fsExtra from 'fs-extra'
import LineReader from 'n-readlines-next'
import { logDebug } from '../../nlog/nLog'

export class JavaPackageRefactor {
  srcRootPath: string

  fromPackage: string

  toPackage: string

  private fromPackageFullPathCache: string | undefined

  private toPackageFullPathCache: string | undefined

  constructor(srcRootPath: string, fromPackage: string, toPackage: string) {
    this.srcRootPath = path.resolve(srcRootPath)
    this.fromPackage = fromPackage
    this.toPackage = toPackage
  }

  fromPackageFullPath(): string {
    if (this.fromPackageFullPathCache == null) {
      const pathSplit = this.fromPackage.split('.')
      let cache = this.srcRootPath
      pathSplit.forEach((value) => {
        cache = path.join(cache, value)
      })
      this.fromPackageFullPathCache = cache
    }
    return this.fromPackageFullPathCache
  }

  toPackageFullPath(): string {
    if (this.toPackageFullPathCache == null) {
      const pathSplit = this.toPackage.split('.')
      let cache = this.srcRootPath
      pathSplit.forEach((value) => {
        cache = path.join(cache, value)
      })
      this.toPackageFullPathCache = cache
    }
    return this.toPackageFullPathCache
  }

  doJavaCodeRenames(): Error | null {
    if (!isExistPath(this.fromPackageFullPath())) {
      return new Error(`from path not exists: ${this.fromPackageFullPath()}`)
    }
    const entries = fsWalk.walkSync(this.fromPackageFullPath())
    const readyRemoveJavaSource: string[] = []
    entries.forEach((value) => {
      if (path.extname(value.path) === '.java') {
        readyRemoveJavaSource.push(value.path)
      }
    })
    if (readyRemoveJavaSource.length === 0) {
      return new Error(`from path not has java code: ${this.fromPackageFullPath()}`)
    }
    if (!isExistPath(this.toPackageFullPath())) {
      fsExtra.mkdirpSync(this.toPackageFullPath())
    }
    readyRemoveJavaSource.forEach((value: string) => {
      const tailPath = value.replace(this.fromPackageFullPath(), '')
      const dist = path.join(this.toPackageFullPath(), tailPath)
      logDebug(`-> move java code from: ${value}\n\tto: ${dist}`)
      fsExtra.moveSync(value, dist)
    })
    const fromPackageText = `package ${this.fromPackage}`
    const toPackageText = `package ${this.toPackage}`
    const toPathWalk = fsWalk.walkSync(this.toPackageFullPath())
    toPathWalk.forEach((value) => {
      this.javaCodePackageRename(value.path, fromPackageText, toPackageText)
    })
    const rootWalk = fsWalk.walkSync(this.srcRootPath)
    rootWalk.forEach((value) => {
      const fromImportPackageText = `import ${this.fromPackage}`
      const toImportPackageText = `import ${this.toPackage}`
      this.javaCodePackageRename(value.path, fromImportPackageText, toImportPackageText)
    })
    fsExtra.removeSync(this.fromPackageFullPath())
    return null
  }

  // eslint-disable-next-line class-methods-use-this
  javaCodePackageRename(codePath: string, fromPackageText: string, toPackageText: string): Error | null {
    if (path.extname(codePath) !== '.java') {
      return new Error(`not java code path: ${codePath}`)
    }
    const liner = new LineReader(codePath)
    const lineCache = []
    let line = liner.next()
    do {
      const lS = line.toString('utf-8')
      if (lS.search(fromPackageText) !== -1) {
        lineCache.push(lS.replace(fromPackageText, toPackageText))
      } else {
        lineCache.push(lS)
      }
      line = liner.next()
    } while (line)
    const newFileContent = lineCache.join('\n')
    // logDebug(`newFileContent:\n${newFileContent}`)
    fsExtra.writeFileSync(codePath, newFileContent)
    return null
  }
}