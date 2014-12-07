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
        if (THREE.OrbitControls && plotCtx.controls instanceof THREE.OrbitControls) {
            plotCtx.controls.target.copy(M.center);
        };
    },

    "updateGrid": function (plotCtx) {
        if (plotCtx.grid) plotCtx.scene.remove(plotCtx.grid);
        var m = plotCtx.metrics,
            size = 0, //todo
            step = 0;

        // Make Three Object
        var geometry = new THREE.Geometry();
        var material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors } );
        var color1 = new THREE.Color( 0x444444 );
        var color2 = new THREE.Color( 0x888888 );

        for (var i = -size; i <= size; i += step) {
            geometry.vertices.push(
                new THREE.Vector3( -size, 0, i ), new THREE.Vector3( size, 0, i ),
                new THREE.Vector3( i, 0, -size ), new THREE.Vector3( i, 0, size )
            );
            var color = i === 0 ? this.color1 : this.color2;
            geometry.colors.push( color, color, color, color );
        }

        grid = new THREE.Line( geometry, material, THREE.LinePieces );

        // update
        plotCtx.scene.add( grid );
        plotCtx.grid = grid;
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

            /**  PARSE INPUT  **/

            // convert to the 'manual' form of lineplot
            if (plot.parse) {
                
                // fns holds the parsed x(t), y(t), and z(t) funcitons
                var fns = [];
                for (var i = 0; i < plot.parse.length; i++) {
                    
                    var tree     = math.parse(plot.parse[i]),
                        symNames = ThreePlot.uniqueSymbolNames( tree ),
                        compiled = tree.compile(math);

                    if (symNames.length > 1) throw "Argument Error: "+
                        "Please use 0 or 1 symbols for parsed lineplot functions";
                    
                    fns.push(
                        (function (cpd, symNames) {
                            return function (t) {
                                var s = {};
                                if (symNames.length > 0) s[symNames[0]] = t;
                                return cpd.eval(s);
                            }
                        })(compiled, symNames)
                    );

                }

                // animated lineplot
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
                }

                // static lineplot
                else {
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

            }

            /**  BUILD THREE JS OBJECT  **/

            var material = new THREE.LineBasicMaterial({
                color: plot.color,
                linewidth: 2
            });
            var geometry = {};
            var traj = {};
            
            // animated lineplot
            if (plot.animated) {

                geometry = new THREE.Geometry();
                geometry.dynamic = true;

                // initialize all points in geometry to the initial point
                var xyz = new THREE.Vector3( plot.xyz[0], plot.xyz[1], plot.xyz[2] );
                for (var j=0; j<plot.lineLength; j++) {
                   geometry.vertices.push(xyz);
                }

                traj = new THREE.Line(geometry, material);
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

            }

            // static lineplot
            else {

                geometry = new THREE.Geometry();

                // fill the geometry with provided points
                for (var j=0; j<plot.data.length; j++) {
                    var xyz = new THREE.Vector3( plot.data[j][0], plot.data[j][1], plot.data[j][2]);
                    geometry.vertices.push(xyz);
                }
                
                traj = new THREE.Line(geometry, material);
                iplot.threeObj = traj;
                // don't change geometry on update
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

            // materials
            var material = new THREE.MeshLambertMaterial({
                color: plot.color,
                shading: plot.shading,
                side: THREE.DoubleSide,
            });
            if (plot.wireframe) {
                var wireframeMaterial = new THREE.MeshBasicMaterial({
                    color: plot.wireframeColor || 0xeeeeee,
                    wireframe: true,
                    transparent: true
                }); 
            }

            // forward declare
            var geometry = {};
            var mesh = {};

            if (plot.animated) {
                geometry = ThreePlot.triangulate(
                    plot.minX, plot.minY, plot.maxX, plot.maxY, plot.mesh
                );
                geometry.computeFaceNormals();
                geometry.computeVertexNormals();
                if (plot.wireframe) {
                    var multiMaterial = [ material, wireframeMaterial ];
                    mesh = THREE.SceneUtils.createMultiMaterialObject(
                        geometry,
                        multiMaterial
                    );
                } else {
                    mesh = new THREE.Mesh( geometry, material );
                }
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

        var settings      = arguments[2] || {};
        var usrDefinedCam = settings.cameraPosn; // flag
        
        settings.far            = settings.far            || 500;
        settings.near           = settings.near           || 0.005;
        settings.showGrid       = settings.showGrid       || true; // TODO
        settings.showAxes       = settings.showAxes       || true; // TODO
        settings.ctrlType       = settings.ctrlType       || "orbit";
        settings.clearColor     = settings.clearColor     || "#111";
        settings.autoRotate     = settings.autoRotate     || false;
        settings.cameraPosn     = settings.cameraPosn     || [0,0,0];
        settings.cameraAngle    = settings.cameraAngle    || 45;
        settings.orbitTarget    = settings.orbitTarget    || [0,0,0];
        settings.lightIntensity = settings.lightIntensity || 0.85;

        /*\
        |*| Declare variables
        \*/

        var FAR           = settings.far,
            NEAR          = settings.near,
            WIDTH         = plotTarget.offsetWidth,
            HEIGHT        = plotTarget.offsetHeight,
            AUTOROT       = settings.autoRotate,
            NUMPLOTS      = plots.length,
            CTRLTYPE      = settings.ctrlType,
            SHOWGRID      = settings.showGrid,
            SHOWAXES      = settings.showAxes,
            CAMANGLE      = settings.cameraAngle,
            CAMERAPOSN    = settings.cameraPosn,
            CLEARCOLOR    = new THREE.Color( settings.clearColor ),
            ORBITTARGET   = settings.orbitTarget,
            LIGHTINTESITY = settings.lightIntensity
            ;

        /*\
        |*| Set up ThreeJS
        \*/

        // -----------------------------------------------------
        // Renderer

        var renderer = new THREE.WebGLRenderer({
            // TODO expose more options?
            // scale: SCALE,
            // brightness: 2,
            antialias: true
        });
        renderer.setSize( WIDTH, HEIGHT );
        renderer.domElement.style.top = "0px";
        renderer.domElement.style.left = "0px";
        renderer.setClearColor( CLEARCOLOR );
        plotTarget.appendChild( renderer.domElement );

        // -----------------------------------------------------
        // Scene

        var scene = new THREE.Scene();

        // -----------------------------------------------------
        // Camera

        var camera = new THREE.PerspectiveCamera(CAMANGLE, WIDTH/HEIGHT, NEAR, FAR);
        camera.position.x = CAMERAPOSN[0];
        camera.position.y = CAMERAPOSN[1];
        camera.position.z = CAMERAPOSN[2];
        camera.up = new THREE.Vector3(0,0,1);
        camera.lookAt(ORBITTARGET);
        scene.add(camera);

        // -----------------------------------------------------
        // Controls

        var controls;
        switch (CTRLTYPE) {
            
            case "fly":
            if (!THREE.FlyControls) throw "Error: "+
                "Please include FlyControls.js before plotting";
            controls = new THREE.FlyControls( camera );
            controls.dragToLook = true;
            break;

            case "orbit":
            if (!THREE.OrbitControls) throw "Error: "+
                "Please include OrbitControls.js before plotting";
            controls = new THREE.OrbitControls( camera, renderer.domElement );
            controls.target.x = ORBITTARGET[0];
            controls.target.y = ORBITTARGET[1];
            controls.target.z = ORBITTARGET[2];
            controls.autoRotate = AUTOROT;
            break;

            default:
            throw "Argument Error: Invalid control type '"+CTRLTYPE+"'";
            break;

        }
        
        // -----------------------------------------------------
        // Parse plot objects

        var iplots = [];
        for (var i = 0; i < plots.length; i++) {

            var p = plots[i];
            
            // add/parse color
            p.color = p.color ? new THREE.Color(p.color) :
                                new THREE.Color().setHSL(i/plots.length,80/100,65/100);
            
            // shading type
            var sh = p.shading || 'smooth';
            p.shading = sh === 'smooth' ? THREE.SmoothShading : THREE.FlatShading;
            
            // convert
            iplots.push( ThreePlot.parseIPlot(p, scene) );

        };

        // -----------------------------------------------------
        // Light

        var light = new THREE.DirectionalLight( 0xffffff, LIGHTINTESITY );
        scene.add(light);

        // -----------------------------------------------------
        // Animate

        // create plot context
        var plotCtx = {};
        plotCtx.renderer = renderer;
        plotCtx.scene    = scene;
        plotCtx.camera   = camera;
        plotCtx.controls = controls;
        plotCtx.iplots   = iplots;
        plotCtx.light    = light;
        plotCtx.id       = Math.random().toString(36).slice(2); // alpha-num string

        // -----------------------------------------------------
        // Update Scene (Camera, Lights, Grid, Axes)

        if (plots.length != 0) ThreePlot.updateMetrics(plotCtx);

        // maybe update camera position and orbit target
        if (!usrDefinedCam) ThreePlot.retargetCamera(plotCtx);

        // shine light where camera is looking
        light.position.copy( camera.position );
        light.lookAt( plotCtx.metrics.center );
        
        // TODO
        // if (SHOWGRID) ThreePlot.updateGrid( plotCtx );
        // if (SHOWAXES) ThreePlot.updateAxes( plotCtx );

        // -----------------------------------------------------
        // Events

        // retarget camera (helpful for animations)
        plotTarget.addEventListener(
            'dblclick',
            (function (plotCtx, SHOWGRID, SHOWAXES) {
                return function (e) {
                    if (plotCtx.iplots.length === 0) return;
                    ThreePlot.updateMetrics(plotCtx);
                    ThreePlot.retargetCamera(plotCtx);
                    // if (SHOWGRID) ThreePlot.updateGrid( plotCtx );
                    // if (SHOWAXES) ThreePlot.updateAxes( plotCtx );
                }
            })(plotCtx, SHOWGRID, SHOWAXES),
            false
        );

        // -----------------------------------------------------
        // Plot static plots and return id

        plotCtx.renderer.render( plotCtx.scene, plotCtx.camera );
        ThreePlot.activePlots.push(plotCtx);
        return plotCtx.id;

    },

}

// start the render loop
ThreePlot.animate();