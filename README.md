3D Plotting and Animation Using WebGL
======================================

The main goals of this project are to provide

* a minimum-setup API for efficient 3D plotting using WebGL

* easily embeddable visualizations

* A rich set of examples to provide a starting point for common tasks

Usage
------

There are only two steps to getting started.

1. load in the ThreeJS and ThreePlot libraries

2. create a valid plottable object, and provide a DIV or something for the plot to live in

There are several types of plottable objects, including lines in 3D space, animated 3D lines, and surface plots (coming soon). For example, to make an interactive plot containing a triangle and a square, you could write:

```js
var triangle = {
    "type": "lineplot",
    "data": [[0,0,0], [0,0,1], [0, 0.5, 0.5], [0,0,0]]
};

var square = {
    "type": "lineplot",
    "data": [[0,0,0], [1,0,0], [1,1,0], [0,1,0], [0,0,0]]
};

ThreePlot.plot([ triangle, square ], targetHtmlElement);
```

and to create an animated trajectory:

```js
var meshCube = {
    "type": "lineplot",
    "animated": true,
    "lineLength": 300, // see "Notes" below
    "xyz": [0,0,0], // initial point
    // The step function must return the next point each frame.
    // Here, it just returns a random point in the unit cube
    "step": function () {
        var x = Math.random(),
            y = Math.random(),
            z = Math.random();
        return [x,y,z];
    },
};

ThreePlot.plot([ meshCube ], targetHtmlElement);
```

ThreePlot will figure the rest out. There are many customizable options, check out `/examples/api-overview.js` if you want a quick reference to them. Tip: double-click on the plot to retarget the camera (this is useful for animations).

Examples
---------

* See files in `/examples`

Notes
------

* For efficiency reasons there is a finite length to the trajectories being animated (A finite size buffer is created to hold the points being plotted), so animations will eventually start to disappear sequentially from where they start (they will continue to grow at the same rate, of course).

* The `ThreePlot.plot` function returns a random string ID that is attached to the corresponding plot object `ThreePlot.activePlots[i].id`

* You can add your own arbitrary objects to a scene by creating the ThreeJS objects and adding them to the scene via `ThreePlot.activePlots[i].scene`. To animate your objects through the ThreePlot render loop, create an object that has an `update()` method (called every frame) to update your objects, and push it to `ThreePlot.activePlots[i].iplots`.

TODO
-----

* Labels and axes

* Surface plotting

* GUI with settings
