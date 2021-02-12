import lodash from 'lodash'
import { isExistPath } from '../../utils/filePlus'
import fsExtra from 'fs-extra'
import { logDebug } from '../../nlog/nLog'
import LineReader from 'n-readlines-next'
import * as fsWalk from '@nodelib/fs.walk'
import * as path from 'path'

function replaceTextLineByLineAtPath(replacePath: string, from: string, to: string) {
  const liner = new LineReader(replacePath)
  const lineCache = []
  let line = liner.next()
  do {
    const lS = line.toString('utf-8')
    if (lS.search(from) !== -1) {
      lineCache.push(lS.replace(from, to))
    } else {
      lineCache.push(lS)
    }
    line = liner.next()
  } while (line)
  const newFileContent = lineCache.join('\n')
  // logDebug(`newFileContent:\n${newFileContent}`)
  fsExtra.writeFileSync(replacePath, newFileContent)
}

export const replaceTextByPathList = (from: string, to: string, ...pathList: string[]): void => {
  if (lodash.isEmpty(pathList)) {
    return
  }
  pathList.forEach((value) => {
    if (isExistPath(value)) {
      logDebug(`replaceTextByPath: ${value} from: ${from} to: ${to}`)
      replaceTextLineByLineAtPath(value, from, to)
    }
  })
}

export const replaceTextByFileSuffix = (from: string, to: string, rootPath: string, suffix: string): void => {
  let targetSuffix = suffix
  if (!targetSuffix.startsWith('.')) {
    targetSuffix = `.${suffix}`
  }
  const entries = fsWalk.walkSync(rootPath)
  entries.forEach((value) => {
    if (path.extname(value.path) === targetSuffix) {
      logDebug(`replaceTextByFileSuffix path: ${value.path} from: ${from} to: ${to} suffix: ${targetSuffix}`)
      replaceTextLineByLineAtPath(value.path, from, to)
    }
  })
}