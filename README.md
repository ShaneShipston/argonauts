# Argonauts

Simple build system based on Gulp and Webpack.

## Installation

`npm install argonauts --save-dev`

## Options

**cwd** `'process.cwd()'`  
Project folder

**src** `'src'`  
Base asset directory

**dest** `'.'`  
Base output directory

**browsers** `['> 1%', 'ie >= 11']`  
Browser support.

## Browser Sync

**name** `'Argonauts'`  
Project name.

**url** `null`  
Proxy URL.

**port** `3000`  
Localhost port.

**watch** `[]`  
Additional files to watch for changes.

## JavaScript

**entries** `[]`  
Input paths for webpack.

**js** `'js'`  
Input and output directory. You may pass in an object containing in and out.

**jsExt** `'js'`  
List of extensions to trigger a compile on

**webpack** `{}`  
Webpack options override. JS rules are automatically applied.

## Fonts

**append** `null`  
Function to be called upon font conversion.

**fonts** `'fonts'`  
Input and output directory. You may pass in an object containing in and out.

**appendFile** `null`  
File path to append template string to. The path is relative to your gulpfile.

**appendTemplate** `null`  
A string containing a `{font}` placeholder which will be replaced with the font's file name.

## SCSS

**css** `'css'`  
Input and output directory. You may pass in an object containing in and out.

**sass** `{}`  
Options passed to [gulp-sass](https://github.com/dlmanning/gulp-sass) / the modern Sass JS API. Defaults to `{ style: 'compressed' }`. Use this for `silenceDeprecations`, `loadPaths`, etc.

## Images

**img** `'img'`  
Input and output directory. You may pass in an object containing in and out.

# Example Gulpfile

```js
const { setup, styles, javascript, browsersync, images, monitor } = require('argonauts');
const { parallel, series } = require('gulp');

setup({
    url: 'example.vm',
    entries: ['main'],
    css: {
        in: 'scss',
        out: '.',
    },
    watch: [
        '*.php',
        '**/*.php',
        'updated.txt',
    ],
});

exports.init = parallel(styles, javascript);
exports.default = series(browsersync, parallel(styles, javascript, images), monitor);
```

## License

[MIT](http://opensource.org/licenses/MIT)
