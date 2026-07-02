# NumberBank 2.6 for Xcratch
An example extension for [Xcratch](https://xcratch.github.io/)

This extension add extra-blocks, that enables cloud associative arrays to save values from Scratch 3.0 projects to Firebase Cloud.


## ✨ What You Can Do With This Extension

Play [Example Project](https://con3code.github.io/xcratch/#https://con3code.github.io/xcx-numberbank/projects/example.sb3) to look at what you can do with "NumberBank" extension. 

<iframe src="https://con3code.github.io/xcratch/#https://con3code.github.io/xcx-numberbank/projects/example.sb3" width="540px" height="460px"></iframe>


## Reliability Blocks (v2.6)

NumberBank writes are now atomic (card and bank records are committed together) and transient network errors are retried automatically. Three blocks support this:

- **change [CARD] of [BANK] by [VAL]** — adds VAL to the current cloud value in a single Firestore transaction. Safe even when multiple projects update the same card at the same time (no lost updates, unlike a get-then-put sequence).
- **last action ok?** — boolean block that reports whether the most recent cloud operation succeeded.
- **last error** — reporter that returns a short description of the most recent error ("cannot connect", "not allowed", ...), or an empty string after a success.

Tip: after a **when updated** hat fires, read the latest value with **value of [CARD] of [BANK]**.

## How to Use in Xcratch

This extension can be used with other extension in [Xcratch](https://xcratch.github.io/). 
1. Open [Xcratch Editor](https://xcratch.github.io/editor)
2. Click 'Add Extension' button
3. Select 'Extension Loader' extension
4. Type the module URL in the input field 
```
https://con3code.github.io/xcx-numberbank/dist/numberbank.mjs
```

## Development

### Register on the local Xcratch

Run register script to install this extension on the local Xcratch for testing.

```sh
npm run register
```

### Bundle into a Module

Run build script to bundle this extension into a module file which could be loaded on Xcratch.

```sh
npm run build
```

## 🏠 Home Page

Open this page from [https://con3code.github.io/xcx-numberbank/](https://con3code.github.io/xcx-numberbank/)


## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/con3code/xcx-numberbank/issues). 
