var plots = [];

/*\
|*|    Static trajectory example
\*/

var staticPlot = {
    // optional keys
    "label": "Square",
    // required keys
    "type": "lineplot",
    "data": [ [0,0,0], [1,0,0], [1,0,1], [0,0,1], [0,0,0] ]
}
plots.push(staticPlot);

/*\
|*|    Animated trajectory example
\*/

var anim = {
    // optional keys
    "label": "Animated Trajectory",
    "animated": true,
    // required keys
    "type": "lineplot",
    "trajLength": 10000, // buffered geometry is fixed size
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

// use 2D array to hold data for unambiguous polygon generation
var surfPoints = [];
for (var i = 10; i < 80; i+=70/200) {
    var row = [];
    for (var j = 10; j < 80; j+=70/200) {
        // make some sinusoidal blanket thing
        row.push([i,j,Math.sin(i)+Math.sin(j)]);
    };
    surfPoints.push(row);
};
var surf = {
    // optional keys
    "label": "Surface Plot",
    // required keys
    "type": "surfaceplot",
    "data": surfPoints
};
plots.push(surf);

/*\
|*|    Global Settings
\*/

// ThreePlot chooses sensible defaults for all settings
// These are all available options
var settings = {};
settings.showGrid: true;
settings.showAxes: true;
settings.autoRotate: true;
settings.autoCamera: true;
settings.ctrlType = "orbit" || "fly";
settings.near = 0.1; // render clipping distances
settings.far = 500;  // render clipping distances
settings.cameraAngle = 45;
settings.cameraPos = [10,10,10];
settings.orbitTarget = [0,0,0];

/*\
|*|    Run
\*/

ThreePlot.plot([ plots[0], plots[1] ], document.getElementById("plotTarget_1"), settings);
ThreePlot.plot([ plots[2] ], document.getElementById("plotTarget_2"), settings);
