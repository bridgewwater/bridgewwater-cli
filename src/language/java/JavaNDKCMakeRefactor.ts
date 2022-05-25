import path from 'path'
import { replaceTextLineByLineAtFile } from '../common/commonLanguage'
import * as fsWalk from '@nodelib/fs.walk'
import fsExtra from 'fs-extra'
import { logDebug } from '../../nlog/nLog'

export class JavaNDKCMakeRefactor {

  srcCMakeRootPath: string

  srcJavaRootPath: string

  fromPackage: string

  toPackage: string


  constructor(srcCMakeRootPath: string, srcJavaRootPath: string, fromPackage: string, toPackage: string) {
    this.srcCMakeRootPath = path.resolve(srcCMakeRootPath)
    this.srcJavaRootPath = path.resolve(srcJavaRootPath)
    this.fromPackage = fromPackage
    this.toPackage = toPackage
  }

  doJNICodeRefactor(fromAlias: string, toAlias: string): Error | null {
    const jniPkgFrom = `Java_${this.fromPackage.replace(RegExp(/\./, 'g'), '_')}`
    const jniPkgTo = `Java_${this.toPackage.replace(RegExp(/\./, 'g'), '_')}`
    const jniCppTo = `${toAlias.replace(RegExp(/-/, 'g'), '_')}`
    logDebug(`doJNICodeRefactor jniPkg from: ${jniPkgFrom}
to: ${jniPkgTo} jniCppTo: ${jniCppTo}`)
    try {
      const entries = fsWalk.walkSync(this.srcCMakeRootPath)
      entries.forEach((value) => {
        replaceTextLineByLineAtFile(value.path, jniPkgFrom, jniPkgTo)
      })
      entries.forEach((value) => {
        replaceTextLineByLineAtFile(value.path, fromAlias, jniCppTo)
      })
      const defineFrom = fromAlias.toUpperCase()
      const defineTo = jniCppTo.toUpperCase()
      entries.forEach((value) => {
        if (path.extname(value.name) === '.h') {
          replaceTextLineByLineAtFile(value.path, defineFrom, defineTo)
        }
      })
      entries.forEach((value) => {
        if (value.name.search(fromAlias) !== -1) {
          fsExtra.moveSync(value.path, path.join(
            path.dirname(value.path),
            value.name.replace(fromAlias, jniCppTo)))
        }
      })
      return this.doJavaSourceLoadRefactor(fromAlias, toAlias)
    } catch (e) {
      return e
    }
  }

  doJavaSourceLoadRefactor(fromAlias: string, toAlias: string): Error | null {
    try {
      const loadJavaSourceFrom = `"${fromAlias}-lib"`
      const loadJavaSourceTo = `"${toAlias}-lib"`
      const entries = fsWalk.walkSync(this.srcJavaRootPath)
      logDebug(`doJavaSourceLoadRefactor from: ${loadJavaSourceFrom}
to: ${loadJavaSourceTo}`)
      entries.forEach((value) => {
        if (path.extname(value.name) === '.java') {
          logDebug(`doJavaSourceLoadRefactor java at: ${value.path}`)
          replaceTextLineByLineAtFile(value.path, loadJavaSourceFrom, loadJavaSourceTo)
        }
      })
      return null
    } catch (e) {
      return e
    }
  }
}