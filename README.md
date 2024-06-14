# Ember Language Server

forked from https://github.com/ember-tooling/ember-language-server to adapt to the Forest Admin frontend architecture.

you must use this ember language server extension for the patch to work:
https://marketplace.visualstudio.com/items?itemName=EmberTooling.emberjs

compile and link it to your vscode (or webstorm) extension by following those steps:



```bash
yarn install
yarn compile
yarn link
cd ~/.vscode/extensions/embertooling.vscode-ember-3.0.57 # or wherever your extension embertooling is installed
yarn link @ember-tooling/ember-language-server
```


