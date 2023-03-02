cli of https://github.com/bridgewwater/ project maker 

[![Node-CI](https://github.com/bridgewwater/bridgewwater-cli/workflows/Node-CI/badge.svg?branch=main)](https://github.com/bridgewwater/bridgewwater-cli/actions?query=workflow%3ANode-CI)
[![NPM Version](http://img.shields.io/npm/v/bridgewwater-cli.svg?style=flat)](https://www.npmjs.org/package/bridgewwater-cli)
[![NPM Downloads](https://img.shields.io/npm/dm/bridgewwater-cli.svg?style=flat)](https://npmcharts.com/compare/bridgewwater-cli?minimal=true)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fbridgewwater%2Fbridgewwater-cli.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fbridgewwater%2Fbridgewwater-cli?ref=badge_shield)

## registry

[https://github.com/bridgewwater/bridgewwater-cli](https://github.com/bridgewwater/bridgewwater-cli)

this is for https://github.com/bridgewwater/ project cli maker.

## usage

```bash
$ npm install -g bridgewwater-cli
$ bww --help
# make node TypeScript cli project
$ bww node-ts-cli --help
# make android-java and android-java module
$ bww android-java --help
# set proxy of android-java 
$ bww android-java --proxyTemplate https://github.com.cnpmjs.org/bridgewwater/android-java-temple.git

# make android-ndk and android-ndk module
$ bww android-ndk --help
# set proxy of android-ndk 
$ bww android-ndk --proxyTemplate https://github.com.cnpmjs.org/bridgewwater/android-ndk-temple.git
```

more use see [doc/README.md](doc/README.md)

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

## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fbridgewwater%2Fbridgewwater-cli.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fbridgewwater%2Fbridgewwater-cli?ref=badge_large)