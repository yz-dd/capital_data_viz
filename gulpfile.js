//import 3 packages
var gulp        = require('gulp');
var browserSync = require('browser-sync').create();
var sass        = require('gulp-sass');

//compile sass into css & auto-inject into browsers
// Compile sass into CSS & auto-inject into browsers
gulp.task('sass', function() {
    return gulp.src(['node_modules/bootstrap/scss/bootstrap.scss', 'app/scss/*.scss'])
        .pipe(sass())//use pipe method sass() to compile
        .pipe(gulp.dest("app/css"))
        .pipe(browserSync.stream());
});

/*
taking the following js files from the node modules folder 
and move them into the /src/js folder
*/
gulp.task('js', function() {
    return gulp.src(['node_modules/bootstrap/dist/js/bootstrap.min.js', 'node_modules/jquery/dist/jquery.min.js', 'node_modules/popper.js/dist/umd/popper.min.js'])
        .pipe(gulp.dest("app/js"))
        .pipe(browserSync.stream());
});

// Static Server + watching scss/html files
gulp.task('serve', gulp.series('sass', function() {
    
    browserSync.init({
        server: "./app", 
        index: "capital_viz.html"
 
    });

    gulp.watch(['node_modules/bootstrap/scss/bootstrap.scss', 'app/scss/*.scss'], gulp.series('sass'));
    gulp.watch("app/*.html").on('change', browserSync.reload);
}));

/*
gulp.task('default', ...);
means that we can type in cmd line and run whaterver we specify
*/
gulp.task('default', gulp.parallel('js','serve'));