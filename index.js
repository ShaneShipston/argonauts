const { series, src, dest, watch } = require('gulp');
const sass = require('gulp-sass');
const prefix = require('gulp-autoprefixer');
const minifycss = require('gulp-clean-css');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const imagemin = require('gulp-imagemin');
const otfforge = require('otfforge');
const sync = require('browser-sync').create();
const fs = require('fs');
const del = require('delete');
const path = require('path');
const webpack = require('webpack');
const gulpWebpack = require('webpack-stream');

let config = {
    name: 'Argonauts',
    url: null,
    port: 3000,
    src: {
        img: 'src/img/**/*.{png,jpg,gif}',
        js: 'src/js/**/*.js',
        css: 'src/scss/**/*.scss',
        fonts: 'src/fonts/',
    },
    dest: {
        img: 'img',
        js: 'js',
        css: 'css',
        fonts: 'fonts',
    },
    watch: null,
    browsers: ['> 1%', 'ie >= 11'],
};

function setup(options) {
    config = Object.assign(config, options);
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

function styles(cb) {
    src(config.src.css)
        .pipe(sass({
            outputStyle: 'compressed',
        }).on('error', sass.logError))
        .pipe(prefix({
            browsers: config.browsers,
            cascade: false,
        }))
        .pipe(dest(config.dest.css))
        .pipe(minifycss())
        .pipe(sync.stream({
            match: '**/*.css',
        }));

    cb();
}

function images(cb) {
    src(config.src.img)
        .pipe(imagemin())
        .pipe(dest(config.dest.img));

    cb();
}

function reload(cb) {
    sync.reload();
    cb();
}

function javascript(cb) {
    src(config.src.js)
        .pipe(gulpWebpack({
            mode: 'production',
            entry: './src/js/main.js',
            output: {
                path: path.resolve(__dirname, 'js'),
                filename: 'main.js',
            },
            module: {
                rules: [{
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
                        }
                    },
                }],
            },
        }, webpack))
        .pipe(dest(config.dest.js));

    reload(cb);
}

function cleanup(cb) {
    del([
        config.src.img,
        `${config.src.fonts}*.otf`,
        `${config.src.fonts}*.ttf`,
    ], cb);
}

function convertToTtf(cb) {
    src(`${config.src.fonts}*.otf`)
        .pipe(otfforge())
        .pipe(dest(config.src.fonts));

    cb();
}

function convertToWoff(cb) {
    src(`${config.src.fonts}*.ttf`)
        .pipe(ttf2woff())
        .pipe(dest(config.dest.fonts));

    cb();
}

function convertToWoff2(cb) {
    src(`${config.src.fonts}*.ttf`)
        .pipe(ttf2woff2())
        .pipe(dest(config.dest.fonts));

    cb();
}

function monitor(cb) {
    if (config.watch !== null) {
        watch(config.watch, reload);
    }

    watch(config.src.css, styles);
    watch(config.src.img, { events: ['add'], delay: 500 }, series(images, cleanup));
    watch(config.src.js, javascript);
    watch(`${config.src.fonts}*.otf`, { events: ['add'] }, convertToTtf);

    const fontWatcher = watch(`${config.src.fonts}*.ttf`, { events: ['add'] }, series(convertToWoff, convertToWoff2, cleanup));

    fontWatcher.on('add', (filename) => {
        const basename = path.basename(filename, '.ttf');
        fs.appendFile('src/scss/base/_font_families.scss', `@include fontface("${basename}", "${basename}");\n`, () => {});
    });

    cb();
}

module.exports.setup = setup;
module.exports.browsersync = browsersync;
module.exports.styles = styles;
module.exports.images = images;
module.exports.reload = reload;
module.exports.javascript = javascript;
module.exports.cleanup = cleanup;
module.exports.convertToTtf = convertToTtf;
module.exports.convertToWoff = convertToWoff;
module.exports.convertToWoff2 = convertToWoff2;
module.exports.monitor = monitor;
