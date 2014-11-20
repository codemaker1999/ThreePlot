function addElem (name, n) {
    var par = document.getElementById("plotlist");
    var d = document.createElement("div");
    d.className = "listElem";
    d.onclick = (function(n) {
        return function (e) {
            run(n);
        };
    })(n);
    d.innerHTML = name;
    par.appendChild(d);
}

function run (n) {
    ThreePlot.activePlots = [];
    document.getElementById('plot').innerHTML = '';
    ThreePlot.plot([ plots[n] ], document.getElementById("plot"));
}

function sineBlanket(minx,miny,maxx,maxy,step) {
    var sb = [];
    for (var i = minx; i < maxx; i+=step) {
        var row = [];
        for (var j = miny; j < maxy; j+=step) {
            row.push( Math.sin(i) + Math.cos(j) );
        };
        sb.push( row );
    };
    return sb
}

var plots = [
    // ----------------------------------------------------------
    {
        "label": "square",
        "color": "#ee1155",
        "type": "lineplot",
        "data": [ [0,0,0], [1,0,0], [1,0,1], [0,0,1], [0,0,0] ]
    },
    // ----------------------------------------------------------
    {
        "label": "parametric spiral",
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
    },
    // ----------------------------------------------------------
    {
        "label": "random 3D line sphere",
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
    },
    // ----------------------------------------------------------
    {
        "label": "sine blanket",
        "type": "surfaceplot",
        // min and max values for independent variables
        "min_i": -10,
        "max_i": 10,
        "min_j": -10,
        "max_j": 10,
        // define dependent variable axis
        "up": [0,1,1],
        "data": sineBlanket(-10,-10,10,10,0.5)
    }
    // ----------------------------------------------------------
];

for (var i = 0; i < plots.length; i++) {
    var p = plots[i];
    addElem(p.label, i);
};