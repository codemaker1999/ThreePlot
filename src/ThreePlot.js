ThreePlot = {

    "activePlots": [],

    "updateMetrics": function (plotCtx) {
        var res = {
            "maxX": 0, "maxY": 0, "maxZ": 0,
            "minX": 0, "minY": 0, "minZ": 0,
        };

        // set Max and Min helper
        function setMaxMin (data) {
            for (var j = 0; j < data.length; j++) {
                var px = data[j][0] || data[j].x,
                    py = data[j][1] || data[j].y,
                    pz = data[j][2] || data[j].z;
                // set max
                res.maxX = px > res.maxX ? px : res.maxX;
                res.maxY = py > res.maxY ? py : res.maxY;
                res.maxZ = pz > res.maxZ ? pz : res.maxZ;
                // set min
                res.minX = px < res.minX ? px : res.minX;
                res.minY = py < res.minY ? py : res.minY;
                res.minZ = pz < res.minZ ? pz : res.minZ;
            };
        }

        // iterate        
        for (var i = 0; i < plotCtx.iplots.length; i++) {
            var ip = plotCtx.iplots[i];
            setMaxMin( ip.threeObj.geometry.vertices );
        };

        // compute extra metrics
        res.midX    = (res.maxX + res.minX)/2;
        res.midY    = (res.maxY + res.minY)/2;
        res.midZ    = (res.maxZ + res.minZ)/2;
        res.distX   = (res.maxX - res.minX)/2;
        res.distY   = (res.maxY - res.minY)/2;
        res.distZ   = (res.maxZ - res.minZ)/2;
        res.maxDist = Math.sqrt(
            Math.pow(res.distX, 2) +
            Math.pow(res.distY, 2) +
            Math.pow(res.distZ, 2)
        );
        res.center  = new THREE.Vector3(res.midX, res.midY, res.midZ);

        plotCtx.metrics = res;
        return res;
    },

    "retargetCamera": function (plotCtx) {
        var M = plotCtx.metrics,
            relativeCameraPosn = new THREE.Vector3(
                M.distX,
                M.distY,
                M.distZ
            ).multiplyScalar(3),
            cameraPosn = relativeCameraPosn.add(M.center);
        // Camera
        plotCtx.camera.position.x = cameraPosn.x;
        plotCtx.camera.position.y = cameraPosn.y;
        plotCtx.camera.position.z = cameraPosn.z;
        plotCtx.camera.lookAt(M.center);
        plotCtx.controls.target.copy(M.center); // for orbit
    },

    "triangulate": function (minX,minY,maxX,maxY,data) {
        var geometry = new THREE.Geometry();
        // add vertices
        var wid = data[0].length;
        var hgt = data.length;
        var dy = (maxY - minY)/hgt;
        var dx = (maxX - minX)/wid;
        for (var j = 0; j < hgt; j++) {
            for (var i = 0; i < wid; i++) {
                var v = new THREE.Vector3(
                    minX + i*dx,
                    minY + j*dy,
                    data[j][i]
                );
                geometry.vertices.push(v);
            }
        };
        // create triangles
        var triangles = [];
        for (var j = 0; j < hgt - 1; j++) {
            for (var i = 0; i < wid - 1; i++) {
                // up-left, up-right, etc. points
                var ul = data[j][i],
                    ur = data[j][i+1],
                    dl = data[j+1][i],
                    dr = data[j+1][i+1],
                    ind_ul =     j*wid + i,
                    ind_ur =     j*wid + (i+1),
                    ind_dl = (j+1)*wid + i,
                    ind_dr = (j+1)*wid + (i+1);
                // create 2 faces from 4 points
                geometry.faces.push(new THREE.Face3(
                    ind_ul, ind_ur, ind_dl
                ));
                geometry.faces.push(new THREE.Face3(
                    ind_ur, ind_dr, ind_dl
                ));
            };
        };

        return geometry;
    },

    "uniqueSymbolNames": function (tree) {
        // return the unique symbolNodes of tree
        // filter the SymbolNodes out
        var arr = tree.filter(function (node) {
            return node.type == 'SymbolNode';
        });
        // get unique list of names
        var dummy = {}, names = [];
        for(var i = 0, l = arr.length; i < l; ++i){
            if(!dummy.hasOwnProperty(arr[i].name)) {
                names.push(arr[i].name);
                dummy[arr[i].name] = 1;
            }
        }
        return names;
    },

    "parseIPlot": function (plot, scene) {
        // parse plottable object into an iterator that updates ThreeJS geometries

        var iplot = {"plot": plot};
        
        switch (plot.type) {
            // -------------------------------------------------------------------------
            // -------------------------------------------------------------------------
            case "lineplot":

            // TODO There is a chance for property collisions here
            if (plot.parse) {
                // convert into the other form and continue
                var fns = [];
                for (var i = 0; i < plot.parse.length; i++) {
                    var tree     = math.parse(plot.parse[i]),
                        symNames = ThreePlot.uniqueSymbolNames( tree ),
                        compiled = tree.compile(math);
                    if (symNames.length === 0) {
                        fns.push((
                            function (cpd) {
                                return function (t) {
                                    return cpd.eval();
                                }
                            }
                        )(compiled));
                    } else if (symNames.length === 1) {
                        var varname = symNames[0];
                        fns.push(
                            (function (cpd, vname) {
                                return function (t) {
                                    var s = {};
                                    s[vname] = t;
                                    return cpd.eval(s);
                                }
                            })(compiled, varname)
                        );
                    } else {
                        throw "Invalid Lineplot 'parse' Parameter: use 0 or 1 symbols";
                    }
                };
                // now we have a fns array
                // handle animation
                if (plot.animated) {
                    // create 'next' function
                    plot.t = plot.start;
                    plot.dt = plot.step;
                    plot.next = (function (fns) {
                        return function () {
                            var t   = this.t,
                                xyz = [fns[0](t), fns[1](t), fns[2](t)];
                            this.t += this.dt;
                            return xyz;
                        };
                    })(fns);
                    // set initial condition
                    plot.xyz = plot.next();
                } else {
                    // sample from the fns
                    var start = plot.start,
                        end   = plot.end,
                        dt    = plot.step,
                        data  = [];
                    for (var t = start; t < end; t+=dt) {
                        data.push([fns[0](t), fns[1](t), fns[2](t)]);
                    };
                    plot.data = data;
                };
            } // end parsing

            var material = new THREE.LineBasicMaterial({
                color: plot.color,
                linewidth: 2
            });
            var geometry = {};
            var traj = {};
            
            if (plot.animated) {

                geometry = new THREE.Geometry();
                geometry.dynamic = true;
                var xyz = new THREE.Vector3( plot.xyz[0], plot.xyz[1], plot.xyz[2] );
                for (var j=0; j<plot.lineLength; j++) {
                   geometry.vertices.push(xyz);
                }
                traj = new THREE.Line(geometry, material);
                // prevent culling (could be inefficient for lots of lines)
                traj.frustumCulled = false;

                // iplot
                iplot.threeObj = traj;
                iplot.update = function () {
                    var xyz = this.plot.next();
                    var new_xyz = new THREE.Vector3(xyz[0], xyz[1], xyz[2]);
                    this.plot.xyz = new_xyz;
                    // update trajectory
                    this.threeObj.geometry.vertices.shift();
                    this.threeObj.geometry.vertices.push(new_xyz);
                    this.threeObj.geometry.verticesNeedUpdate = true;
                };

            } else {

                geometry = new THREE.Geometry();
                for (var j=0; j<plot.data.length; j++) {
                    var xyz = new THREE.Vector3( plot.data[j][0], plot.data[j][1], plot.data[j][2]);
                    geometry.vertices.push(xyz);
                }
                traj = new THREE.Line(geometry, material);
                iplot.threeObj = traj;
                // don't change geometry
                iplot.update = function () {};

            };

            scene.add(traj);

            break;
            
            // -------------------------------------------------------------------------
            // -------------------------------------------------------------------------
            case "surfaceplot":

            if (plot.parse) {
                // convert into the other form and continue
                var fn;
                var tree     = math.parse(plot.parse),
                    symNames = ThreePlot.uniqueSymbolNames( tree ),
                    compiled = tree.compile(math),
                    reqNumVars = 3;
                // special case for animations
                if (symNames.indexOf("t") != -1) reqNumVars++;

                if (symNames.length < reqNumVars) {
                    fn = (function (cpd, vnames) {
                            return function (vars, t) {
                                var s = {}, j = 0;
                                for (var i = 0; i < vnames.length; i++) {
                                    // NOTE: input symbols are used in order they
                                    // appear in the input funciton string (except t)
                                    if (typeof t != "undefined" && vnames[i] === "t") {
                                        s["t"] = t;
                                        j++;
                                    } else {
                                        s[vnames[i]] = vars[i-j];
                                    };
                                };
                                return cpd.eval(s);
                            }
                        })(compiled, symNames);
                } else {
                    throw "Invalid Surfaceplot 'parse' Parameter: use 0, 1, or 2 symbols, " +
                        "plus 't' if you are animating a surface.";
                }
                // now we have a fns array
                // handle animation
                if (plot.animated) {
                    // create 'next' function
                    plot.t  = plot.start;
                    plot.dt = plot.step;
                    plot.next = (function (fn) {
                        return function () {
                            // sample from the fn
                            var minX = this.minX,
                                maxX = this.maxX,
                                minY = this.minY,
                                maxY = this.maxY,
                                t    = this.t,
                                dt   = this.dt,
                                mesh = [];
                            // construct initial condition
                            for (var i = minX; i < maxX; i+=dt) {
                                var row = [];
                                for (var j = minY; j < maxY; j+=dt) {
                                    row.push( fn([i,j], t) );
                                };
                                mesh.push( row );
                            };
                            this.t += dt;
                            return mesh;
                        };
                    })(fn);
                    // set initial condition
                    plot.mesh = plot.next();
                } else {
                    // sample from the fn
                    var minX = plot.minX,
                        maxX = plot.maxX,
                        minY = plot.minY,
                        maxY = plot.maxY,
                        step = plot.step,
                        data = [];
                    for (var i = minX; i < maxX; i+=step) {
                        var row = [];
                        for (var j = minY; j < maxY; j+=step) {
                            row.push( fn([i,j]) );
                        };
                        data.push( row );
                    };
                    plot.data = data;
                };
            } // end parsing

            // forward declare
            var material = new THREE.MeshLambertMaterial({
                color: plot.color,
                shading: THREE.SmoothShading,
                side: THREE.DoubleSide,
                wireframe: plot.wireframe || false
            });
            var geometry = {};
            var mesh = {};

            if (plot.animated) {
                geometry = ThreePlot.triangulate(
                    plot.minX, plot.minY, plot.maxX, plot.maxY, plot.mesh
                );
                geometry.computeFaceNormals();
                geometry.computeVertexNormals();
                mesh = new THREE.Mesh( geometry, material );
                iplot.threeObj = mesh;
                iplot.update = function () {
                    var plt = this.plot;
                    plt.mesh = plt.next();
                    // replace entire geometry object
                    // TODO is there a better implementation?
                    var geo = ThreePlot.triangulate(
                        plt.minX, plt.minY, plt.maxX, plt.maxY, plt.mesh
                    );
                    geo.computeFaceNormals();
                    geo.computeVertexNormals();
                    geo.verticesNeedUpdate = true; // flag for update
                    // threeJS holds references to geometries in object3Ds,
                    // so we must call .dispose() to avoid memory leaks
                    this.threeObj.geometry.dispose();
                    this.threeObj.geometry = geo;
                };
            } else {
                geometry = ThreePlot.triangulate(
                    plot.minX, plot.minY, plot.maxX, plot.maxY, plot.data
                );
                geometry.computeFaceNormals();
                geometry.computeVertexNormals();
                mesh = new THREE.Mesh( geometry, material );
                iplot.threeObj = mesh;
                // don't change geometry
                iplot.update = function () {};

            };

            // rotate to specified normal
            if (plot.rotation) {
                var up = new THREE.Vector3(0,0,1);
                var rotn = new THREE.Vector3(
                    plot.rotation[0],
                    plot.rotation[1],
                    plot.rotation[2]
                );
                rotn.normalize();
                var q = new THREE.Quaternion().setFromUnitVectors(up, rotn)
                mesh.setRotationFromQuaternion(q);
            };

            // add to scene and quit
            scene.add(mesh);

            break;

            // -------------------------------------------------------
            // FUTURE: "ode3", "pde3", "graph", "wolframalpha", ...
        }

        return iplot;

    },

    "animate": function () {
        "Plot plotCtx objects";

        var ap = ThreePlot.activePlots;

        for (var i = 0; i < ap.length; i++) {
            var plotCtx = ap[i];

            // increment iterator plot objects
            for (var j = 0; j < plotCtx.iplots.length; j++) {
                plotCtx.iplots[j].update();
            };

            // update controls and lights
            plotCtx.controls.update( 1 );
            plotCtx.light.position.copy( plotCtx.camera.position );
            plotCtx.light.lookAt( plotCtx.metrics.center );

            // render
            plotCtx.renderer.render( plotCtx.scene, plotCtx.camera );
        };

        // loop
        requestAnimationFrame( ThreePlot.animate );
    },

    "plot": function(plots, plotTarget) {
        "Set up all the ThreeJS machinery";

        /*\
        |*| Unpack settings
        \*/

        var userSettings = arguments[2] || {};
        var settings     = {};
        var ZERO         = new THREE.Vector3(0,0,0);
        var fixCamFlag   = userSettings.cameraPosn;
        settings.showGrid    = userSettings.showGrid    || true; // TODO
        settings.showAxes    = userSettings.showAxes    || true; // TODO
        settings.autoRotate  = userSettings.autoRotate  || false;
        settings.ctrlType    = userSettings.ctrlType    || "orbit";
        settings.near        = userSettings.near        || 0.005;
        settings.far         = userSettings.far         || 500;
        settings.cameraAngle = userSettings.cameraAngle || 45;
        settings.cameraPosn  = userSettings.cameraPosn  || [0,0,0];
        settings.cameraPosn = new THREE.Vector3(
            settings.cameraPosn[0],
            settings.cameraPosn[1],
            settings.cameraPosn[2]
        );
        settings.orbitTarget = userSettings.orbitTarget || [0,0,0];
        settings.orbitTarget = new THREE.Vector3(
            settings.orbitTarget[0],
            settings.orbitTarget[1],
            settings.orbitTarget[2]
        )

        /*\
        |*| Declare variables
        \*/

        var // local constants
            NUMPLOTS = plots.length,
            // var SCALE = 1, // TODO expose this option?
            WIDTH    = plotTarget.offsetWidth,
            HEIGHT   = plotTarget.offsetHeight,
            BLACK    = new THREE.Color().setRGB(0,0,0),
            WHITE    = new THREE.Color().setRGB(1,1,1),
            NEAR     = settings.near,
            FAR      = settings.far,
            CAMANGLE = settings.cameraAngle,
            CTRLTYPE = settings.ctrlType,
            AUTOROT  = settings.autoRotate,

            orbitTarget = settings.orbitTarget,
            cameraPosn = settings.cameraPosn,
            plotCtx = {};

        /*\
        |*| Set up ThreeJS
        \*/

        // ---------------------
        // Renderer

        var renderer = new THREE.WebGLRenderer({
            // scale: SCALE,
            // brightness: 2,
            antialias: true
        });
        renderer.setSize(WIDTH,HEIGHT);
        // TODO next line might be bork. Next few, actually
        // renderer.domElement.style.position = "absolute"; 
        renderer.domElement.style.top = "0px";
        renderer.domElement.style.left = "0px";
        renderer.setClearColor( BLACK );
        plotTarget.appendChild( renderer.domElement );

        // ---------------------
        // Scene

        var scene = new THREE.Scene();

        // ---------------------
        // Camera

        var camera = new THREE.PerspectiveCamera(CAMANGLE, WIDTH/HEIGHT, NEAR, FAR);
        camera.position.x = cameraPosn.x;
        camera.position.y = cameraPosn.y;
        camera.position.z = cameraPosn.z;
        camera.up = new THREE.Vector3(0,0,1);
        camera.lookAt(orbitTarget);
        scene.add(camera);

        // ---------------------
        // Controls

        var controls;
        if (CTRLTYPE === "fly") {
            controls = new THREE.FlyControls( camera );
            controls.dragToLook = true;
            // controls.autoForward = true;
        } else if (CTRLTYPE === "orbit") {
            controls = new THREE.OrbitControls( camera, renderer.domElement );
            controls.target.copy(orbitTarget);
            // TODO maybe pause rotation on mouse down or something
            controls.autoRotate = AUTOROT;
        }
        
        // ---------------------
        // Parse plot objects

        var iplots = [];
        for (var i = 0; i < plots.length; i++) {
            var p = plots[i];
            // add/parse color
            p.color = p.color ? new THREE.Color(p.color) : new THREE.Color().setHSL(i/plots.length,80/100,65/100);
            // convert
            iplots.push( ThreePlot.parseIPlot(p, scene) );
        };

        // ---------------------
        // Light

        var light = new THREE.DirectionalLight( 0xffffff, 0.9 );
        scene.add(light);

        // ---------------------
        // Animate

        // create plot context
        var plotCtx = {};
        plotCtx.renderer = renderer;
        plotCtx.scene = scene;
        plotCtx.camera = camera;
        plotCtx.controls = controls;
        plotCtx.iplots = iplots;
        plotCtx.light = light;
        plotCtx.id = Math.random().toString(36).slice(2); // random alpha-numeric

        // fix camera and light
        ThreePlot.updateMetrics(plotCtx);
        if (!fixCamFlag) ThreePlot.retargetCamera(plotCtx);
        light.position.copy( camera.position );
        light.lookAt( plotCtx.metrics.center );

        // ---------------------
        // Events

        // retarget camera (helpful for animations)
        plotTarget.addEventListener(
            'dblclick',
            (function (plotCtx) {
                return function (e) {
                    ThreePlot.updateMetrics(plotCtx);
                    ThreePlot.retargetCamera(plotCtx);
                }
            })(plotCtx),
            false
        );

        // ---------------------
        // Plot statics and return
        plotCtx.renderer.render( plotCtx.scene, plotCtx.camera );
        ThreePlot.activePlots.push(plotCtx);
        return plotCtx.id;
    },
}

// start the render loop
ThreePlot.animate();