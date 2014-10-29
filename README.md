3D Plotting and Animation Using WebGL
======================================

The main goals of this project are to provide

* a minimum-setup API for efficient 3D plotting using WebGL

* easily embeddable visualizations

A rich (TODO) set of examples provides starting points for common tasks

Usage
------

The only necessary step is to create a valid plottable object, and provide a DIV or something for the plot to live in. There are several types of plottable objects, including lines in 3D space, surface plots, and animated 3D lines. For example, say you wanted to create an interactive 3D line plot:

```js
var myLine = {
    "type": "lineplot",
    "data": [[0,0,0], [0,0,1], [0,1,0]]
}

ThreePlot.plot(myLine, targetHtmlElement)
```

ThreePlot will figure the rest out. There are many customizable options, check out `/examples/api-overview.js` if you want a quick reference to them.

Notes
------

* For efficiency reasons there is a finite size to the trajectories being animated. A finite size buffer is created to hold the geometry being plotted.

Examples
---------

* TODO See files in `/examples`
