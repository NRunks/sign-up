var gulp = require('gulp');
var concat = require('gulp-concat');
var ngAnnotate = require('gulp-ng-annotate');
var plumber = require('gulp-plumber');
var minifyJS = require('gulp-minify');
var uglify = require('gulp-uglify');
var bytediff = require('gulp-bytediff');
var rename = require('gulp-rename');
var gutil = require('gulp-util');

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

gulp.task('minify', function () {
    return gulp.src(['./apps/app-scripts.js'])
        .pipe(rename('app-scripts.min.js'))
        .pipe(uglify())
        .on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
        .pipe(gulp.dest('./apps/'));
});

/*gulp.task('build', function() {
    return gulp.src(['./apps/app.js', './apps/services/*.js', './apps/controllers/*.js'])
        .pipe(plumber())
        .pipe(minifyJS())
			.pipe(concat('app-script.js', {newLine: ';'}))
			//.pipe(ngAnnotate({add: true}))
	    .pipe(plumber.stop())
        .pipe(gulp.dest('./apps/'));
});*/

gulp.task('prod', ['build'], function () {
    return gulp.src('apps/app-script.js')
        .pipe(plumber())
        .pipe(bytediff.start())
        .pipe(uglify({ mangle: true }))
        .pipe(bytediff.stop())
        .pipe(rename('app-script.min.js'))
        .pipe(plumber.stop())
        .pipe(gulp.dest('./apps/'));
});