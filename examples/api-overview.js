var plots = [];

/*\
|*|    Static trajectory example
\*/

var staticPlot = {
    // optional keys
    "label": "Square",
    "color": "#ee1155",
    // required keys
    "type": "lineplot",
    // type-specific keys (not animated)
    "data": [ [0,0,0], [1,0,0], [1,0,1], [0,0,1], [0,0,0] ]
}
plots.push(staticPlot);

/*\
|*|    Animated trajectory example
\*/

var anim = {
    // optional keys
    "label": "Animated Trajectory",
    "color": "#55ee11",
    // required keys
    "type": "lineplot",
    // type-specific keys
    "animated": true,
    "lineLength": 10000, // buffered geometry is fixed size
    "xyz": [0,1,0], // initial condition
    "step": function () {
        var t = this.t;
        var p = [Math.sin(t), Math.cos(t), t];
        this.t += this.dt;
        return p;
    },
    // helper keys
    "t": 0,
    "dt": 1/100
}
plots.push(anim);

/*\
|*|    Surface plot example
\*/

var pyramid = {
    "type": "surfaceplot",
    // min and max values for independent variables
    "min_i": -1,
    "max_i": 1,
    "min_j": -1,
    "max_j": 1,
    // define dependent variable axis
    "up": [0,0,1],
    "data": [[0,0,0],
             [0,3,0],
             [0,0,0]]
};

plots.push(pyramid);

/*\
|*|    Global Settings
\*/

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

/*\
|*|    Run
\*/

ThreePlot.plot([ plots[0] ], document.getElementById("plotTarget_1"));
ThreePlot.plot([ plots[1] ], document.getElementById("plotTarget_2"), settings);
