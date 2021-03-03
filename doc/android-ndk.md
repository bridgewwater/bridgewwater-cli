## android-ndk

make android ndk project template use: [https://github.com/bridgewwater/android-ndk-temple.git](https://github.com/bridgewwater/android-ndk-temple.git)

```bash
$ bww android-ndk --help
Usage: bww android-ndk [options] <targetName>

clone and build project, as: bww android-ndk targetName
    default template use: https://github.com/bridgewwater/android-ndk-temple.git


Options:
  -t, --template <path>       template address, support git address and local path
  -l, --library               only make library in project path
  --application               only make application in project path
  --printProxyTemplate        show proxy template
  -p, --proxyTemplate <path>  set proxy template, close use --proxyTemplate ""
  -h, --help                  display help for command
```

### use proxy git url

```bash
# set proxy
$ bww android-ndk --proxyTemplate 'git@gitea.sinlov.com:bridgewwater/android-ndk-temple.git'
-> now set proxyTemplate: git@gitea.sinlov.com:bridgewwater/android-ndk-temple.git
# show proxy
$ bww android-ndk --printProxyTemplate
-> now proxy template: 'git@gitea.sinlov.com:bridgewwater/android-ndk-temple.git'
# close proxy
$ bww android-ndk -p ""
Warning: will close use proxyTemplate
-> now set proxyTemplate:
-> remove android-ndk proxy at: ...

# when set proxy will ask use, default is N
? use proxyTemplateUrl: [ git@gitea.sinlov.com:bridgewwater/android-ndk-temple.git ] ? (y/N)
```

### new android ndk project

```bash
$ bww android-ndk new-ndk-project
? new project git path [github.com/bridgewwater/android-ndk-temple]? github.com/bridgewwater/new-ndk-project
? android App name [new-ndk-project]? NewNDKProject
? project version name, will auto add -SNAPSHOT [1.0.1-SNAPSHOT]? 1.0.1-SNAPSHOT
? project version code [1000001]? 1000001
? android library module name [ndkmodule]? ndkpp
? android library module package [com.sinlov.android.ndkmodule]? com.sinlov.new.ndkpp
? android library module mvn group [com.sinlov.android]? com.sinllv.new
? android library module mvn POM_ARTIFACT_ID [android-ndk-module]? ndkpp
? android library module mvn POM_PACKAGING [aar|jar]? library aar
? android application module name [demo]? demo
? android application module package [com.sinlov.android.ndkmodule.demo]? com.sinlov.new.ndkpp.demo
? android application module applicationId (com.sinlov.android.ndkmodule.demo)? com.sinlov.new.ndkpp.demo
use template: git@gitea.parlor.sinlov.cn:android-zoo/android-ndk-temple.git
generating project
template project Name: android-ndk-temple
project repo: github.com/bridgewwater/new-ndk-project
project App Name: NewNDKProject
project VersionName: 1.0.1-SNAPSHOT
project VersionCode: 1000001
    
generate Library
template module Name: ndkmodule
library name: ndkpp
library package: com.sinlov.new.ndkpp
mvn group: com.sinllv.new
mvn POM_ARTIFACT_ID: ndkpp
mvn POM_NAME: ndkpp
mvn POM_PACKAGING: aar

generating application
template module Name: demo
module Name: demo
module package: com.sinlov.new.ndkpp.demo
module applicationId: com.sinlov.new.ndkpp.demo
    
finish: create android ndk application project at: ...
```

### new android module ndk library

```bash
$ bww android-ndk -l bizndk
? android ndk library module package [com.sinlov.android.ndkmodule]? com.sinlov.new.bizndk
? android ndk library module mvn POM_ARTIFACT_ID [android-ndk-module]? bizndk
? android ndk library module mvn POM_PACKAGING [aar|jar]? library aar
? Check gradlew build ? No
-> generate library
library name: bizndk
library path: /Users/sinlov/Documents/github.com/bridgewwater/bridgewwater-cli/dist/new-ndk-project/bizndk
library package: com.sinlov.new.bizndk
mvn POM_ARTIFACT_ID: bizndk
mvn POM_NAME: bizndk
mvn POM_PACKAGING: aar
template module Name: ndkmodule

finish: create android ndk library project at: ...
```

### new android module ndk application

```bash
$ bww android-ndk -l bizndk
? android application module package [com.sinlov.android.ndkmodule.demo]? com.sinlov.new.simple
? android application module applicationId (com.sinlov.android.ndkmodule.demo)? com.sinlov.new.simple
? android application module App name [simple]? simple
? Check gradlew build ? No
...
-> generate application
application name: simple
application path: /Users/sinlov/Documents/github.com/bridgewwater/bridgewwater-cli/dist/new-ndk-project/simple
application package: com.sinlov.new.simple
application applicationId: com.sinlov.new.simple
application module App name: simple
template module Name: demo

finish: create android application project at: ... 
```