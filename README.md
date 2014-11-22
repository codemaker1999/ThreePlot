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

There are several types of plottable objects, including lines in 3D space, animated 3D lines, and surface plots. For example, to make an interactive plot containing a triangle and a square, you could write:

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

to create an animated spiral:

```js
var animSpiral = {
    "type"      : "lineplot",
    "animated"  : true,
    // provide parametric components:
    // [ x(t), y(t), z(t) ]
    "parse"     : [ "sin(t)", "cos(t)", "t/10" ],
    "start"     : 0,
    "step"      : 1/40,
    "lineLength": 10000
};

ThreePlot.plot([ animSpiral ], targetHtmlElement);
```

and to create a surface plot, say a sinusoidal blanket:

```js
var blanket = {
    "type"  : "surfaceplot",
    // provide f(x,y), where z=f(x,y)
    "parse" : "sin(x)+cos(y)",
    "minX"  : -10,
    "maxX"  : 10,
    "minY"  : -10,
    "maxY"  : 10,
    "step"  : 1/10
};

ThreePlot.plot([ blanket ], targetHtmlElement);
```

ThreePlot will figure the rest out. There are many customizable options, check out `/examples/api-overview.js` if you want a quick reference to them. Tip: double-click on the plot to retarget the camera (this is useful for animations).

**Try it out at http://codemaker1999.github.io/ThreePlot**

Examples
---------

* See `/test/test.js` and files in `/examples`

Notes
------

* Choice of variables are mostly up to you, for example `{"parse": "sin(x*y)", ...}` is equivelant to `{"parse": "sin(r*k)", ...}`. The exception to this is "t", which will always be treated as a "time" parameter when used in a surfaceplot.


* The `ThreePlot.plot` function returns a random string ID that is attached to the corresponding plot object `ThreePlot.activePlots[i].id`

* You can add your own arbitrary objects to a scene by creating the ThreeJS objects and adding them to the scene via `ThreePlot.activePlots[i].scene`. To animate your objects through the ThreePlot render loop, create an object that has an `update()` method (called every frame) to update your objects, and push it to `ThreePlot.activePlots[i].iplots`. You can also directly modify the ThreeJS objects in the scene via `ThreePlot.activePlots[i].iplots[j].threeObj`.

* If you are plotting surfaces and the page is freezeing, try reducing the min and max bounds, and increasing the step size. You can easily and accidentally end up trying to compute millions or billions of points without realizing it! This is infinitely worse for animated surfaces, so beware!

* For efficiency reasons there is a finite length to the trajectories being animated (A finite size buffer is created to hold the points being plotted), so animations will eventually start to disappear sequentially from where they start (they will continue to grow at the same rate, of course). This may be removed in the future to simplify the API.

* For charts and graphs, try this: http://threegraphs.com/

TODO
-----

* Labels and axes

* Surface plotting

* GUI with settings
