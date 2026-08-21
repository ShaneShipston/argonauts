import path from 'node:path';
import { series, src, dest, watch } from 'gulp';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import prefix from 'gulp-autoprefixer';
import minifycss from 'gulp-clean-css';
import imagemin from 'gulp-imagemin';
import browserSync from 'browser-sync';
import { deleteAsync } from 'del';
import webpack from 'webpack';
import webpackStream from 'webpack-stream';

const sass = gulpSass(dartSass);
const sync = browserSync.create();

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

export function setup(options) {
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

export function browsersync(cb) {
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

export function styles() {
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

export function images() {
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

export function reload(cb) {
    sync.reload();
    cb();
}

export function javascript() {
    return src(getInputPath('js', `**/*.${config.jsExt}`), {
        cwd: config.cwd,
    })
        .pipe(webpackStream(webpackOptions, webpack))
        .pipe(dest(getOutputPath('js')));
}

export async function cleanup() {
    if (config.img === null) {
        return;
    }

    await deleteAsync([getInputPath('img')]);
}

export function monitor(cb) {
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
