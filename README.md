cli of https://github.com/bridgewwater/ project maker 

[![Node-CI](https://github.com/bridgewwater/bridgewwater-cli/workflows/Node-CI/badge.svg?branch=main)](https://github.com/bridgewwater/bridgewwater-cli/actions?query=workflow%3ANode-CI)
[![NPM Version](http://img.shields.io/npm/v/bridgewwater-cli.svg?style=flat)](https://www.npmjs.org/package/bridgewwater-cli)
[![NPM Downloads](https://img.shields.io/npm/dm/bridgewwater-cli.svg?style=flat)](https://npmcharts.com/compare/bridgewwater-cli?minimal=true)

## registry

[https://github.com/bridgewwater/bridgewwater-cli](https://github.com/bridgewwater/bridgewwater-cli)

this is for https://github.com/bridgewwater/ project cli maker.

## usage

```bash
$ npm install -g bridgewwater-cli
$ bww --help
# make android-java and android-java module
$ bww android-java --help
```

## android-java

### make android project as java

```bash
$ bww android-java new-android
ready create android java project from template: https://github.com/bridgewwater/android-java-temple
? new project git path [github.com/bridgewwater/android-java-temple]? github.com/bridgewwater/new-android
? android App name [new-android]? NewApp
? project version name, will auto add -SNAPSHOT [1.0.1-SNAPSHOT]? 1.0.1-SNAPSHOT
? project version code [1000001]? 1000001
? android library module name [plugin]? base
? android library module package [com.sinlov.android.plugin]? com.sinlov.android.base
? android library module mvn group [com.sinlov.android]? com.sinlov.android
? android library module mvn POM_ARTIFACT_ID [android-java-plugin]? android-base
? android library module mvn POM_PACKAGING [aar|jar]? library aar
? android application module name [demo]? app
? android application module package [com.sinlov.android.plugin.demo]? com.sinlov.android.base.demo
? android application module applicationId (com.sinlov.android.plugin.demo)? com.sinlov.android.base.demo
? Initialize git ? No
? Check gradlew buildEnvironment ? No
use template: https://github.com/bridgewwater/android-java-temple.git

-> template clone start...

Cloning into 'new-android'...
...

-> template clone complete...

generating project
template project Name: android-java-temple
project repo: github.com/bridgewwater/new-android
project App Name: NewApp
project VersionName: 1.0.1-SNAPSHOT
project VersionCode: 1000001
... 
generate Library
template module Name: plugin
library name: base
library package: com.sinlov.android.base
mvn group: com.sinlov.android
mvn POM_ARTIFACT_ID: android-base
mvn POM_NAME: android-base
mvn POM_PACKAGING: aar
...
generating application
template module Name: demo
module Name: app
module package: com.sinlov.android.base.demo
module applicationId: com.sinlov.android.base.demo
...
finish: create android java project at: /Users/sinlov/Documents/github.com/bridgewwater/bridgewwater-cli/dist/new-android

✅ Project init complete.
```

### in bww android-java project

- add library

```bash
$ bww android-java -l newpp
ready create android java library from template: https://github.com/bridgewwater/android-java-temple
? android library module package [com.sinlov.android.plugin]? com.sinlov.android.newpp
? android library module mvn POM_ARTIFACT_ID [android-java-plugin]? newpp
? android library module mvn POM_PACKAGING [aar|jar]? library aar
? Check gradlew build ? No
=> cache template https://github.com/bridgewwater/android-java-temple.git
template branch: main
...
-> generate library
library name: newpp
library path: /Users/sinlov/Documents/github.com/bridgewwater/bridgewwater-cli/dist/new-android/newpp
library package: com.sinlov.android.newpp
mvn POM_ARTIFACT_ID: newpp
mvn POM_NAME: newpp
mvn POM_PACKAGING: aar
template module Name: plugin

finish: create android library project at: /Users/sinlov/Documents/github.com/bridgewwater/bridgewwater-cli/dist/new-android/newpp

✅ Project init complete.
```

- add application
```bash
$ bww android-java --application simple
ready create android java application from template: https://github.com/bridgewwater/android-java-temple
? android application module package [com.sinlov.android.plugin.demo]? com.sinlov.android.simple.demo
? android application module applicationId (com.sinlov.android.plugin.demo)? com.sinlov.android.simple.demo
? android application module App name [simple]? (simple)
? Check gradlew build ? No
...
-> generate application
application name: simple
application path: /Users/sinlov/Documents/github.com/bridgewwater/bridgewwater-cli/dist/new-android/simple
application package: com.sinlov.android.simple.demo
application applicationId: com.sinlov.android.simple.demo
application module App name: simple
template module Name: demo

finish: create android application project at: /Users/sinlov/Documents/github.com/bridgewwater/bridgewwater-cli/dist/new-android/simple

✅ Project init complete.
```

### can use proxy git url

```bash
# show proxy
$ bww android-java --printProxyTemplate
-> now proxy template: 'git@gitea.sinlov.com:bridgewwater/android-java-temple.git'
# set proxy
$ bww android-java --proxyTemplate
-> now set proxyTemplate: git@gitea.sinlov.com:bridgewwater/android-java-temple.git
# close proxy
$ bww android-java -p ""

# when set proxy will ask use, default is N
? use proxyTemplateUrl: [ git@gitea.parlor.sinlov.cn:bridgewwater/android-java-temple.git ] ? (y/N) 
```

## character

- support code check `prettier` `eslint` `tslint`
- support unit test `jest` for typescript
- support `rollup` build node cli
- support `nodemon` auto build
- support global config setting and log save

## env

| item              | version           |
|:------------------|:------------------|
| node              | 10.+ |
| prettier          | ^2.2.1 |
| eslint            | ^7.18.0 |
| tslint            | ^6.1.3 |
| jest              | ^26.6.3 |
| rollup            | ^2.38.0 |
| nodemon           | ^2.0.7 |
| log4js            | ^6.3.0 |

## dev

```bash
npm install
npm run dev

# then test cli --help as
npm run cli:help

# prettier
npm run format
# lint check ts or js
npm run lint
```

## prod

```bash
npm ci
# or
npm install

# then
npm run build
```