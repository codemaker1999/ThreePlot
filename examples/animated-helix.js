var anim = {
    "color": "#55ee11",
    "type": "lineplot",
    "animated": true,
    "trajLength": 10000, // buffered geometry is fixed size
    "xyz": [0,1,0], // initial condition
    "step": function () {
        var t = this.t;
        var p = [Math.sin(t), Math.cos(t), t/30];
        this.t += this.dt;
        return p;
    },
    "t": 0,
    "dt": 1/50
};

ThreePlot.plot([ anim ], document.getElementById("container"));