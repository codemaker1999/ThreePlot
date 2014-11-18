// standard line plot
var square = {
    "color": "#ee1155",
    "type": "lineplot",
    "data": [ [0,0,0], [1,0,0], [1,0,1], [0,0,1], [0,0,0] ]
};

// Parametric plot animation
var animHelix = {
    "color": "#55ee11",
    "type": "lineplot",
    "animated": true,
    "lineLength": 10000, // buffered geometry is fixed size
    "xyz": [0,1,0], // initial condition
    "step": function () {
        var t = this.t;
        var p = [Math.sin(t), Math.cos(t), t/10];
        this.t += this.dt;
        this.t = this.t % 100;
        return p;
    },
    "t": 0,
    "dt": 1/50
};

// 3d animation
var animWireSphere = {
    "type": "lineplot",
    "animated": true,
    "lineLength": 300, // buffered geometry is fixed size
    "xyz": [0,0,0], // initial condition
    "step": function () {
        var phi   = 2*Math.PI*Math.random(),
            theta = Math.PI*Math.random(),
            x     = Math.cos(phi)*Math.sin(theta),
            y     = Math.sin(phi)*Math.sin(theta),
            z     = Math.cos(theta);
        return [x,y,z];
    }
};

// setup
var plots = [square, animHelix, animWireSphere];
var n  = plots.length;
var nh = Math.ceil(Math.sqrt(n));
var nw = Math.ceil(Math.sqrt(n));

for (var i = 0; i < n; i++) {
    var p = plots[i];
    $("#plots").append('<div class="container"></div>');
    $(".container").css({
        "width":  (100/nw).toString()+"vw",
        "height": (100/nh).toString()+"vh",
    });
    ThreePlot.plot( [ p ], $(".container")[0] );
};
