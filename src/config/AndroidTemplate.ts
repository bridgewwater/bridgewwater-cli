export interface AndroidTemplate {
  templateUrl: string
  templateProjectName: string
  versionName: string
  versionCode: string
  library: {
    name: string
    source: {
      srcRoot: string
      javaPath: string
      testSrcRoot: string
      package: string
    }
    mvn: {
      group: string
      pomArtifactId: string
      pomName: string
      pomPackaging: string
    }
  }
  application: {
    name: string
    applicationId: string
    source: {
      srcRoot: string
      javaPath: string
      testSrcRoot: string
      package: string
    }
  }
}
