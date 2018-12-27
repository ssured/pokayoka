Start from https://github.com/Microsoft/TypeScript-Babel-Starter

# Inialize Typescript + Babel 7 for transpiling

- `git init`
- `yarn init`
- `npx add-gitignore`
- `yarn add --dev typescript @babel/core @babel/cli @babel/plugin-proposal-class-properties @babel/plugin-proposal-object-rest-spread @babel/preset-env @babel/preset-typescript`
- `yarn run tsc --init --declaration --allowSyntheticDefaultImports --target esnext --outDir lib`
- Add `.babelrc`: `pbpaste > .babelrc`

```json
{
  "presets": ["@babel/env", "@babel/typescript"],
  "plugins": [
    "@babel/proposal-class-properties",
    "@babel/proposal-object-rest-spread"
  ]
}
```

- Add to `pacakge.json`:

```javascript
"scripts": {
    "type-check": "tsc --noEmit",
    "type-check:watch": "npm run type-check -- --watch",
    "build": "npm run build:types && npm run build:js",
    "build:types": "tsc --emitDeclarationOnly",
    "build:js": "babel src --out-dir lib --extensions \".ts,.tsx\" --source-maps inline"
}
```

- https://webpack.js.org/configuration/configuration-languages/#typescript
