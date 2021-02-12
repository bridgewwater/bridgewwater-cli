import pkgInfo from '../../package.json'
import { binName } from '../utils/pkgInfo'
import path from 'path'
import { AndroidTemplate } from './AndroidTemplate'

export interface NodeTemplate {
  templateUrl: string
}


export interface ICfgSetting {
  name: string
  version: string
  nodeTemplate: NodeTemplate
  androidTemplate: AndroidTemplate
}

export const CfgSetting: ICfgSetting = {
  name: binName(),
  version: pkgInfo.version,
  nodeTemplate: {
    templateUrl: 'https://github.com/bridgewwater/bridgewwater-cli.git'
  },
  androidTemplate: {
    templateUrl: 'https://github.com/bridgewwater/android-java-temple.git',
    versionName: '1.0.0-SNAPSHOT',
    versionCode: '1000000',
    library: {
      name: 'plugin',
      source: {
        srcRoot: path.join('src'),
        javaPath: path.join('src', 'main', 'java'),
        testSrcRoot: path.join('src', 'test'),
        package: 'com.sinlov.android.plugin'
      },
      mvn: {
        group: 'com.sinlov.android',
        pomArtifactId: 'android-plugin',
        pomName: 'android-plugin',
        pomPackaging: 'aar'
      }
    },
    application: {
      name: 'test',
      applicationId: 'com.demo.android.template',
      source: {
        srcRoot: path.join('src'),
        javaPath: path.join('src', 'main', 'java'),
        testSrcRoot: path.join('src', 'test'),
        package: 'com.demo.android.template'
      }
    }
  }
}
