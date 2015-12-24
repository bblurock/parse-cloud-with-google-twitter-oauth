'use strict';

var gulp = require('gulp');
var clean = require('gulp-clean');
var babel = require('gulp-babel');
var rename = require('gulp-rename');
var shell = require('gulp-shell');
var fs = require('fs');

var srcOption = { base: './' };

var libs = [ './libs/**/*.js' ];
var src  = [ './src/**/*.js' ];
var entry = 'index.js';

var cloud     = './cloud';
var cloudLibs = './cloud/libs';
var cloudSrc  = './cloud/src';

gulp.task('clean', function (cb) {
    return gulp.src(cloud + '/**/*', {read: false})
        .pipe(clean());

});

gulp.task('copyLibs', ['clean'], function (cb) {
    return gulp.src(libs)
        .pipe(gulp.dest(cloudLibs));
});


gulp.task('transpileSrc', ['clean'], function () {
    return gulp.src(src, srcOption)
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest(cloud));
});

gulp.task('transpileMain', ['clean'], function () {
    return gulp.src(entry, srcOption)
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(rename('main.js'))
        .pipe(gulp.dest(cloud));
});

gulp.task('deploy', shell.task([
    'cd ./cloud',
    'parse deploy'
]));

gulp.task('default', ['clean', 'transpileMain', 'transpileSrc', 'copyLibs']);


gulp.task('watch', function() {
    gulp.watch(entry, ['default']);
});