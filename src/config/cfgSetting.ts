import pkgInfo from '../../package.json'
import { binName } from '../utils/pkgInfo'
import path from 'path'
import { AndroidJavaTemplate } from './AndroidJavaTemplate'
import { AndroidNDKTemplate } from './AndroidNDKTemplate'

export interface NodeTemplate {
  templateUrl: string
  proxyTemplateUrl: string
  templateBranch: string
}

export interface ICfgSetting {
  name: string
  version: string
  nodeTemplate: NodeTemplate
  androidJavaTemplate: AndroidJavaTemplate
  androidNDKTemplate: AndroidNDKTemplate
}

export const CfgSetting: ICfgSetting = {
  name: binName(),
  version: pkgInfo.version,
  nodeTemplate: {
    templateUrl: 'https://github.com/bridgewwater/bridgewwater-cli.git',
    proxyTemplateUrl: '',
    templateBranch: 'main'
  },
  androidJavaTemplate: {
    templateUrl: 'https://github.com/bridgewwater/android-java-temple.git',
    proxyTemplateUrl: '',
    templateBranch: 'main',
    templateProjectName: 'android-java-temple',
    versionName: '1.0.1-SNAPSHOT',
    versionCode: '1000001',
    makefile: 'Makefile',
    library: {
      name: 'plugin',
      source: {
        srcRoot: path.join('src'),
        androidManifestPath: path.join('src', 'main', 'AndroidManifest.xml'),
        resPath: path.join('src', 'main', 'res'),
        javaPath: path.join('src', 'main', 'java'),
        testJavaPath: path.join('src', 'test', 'java'),
        androidTestJavaPath: path.join('src', 'androidTest', 'java'),
        package: 'com.sinlov.android.plugin'
      },
      mvn: {
        group: 'com.sinlov.android',
        pomArtifactId: 'android-java-plugin',
        pomName: 'android-java-plugin',
        pomPackaging: 'aar'
      },
      moduleMakefile: 'z-plugin.mk'
    },
    application: {
      name: 'demo',
      applicationId: 'com.sinlov.android.plugin.demo',
      source: {
        srcRoot: path.join('src'),
        androidManifestPath: path.join('src', 'main', 'AndroidManifest.xml'),
        resPath: path.join('src', 'main', 'res'),
        javaPath: path.join('src', 'main', 'java'),
        testJavaPath: path.join('src', 'test', 'java'),
        androidTestJavaPath: path.join('src', 'androidTest', 'java'),
        package: 'com.sinlov.android.plugin.demo'
      },
      moduleMakefile: 'z-demo.mk'
    }
  },
  androidNDKTemplate: {
    templateUrl: 'https://github.com/bridgewwater/android-ndk-temple.git',
    proxyTemplateUrl: '',
    templateBranch: 'main',
    templateProjectName: 'android-java-temple',
    versionName: '1.0.1-SNAPSHOT',
    versionCode: '1000001',
    makefile: 'Makefile',
    library: {
      name: 'plugin',
      source: {
        srcRoot: path.join('src'),
        androidManifestPath: path.join('src', 'main', 'AndroidManifest.xml'),
        resPath: path.join('src', 'main', 'res'),
        javaPath: path.join('src', 'main', 'java'),
        testJavaPath: path.join('src', 'test', 'java'),
        androidTestJavaPath: path.join('src', 'androidTest', 'java'),
        package: 'com.sinlov.android.plugin',
        cppPath: path.join('src', 'main', 'cpp'),
        cmakePath: path.join('src', 'main', 'cpp', 'CMakeLists.txt'),
        ndkVersion: '22.0.7026061'
      },
      mvn: {
        group: 'com.sinlov.android',
        pomArtifactId: 'android-java-plugin',
        pomName: 'android-java-plugin',
        pomPackaging: 'aar'
      },
      moduleMakefile: 'z-plugin.mk'
    },
    application: {
      name: 'demo',
      applicationId: 'com.sinlov.android.plugin.demo',
      source: {
        srcRoot: path.join('src'),
        androidManifestPath: path.join('src', 'main', 'AndroidManifest.xml'),
        resPath: path.join('src', 'main', 'res'),
        javaPath: path.join('src', 'main', 'java'),
        testJavaPath: path.join('src', 'test', 'java'),
        androidTestJavaPath: path.join('src', 'androidTest', 'java'),
        package: 'com.sinlov.android.plugin.demo'
      },
      moduleMakefile: 'z-demo.mk'
    }
  }
}
