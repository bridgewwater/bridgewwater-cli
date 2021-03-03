# node-ts-cli

make typescript cli project

template url: [https://github.com/bridgewwater/android-ndk-temple.git](https://github.com/bridgewwater/android-ndk-temple.git)

```bash
$ bww node-ts-cli --help
Usage: bww node-ts-cli [options] <appName>

clone and build project, as: bww node-ts-cli targetName
        default template use: https://github.com/bridgewwater/node-cli-ts-temple.git


Options:
  -t, --template <path>       template address, support git address and local path
  --printProxyTemplate        show proxy template
  -p, --proxyTemplate <path>  set proxy template, close use --proxyTemplate ""
  -h, --help                  display help for command 
```

## make node TypeScript cli project

```bash
ready create node-typescript-cli project from template: https://github.com/bridgewwater/node-cli-ts-temple
? new project git path [github.com/bridgewwater/node-cli-ts-temple]? github.com/bridgewwater/tbb-cli
? Initialize git？ No
? how to install dependencies: ues npm
generating project
project repo: github.com/bridgewwater/tbb-cli
use template: https://github.com/bridgewwater/node-cli-ts-temple.git

-> template clone start...

Cloning into 'tbb-cli'...
remote: Enumerating objects: 63, done.
remote: Counting objects: 100% (63/63), done.
remote: Compressing objects: 100% (56/56), done.
remote: Total 63 (delta 0), reused 32 (delta 0), pack-reused 0
Receiving objects: 100% (63/63), 147.23 KiB | 338.00 KiB/s, done.
-> template clone complete...

added 977 packages in 14s
finish: create node-typescript-cli at: ...

✅ Project init complete.
```