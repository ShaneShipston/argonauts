const { series, src, dest, watch } = require('gulp');
const sass = require('gulp-sass');
const prefix = require('gulp-autoprefixer');
const minifycss = require('gulp-clean-css');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const imagemin = require('gulp-imagemin');
const otfforge = require('otfforge');
const sync = require('browser-sync').create();
const del = require('delete');
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const gulpWebpack = require('webpack-stream');

let config = {
    src: 'src',
    dest: '.',
    browsers: ['> 1%', 'ie >= 11'],

    // Browsersync
    name: 'Argonauts',
    url: null,
    port: 3000,
    watch: [],

    // JS
    entries: [],
    js: 'js',
    jsExt: 'js',
    webpack: {},

    // Fonts
    append: null,
    appendFile: null,
    appendTemplate: null,
    fonts: 'fonts',

    // CSS
    css: 'css',

    // Images
    img: 'img',
};

let webpackOptions;

function getInputPath(type, uri = null) {
    const segments = [];

    if (config.src.length > 0) {
        segments.push(config.src);
    }

    if (typeof config[type] !== 'string') {
        if (config[type].in !== null) {
            segments.push(config[type].in);
        }
    } else if (config[type] !== null) {
        segments.push(config[type]);
    }

    if (uri !== null) {
        segments.push(uri);
    }

    return segments.join('/');
}

function getOutputPath(type, uri = null) {
    const segments = [];

    if (config.dest.length > 0) {
        segments.push(config.dest);
    }

    if (typeof config[type] !== 'string') {
        if (config[type].out !== null) {
            segments.push(config[type].out);
        }
    } else if (config[type] !== null) {
        segments.push(config[type]);
    }

    if (uri !== null) {
        segments.push(uri);
    }

    return segments.join('/');
}

function setup(options) {
    config = Object.assign(config, options);

    const entries = {};

    if (config.js !== null) {
        config.entries.forEach((entry) => {
            entries[entry] = path.resolve(__dirname, '../../', `${getInputPath('js', entry)}.js`);
        });
    }

    if (config.entries.length > 0) {
        webpackOptions = Object.assign({}, {
            mode: 'production',
            entry: entries,
            output: {
                path: path.resolve(__dirname, '../../', getOutputPath('js')),
                filename: '[name].js',
            },
            module: {
                rules: [],
            },
        }, config.webpack);

        webpackOptions.module.rules.push({
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: [
                        [
                            '@babel/preset-env',
                            {
                                targets: {
                                    browsers: config.browsers,
                                },
                            },
                        ],
                    ],
                },
            },
        });
    }

    if (config.appendTemplate !== null && config.appendFile !== null) {
        config.append = (filename) => {
            const basename = path.basename(filename, '.ttf');
            const appendString = config.appendTemplate.replace('{font}', basename);

            fs.appendFile(config.appendFile, appendString, () => {});
        };
    }
}

function browsersync(cb) {
    sync.init({
        proxy: config.url,
        port: config.port,
        ui: false,
        online: true,
        logPrefix: config.name,
        open: false,
    });

    cb();
}

function styles() {
    const task = src(getInputPath('css', '**/*.scss'))
        .pipe(sass({
            outputStyle: 'compressed',
        }).on('error', sass.logError))
        .pipe(prefix({
            overrideBrowserslist: config.browsers,
            cascade: false,
        }))
        .pipe(dest(getOutputPath('css')))
        .pipe(minifycss());

    if (config.url !== null) {
        task.pipe(sync.stream({
            match: '**/*.css',
        }));
    }

    return task;
}

function images() {
    return src(getInputPath('img', '**/*.{png,jpg,gif}'))
        .pipe(imagemin())
        .pipe(dest(getOutputPath('img')));
}

function reload(cb) {
    sync.reload();
    cb();
}

function javascript() {
    return src(getInputPath('js', `**/*.${config.jsExt}`))
        .pipe(gulpWebpack(webpackOptions, webpack))
        .pipe(dest(getOutputPath('js')));
}

function cleanup(cb) {
    del([
        getInputPath('img'),
        getInputPath('fonts', '*.otf'),
        getInputPath('fonts', '*.ttf'),
    ], cb);
}

function convertToTtf() {
    return src(getInputPath('fonts', '*.otf'))
        .pipe(otfforge())
        .pipe(dest(getInputPath('fonts')));
}

function convertToWoff() {
    return src(getInputPath('fonts', '*.ttf'))
        .pipe(ttf2woff())
        .pipe(dest(getOutputPath('fonts')));
}

function convertToWoff2() {
    return src(getInputPath('fonts', '*.ttf'))
        .pipe(ttf2woff2())
        .pipe(dest(getOutputPath('fonts')));
}

function monitor(cb) {
    if (config.watch.length > 0) {
        watch(config.watch, reload);
    }

    if (config.css !== null) {
        watch(getInputPath('css', '**/*.scss'), styles);
    }

    if (config.img !== null) {
        watch(getInputPath('img', '**/*.{png,jpg,gif}'), { events: ['add'], delay: 500 }, images);
    }

    if (config.js !== null) {
        watch(getInputPath('js', `**/*.${config.jsExt}`), javascript);
    }

    if (config.fonts !== null) {
        watch(getInputPath('fonts', '*.otf'), { events: ['add'] }, convertToTtf);

        const watcher = watch(getInputPath('fonts', '*.ttf'), { events: ['add'] }, series(convertToWoff, convertToWoff2));

        if (config.append !== null) {
            watcher.on('add', config.append);
        }
    }

    cb();
}

module.exports.setup = setup;
module.exports.browsersync = browsersync;
module.exports.styles = styles;
module.exports.images = images;
module.exports.reload = reload;
module.exports.javascript = series(javascript, reload);
module.exports.cleanup = cleanup;
module.exports.convertToTtf = convertToTtf;
module.exports.convertToWoff = convertToWoff;
module.exports.convertToWoff2 = convertToWoff2;
module.exports.monitor = monitor;
