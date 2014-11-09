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

There are several types of plottable objects, including lines in 3D space, animated 3D lines, and surface plots (coming soon). For example, say you wanted to create an interactive 3D line plot:

```js
var myLine = {
    "type": "lineplot",
    "data": [[0,0,0], [0,0,1], [0,1,0]]
}

ThreePlot.plot(myLine, targetHtmlElement)
```

ThreePlot will figure the rest out. There are many customizable options, check out `/examples/api-overview.js` if you want a quick reference to them.

Examples
---------

* See files in `/examples`

Notes
------

* For efficiency reasons there is a finite size to the trajectories being animated. A finite size buffer is created to hold the geometry being plotted.
