# Argonauts

Simple build system based on Gulp and Webpack.

## Installation

`npm install argonauts --save-dev`

## Usage

The options provided below make it faster to setup a basic gulp file for common tasks. After choosing your options the system works like any standard gulp task.

If something doesn't exist you may need or doesn't quite do what you want you can write tasks normally.

### Options

src: Base asset directory. Defaults to 'src'  
dest: Base output directory. Defaults to '.'

### Browser Sync

name: Project name. Defaults to 'Argonauts'  
url: Proxy URL. Defaults to null.  
port: Localhost port. Defaults to 3000  
watch: Additional files to watch for changes. Defaults to []

### JavaScript

entries: Input paths for webpack. Defaults to []  
js: Input and output directory. You may pass in an object containing in and out. Defaults to 'js'  
jsExt: List of extensions to trigger a compile on  
browsers: Browser support. Defaults to ['> 1%', 'ie >= 11']  
webpack: Webpack options override. JS rules are automatically applied. Defaults to {}

### Fonts

append: Function to be called upon font conversion. Defaults to null  
fonts: Input and output directory. You may pass in an object containing in and out. Defaults to 'fonts'

### SCSS

css: Input and output directory. You may pass in an object containing in and out. Defaults to 'css'  
browsers: Browser support. Defaults to ['> 1%', 'ie >= 11']

### Images

img: Input and output directory. You may pass in an object containing in and out. Defaults to 'img'

## Example

```
const { setup, styles, javascript, browsersync, images, monitor } = require('argonauts');
const { parallel, series } = require('gulp');

setup({
    url: 'example.vm',
    entries: ['main'],
    dest: '',
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
