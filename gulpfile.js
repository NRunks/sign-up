var gulp = require('gulp');
var concat = require('gulp-concat');
var ngAnnotate = require('gulp-ng-annotate');
var plumber = require('gulp-plumber');
var minifyJS = require('gulp-minify');
var uglify = require('gulp-uglify');
var bytediff = require('gulp-bytediff');
var rename = require('gulp-rename');
var gutil = require('gulp-util');

/**
 * Concatenates all of the JS files into one file, uglifies this file, renames it, then places it in the apps directory
 */
gulp.task('build', function () {
    return gulp.src(['./apps/app.js', './apps/services/*.js', './apps/controllers/*.js'])
        .pipe(concat('app-scripts.js'))
        .pipe(ngAnnotate({add: true}))
        .pipe(gulp.dest('./apps/'))
        .pipe(rename('app-scripts.min.js'))
        .pipe(uglify())
        .on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
        .pipe(gulp.dest('./apps/'));
});