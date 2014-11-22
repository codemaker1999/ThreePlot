// animated surfaces
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
    "minX": -1,
    "maxX": 1,
    "minY": -1,
    "maxY": 1,
    "mesh": sineBlanket(-1,-1,1,1,1/10,0), // initial condition
    "next": function () {
        var t = this.t;
        var mesh = sineBlanket(-1,-1,1,1,1/10,t);
        this.t += this.dt;
        return mesh;
    },
    // helper keys
    "t": 0,
    "dt": 1/10
};

// parsing
var animSurf = {
    "type": "surfaceplot",
    "animated": true,
    // enforce that time is always "t"
    "parse": "sin(t)*(sin(x)+sin(y))",
    "minX" : -1,
    "maxX" : 1,
    "minY" : -1,
    "maxY" : 1,
    "step" : 1/5,
    "start": 0,
    "dt"   : 1/20
};