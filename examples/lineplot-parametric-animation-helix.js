var anim = {
    "type": "lineplot",
    "animated": true,
    "lineLength": 10000,
    "xyz": [0,1,0], // initial condition
    /*\
    |*| variables attached to this object can be referenced
    |*| in the step function by using the "this" keyword.
    |*| You can attach anything you want to this object, but
    |*| here we use a number to represent time, giving us
    |*| the ability to make a time-dependant animation.
    \*/
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