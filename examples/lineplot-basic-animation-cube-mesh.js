var meshCube = {
    "type": "lineplot",
    "animated": true,
    "lineLength": 300,
    "xyz": [0,0,0], // initial point
    // our step function just returns a random point in the unit cube
    "step": function () {
        var x = Math.random(),
            y = Math.random(),
            z = Math.random();
        return [x,y,z];
    },
};

ThreePlot.plot([ meshCube ], document.getElementById("container"));
