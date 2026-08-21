const { series, src, dest, watch } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const prefix = require('gulp-autoprefixer');
const minifycss = require('gulp-clean-css');
const imagemin = require('gulp-imagemin');
const sync = require('browser-sync').create();
const del = require('delete');
const path = require('path');
const webpack = require('webpack');
const gulpWebpack = require('webpack-stream');

let config = {
    cwd: process.cwd(),
    src: 'src',
    dest: '.',
    browsers: ['> 0.5%', 'last 2 versions', 'not dead', 'not ie <= 11'],

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

    // CSS
    css: 'css',
    sass: {},

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

    return path.join(config.cwd, ...segments);
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

    return path.join(config.cwd, ...segments);
}

function setup(options) {
    config = Object.assign(config, options);

    const entries = {};

    if (config.js !== null) {
        config.entries.forEach((entry) => {
            entries[entry] = `${getInputPath('js', entry)}.js`;
        });
    }

    if (config.js !== null && config.entries.length > 0) {
        webpackOptions = Object.assign({}, {
            mode: 'production',
            entry: entries,
            output: {
                path: getOutputPath('js'),
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
    const sassOptions = Object.assign({
        style: 'compressed',
    }, config.sass);

    const stream = src(getInputPath('css', '**/*.scss'))
        .pipe(sass(sassOptions).on('error', sass.logError))
        .pipe(prefix({
            overrideBrowserslist: config.browsers,
            cascade: false,
        }))
        .pipe(minifycss());

    if (config.url === null) {
        return stream.pipe(dest(getOutputPath('css')));
    }

    return stream
        .pipe(dest(getOutputPath('css'), {
            passthrough: true,
        }))
        .pipe(sync.stream({
            match: '**/*.css',
        }));
}

function images() {
    // Gulp 5 defaults to UTF-8; images must be treated as binary
    return src(getInputPath('img', '**/*.{png,jpg,gif,svg,webp}'), {
        cwd: config.cwd,
        encoding: false,
    })
        .pipe(imagemin())
        .pipe(dest(getOutputPath('img'), {
            encoding: false,
        }));
}

function reload(cb) {
    sync.reload();
    cb();
}

function javascript() {
    return src(getInputPath('js', `**/*.${config.jsExt}`), {
        cwd: config.cwd,
    })
        .pipe(gulpWebpack(webpackOptions, webpack))
        .pipe(dest(getOutputPath('js')));
}

function cleanup(cb) {
    if (config.img === null) {
        cb();
        return;
    }

    del([getInputPath('img')], cb);
}

function monitor(cb) {
    if (config.watch.length > 0) {
        watch(config.watch, {
            cwd: config.cwd,
        }, reload);
    }

    if (config.css !== null) {
        watch(getInputPath('css', '**/*.scss'), {
            cwd: config.cwd,
        }, styles);
    }

    if (config.img !== null) {
        watch(getInputPath('img', '**/*.{png,jpg,gif,svg,webp}'), {
            events: ['add'],
            delay: 500,
            cwd: config.cwd,
        }, images);
    }

    if (config.js !== null) {
        watch(getInputPath('js', `**/*.${config.jsExt}`), {
            cwd: config.cwd,
        }, config.url !== null ? series(javascript, reload) : javascript);
    }

    cb();
}

module.exports.setup = setup;
module.exports.browsersync = browsersync;
module.exports.styles = styles;
module.exports.images = images;
module.exports.reload = reload;
module.exports.javascript = javascript;
module.exports.cleanup = cleanup;
module.exports.monitor = monitor;
