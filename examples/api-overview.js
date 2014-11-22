/*

This overview contains valid, runnable code.
It contains examples of most available
features and options.

For reference to what expressiong can be parsed,
see the following:
http://mathjs.org/docs/expressions/syntax.html

*/

var plots = [];

/******************************************************
 *  Static Trajectories
 */

// manual data entry
var staticTraj = {
    // optional keys
    "label": "Square",
    "color": "#ee1155",
    // required keys
    "type": "lineplot",
    // type-specific keys (not animated)
    "data": [ [0,0,0], [1,0,0], [1,0,1], [0,0,1], [0,0,0] ]
};
plots.push(staticTraj);

// parsed parametric funcitons
var parsedParametricStatic = {
    "type": "lineplot",
    "parse": ["t % 10","t^2 % 5","3*sin(t)"],
    "start": 0,
    "end": 100,
    "step": 1/50
};
plots.push(parsedParametricStatic);

/******************************************************
 *  Animated Trajectories
 */

// manual data construction
var animTraj = {
    // optional keys
    "label": "Animated Trajectory",
    "color": "#55ee11",
    // required keys
    "type": "lineplot",
    // type-specific keys
    "animated": true,
    "lineLength": 10000, // buffered geometry is fixed size
    "xyz": [0,1,0], // initial condition
    "next": function () {
        var t = this.t;
        var p = [Math.sin(t), Math.cos(t), t];
        this.t += this.dt;
        return p;
    },
    // helper keys
    "t": 0,
    "dt": 1/100
};
plots.push(animTraj);

// parsed parametric functions 
var parsedParametricAnim = {
    "type": "lineplot",
    "animated": true,
    "parse": ["-t % 10","-t^2 % 5","3*sin(t)"],
    "lineLength": 1000,
    "start": 0,
    "step": 1/50
};
plots.push(parsedParametricAnim);

/******************************************************
 *  Static Surface Plots
 */

// surfaceplots must be in the form z=f(x,y) .
// specify a "rotation" vector to rotate the resulting
// surface to the specified direction.

var pyramid = {
    "type": "surfaceplot",
    // min and max values for X and Y, which provide
    // a range of values to sample X and Y from
    "minX": -1,
    "maxX": 1,
    "minY": -1,
    "maxY": 1,
    "data": [[0,0,0],  // z values go here (x and y values
             [0,3,0],  // are implicit, obtained with
             [0,0,0]], // minX, maxX, minY, and maxY).
    // optional rotation vector
    "rotation": [1,0,1]
};
plots.push(pyramid);

var parsedSurface = {
    "type": "surfaceplot",
    // provide f(x,y), where z=f(x,y)
    "parse": "sin(x)+cos(y)",
    "minX": -10,
    "maxX": 10,
    "minY": -10,
    "maxY": 10,
    "step": 1/10,
    // optional rotation vector
    "rotation": [0,2,1]
};
plots.push(parsedSurface);

/******************************************************
 *  Static Surface Plots
 */

 function sineBlanket(minx,miny,maxx,maxy,step,t) {
    var sb = [];
    for (var i = minx; i < maxx; i+=step) {
        var row = [];
        for (var j = miny; j < maxy; j+=step) {
            row.push( (Math.sin(i) + Math.cos(j))*Math.sin(t) );
        };
        sb.push( row );
    };
    return sb
}

var animSurf = {
    "type": "surfaceplot",
    "animated": true,
    "minX": -5,
    "maxX": 5,
    "minY": -5,
    "maxY": 5,
    "rotation": [0,1,1],
    "mesh": sineBlanket(-5,-5,5,5,1/5,0), // initial condition
    "next": function () {
        var t = this.t;
        var mesh = sineBlanket(-5,-5,5,5,1/5,t);
        this.t += this.dt;
        return mesh;
    },
    // helper keys
    "t": 0,
    "dt": 1/20
};
plots.push(animSurf);

// parsing
var parsedAnimSurf = {
    "type": "surfaceplot",
    "animated": true,
    // enforce that time is always "t"
    "parse": "sin(t)*(sin(x)+sin(y))",
    "minX" : -6,
    "maxX" : 6,
    "minY" : -6,
    "maxY" : 6,
    "step" : 1/4,
    "start": 0,
    "dt"   : 1/20
};
plots.push(animSurf);

/******************************************************
 *  Global Settings
 */

// ThreePlot chooses sensible defaults for all settings
// These are all available options
var settings = {};
settings.showGrid: true;
settings.showAxes: true;
settings.ctrlType = "orbit" || "fly";
settings.autoRotate: true; // for orbit controls
settings.near = 0.01; // render clipping distances
settings.far = 500;  // render clipping distances
settings.cameraAngle = 45; // field of view
settings.cameraPos = [10,10,10];
settings.orbitTarget = [0,0,0];

/******************************************************
 *  Run
 */

ThreePlot.plot([ plots[0], plots[2] ], document.getElementById("plotTarget_1"));
ThreePlot.plot([ plots[1] ], document.getElementById("plotTarget_2"), settings);
