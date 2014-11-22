// Parsing
// syntax reference:
// http://mathjs.org/docs/expressions/syntax.html

var parseParametricStatic = {
    "type": "lineplot",
    "parse": ["t % 10","t^2 % 5","3*sin(t)"],
    "start": 0,
    "end": 100,
    "step": 1/50
}

var parseParametric = {
    "type": "lineplot",
    "animated": true,
    "parse": ["-t % 10","-t^2 % 5","3*sin(t)"],
    "lineLength": 1000,
    "start": 0,
    "step": 1/50
}

var parseSurface = {
    "type": "surfaceplot",
    // provide f(x,y), where z=f(x,y)
    "parse": "sin(x)+cos(y)",
    "rotation": [0,0,1],
    "minX": -10,
    "maxX": 10,
    "minY": -10,
    "maxY": 10,
    "step": 1/10
}
