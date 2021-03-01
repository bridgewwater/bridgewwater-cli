export interface AndroidNDKTemplate {
  templateUrl: string
  proxyTemplateUrl: string
  templateBranch: string
  templateProjectName: string
  versionName: string
  versionCode: string
  makefile: string
  library: {
    name: string
    source: {
      srcRoot: string
      androidManifestPath: string
      resPath: string
      javaPath: string
      testJavaPath: string
      androidTestJavaPath: string
      package: string
      cppPath: string
      cmakePath: string
      ndkVersion: string
    }
    mvn: {
      group: string
      pomArtifactId: string
      pomName: string
      pomPackaging: string
    }
    moduleMakefile: string
  }
  application: {
    name: string
    applicationId: string
    source: {
      srcRoot: string
      androidManifestPath: string
      resPath: string
      javaPath: string
      testJavaPath: string
      androidTestJavaPath: string
      package: string
    }
    moduleMakefile: string
  }
}
