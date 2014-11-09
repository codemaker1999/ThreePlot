var ThreePlot = {
    
    "helpers": {

        "v": function (xyz) {
            return new THREE.Vector3(xyz[0],xyz[1],xyz[2]);
        },

        "getMetrics": function (plots) {
            var maxX, maxY, maxZ,
                minX, minY, minZ;
            // set Max and Min
            for (var i = 0; i < plots.length; i++) {
                var p = plots[i];
                // TODO support for more types
                if (p.type === "lineplot") {
                    if (p.animated) {
                        var px = p.xyz[0],
                            py = p.xyz[1],
                            pz = p.xyz[2];
                        // init
                        maxX = px;
                        maxY = py;
                        maxZ = pz;
                        minX = px;
                        minY = py;
                        minZ = pz;
                    } else {
                        for (var j = 0; j < p.data.length; j++) {
                            var px = p.data[j][0],
                                py = p.data[j][1],
                                pz = p.data[j][2];
                            // init
                            if (!maxX) maxX = px;
                            if (!maxY) maxY = py;
                            if (!maxZ) maxZ = pz;
                            if (!minX) minX = px;
                            if (!minY) minY = py;
                            if (!minZ) minZ = pz;
                            // set max
                            maxX = px > maxX ? px : maxX;
                            maxY = py > maxY ? py : maxY;
                            maxZ = pz > maxZ ? pz : maxZ;
                            // set min
                            minX = px < minX ? px : minX;
                            minY = py < minY ? py : minY;
                            minZ = pz < minZ ? pz : minZ;
                        };
                    }
                }
            };
            // if only animated
            if (typeof maxX === 'undefined' ||
                typeof maxY === 'undefined' ||
                typeof maxZ === 'undefined') return {};
            // else return metrics
            var midX = (maxX - minX)/2,
                midY = (maxY - minY)/2,
                midZ = (maxZ - minZ)/2,
                distX = Math.max(maxX - midX, midX - minX),
                distY = Math.max(maxY - midY, midY - minY),
                distZ = Math.max(maxZ - midZ, midZ - minZ),
                dist = Math.max(Math.max(distX,distY), distZ);
            return {
                "maxX": maxX, "maxY": maxY, "maxZ": maxZ,
                "minX": minX, "minY": minY, "minZ": minZ,
                "center": new THREE.Vector3(midX, midY, midZ),
                "distX": distX, "distY": distY, "distZ": distZ,
                "maxDist": dist
            }
        },

        "recenterCamera": function (plots) {
            // TODO this goes elsewhere, refactor later
            // call AFTER initializing scene
            var M = this.helpers.getMetrics(plots),
                relativeCameraPosn = new THREE.Vector3(
                    Math.max(METRICS.distX, METRICS.distZ),
                    METRICS.distY,
                    0
                ),
                cameraPosn = relativeCameraPosn.add(orbitTarget);
            camera.position = cameraPosn;
            camera.lookAt(M.center);
            controls.target.copy(M.center);
        }

    },

    "parseIPlot": function (plot, scene) {
        "parse plottable object into an iterator that updates ThreeJS geometries";

        var iplot = {"plot": plot};
        
        switch (plot.type) {
            // -------------------------------------------------------
            case "lineplot":

            var material = new THREE.LineBasicMaterial({
                color: plot.color,
                linewidth: 2
            });

            var geometry = new THREE.Geometry();
            
            if (plot.animated) {

                // ThreeJS
                geometry.dynamic = true;
                var xyz = this.helpers.v(plot.xyz);
                for (var j=0; j<plot.trajLength; j++) {
                   geometry.vertices.push(xyz);
                }
                var traj = new THREE.Line(geometry, material);

                // iplot
                iplot.threeObj = traj;
                iplot.update = function () {
                    var xyz = this.plot.step();
                    var new_xyz = new THREE.Vector3(xyz[0], xyz[1], xyz[2]);
                    this.plot.xyz = new_xyz;
                    // update trajectory
                    this.threeObj.geometry.vertices.shift();
                    this.threeObj.geometry.vertices.push(new_xyz);
                    this.threeObj.geometry.verticesNeedUpdate = true;
                };

            } else {

                for (var j=0; j<plot.data.length; j++) {
                    var xyz = this.helpers.v(plot.data[j]);
                    geometry.vertices.push(xyz);
                }
                
                var traj = new THREE.Line(geometry, material);

                // don't change geometry
                iplot.threeObj = traj;
                iplot.update = function () {};
            };

            scene.add(traj);

            break;
            
            // -------------------------------------------------------
            case "surfaceplot":
            if (plot.animated) {
                //
            } else {
                // don't change geometry
                iplot.update = function () {};
            };
            break;

            // -------------------------------------------------------
            // FUTURE: "ode3", "pde3", "graph", "wolframalpha", ...
        }

        return iplot;

        /*
        for (var i=0; i<NUMPLOTS; i++){
            var p = plots[i];
            if (p.type == 'lineplot') {

                var material = new THREE.LineBasicMaterial({
                    color: new THREE.Color().setHSL(i/NUMPLOTS,80/100,65/100),
                    linewidth: 3
                });

                var geometry = new THREE.Geometry();

                if (p.animated) {

                    geometry.dynamic = true;
                    var xyz = this.helpers.v(p.xyz);
                    for (var j=0; j<p.trajLength; j++) {
                       geometry.vertices.push(xyz);
                    }
                    var traj = new THREE.Line(geometry, material);
                    p.threeObj = traj;

                } else {

                    for (var j=0; j<p.data.length; j++) {
                        var xyz = this.helpers.v(p.data[j]);
                        geometry.vertices.push(xyz);
                    }
                    var traj = new THREE.Line(geometry, material);
                    p.threeObj = traj;

                };

                scene.add(traj);
            };
        }

        for (var i = 0; i < numTraj; i++) {
            var system = systems[i];
            var traj = trajs[i];

            system.step();

            var new_xyz = this.helpers.v(system.xyz);

            // update trajectory
            traj.geometry.vertices.shift();
            traj.geometry.vertices.push(new_xyz);
            traj.geometry.verticesNeedUpdate = true;
        };
        */
    },

    "animate": function (plotCtx) {
        "Plots a plotCtx object";

        // loop
        requestAnimationFrame(function () {
            ThreePlot.animate(plotCtx);
        });

        // increment iterator plot objects
        for (var i = 0; i < plotCtx.iplots.length; i++) {
            plotCtx.iplots[i].update();
        };

        // update controls and render
        plotCtx.controls.update( 1 );
        plotCtx.renderer.render( plotCtx.scene, plotCtx.camera );
    },

    "plot": function(plots, plotTarget) {
        "Sets up all the ThreeJS machinery and starts animation loop";

        // check for webGL support
        if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
        
        /*\
        |*| Settings
        \*/

        var userSettings = arguments[2] || {};
        var settings = {};
        settings.showGrid    = userSettings.showGrid    || true; // TODO
        settings.showAxes    = userSettings.showAxes    || true; // TODO
        settings.autoRotate  = userSettings.autoRotate  || true;
        settings.autoCamera  = userSettings.autoCamera  || true;
        settings.ctrlType    = userSettings.ctrlType    || "orbit";
        settings.near        = userSettings.near        || 0.1;
        settings.far         = userSettings.far         || 500;
        settings.cameraAngle = userSettings.cameraAngle || 45;
        // TODO missing some options

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
            METRICS  = this.helpers.getMetrics(plots),
            // ThreeJS variables
            orbitTarget = METRICS.center,
            relativeCameraPosn = new THREE.Vector3(
                Math.max(METRICS.distX, METRICS.distZ),
                METRICS.distY,
                0
            ).multiplyScalar(10),
            cameraPosn = relativeCameraPosn.add(orbitTarget),
            renderer,
            scene,
            camera,
            controls,
            // containers
            plotCtx = {},
            lights = [],
            morphs = [],
            skins = [];

        /*\
        |*| Set up ThreeJS
        \*/

        // ---------------------
        // Renderer

        renderer = new THREE.WebGLRenderer({
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

        scene = new THREE.Scene();

        // ---------------------
        // Camera

        camera = new THREE.PerspectiveCamera(CAMANGLE, WIDTH/HEIGHT, NEAR, FAR);
        camera.position.x = cameraPosn.x;
        camera.position.y = cameraPosn.y;
        camera.position.z = cameraPosn.z;
        camera.up = new THREE.Vector3(0,0,1);
        camera.lookAt(orbitTarget);
        scene.add(camera);

        // ---------------------
        // Controls

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
        // Lights and Other Objects

        initLights();
        // initObjects();

        // ---------------------
        // Events

        // TODO fix keydown listener
        // window.addEventListener(
        //     'keydown',
        //     (function (that) {
        //         return function (e) {
        //             if (e.char === 'r') that.recenterCamera();
        //         }
        //     })(this),
        //     false
        // );
        
        // ---------------------
        // Parse plot objects

        var iplots = [];
        for (var i = 0; i < plots.length; i++) {
            var p = plots[i];
            // add/parse color
            p.color = p.color ? new THREE.Color(p.color) : new THREE.Color().setHSL(i/plots.length,80/100,65/100);
            // convert
            iplots.push( this.parseIPlot(p, scene) );
        };

        // ---------------------
        // Animate

        // create plot context
        plotCtx.renderer = renderer;
        plotCtx.scene = scene;
        plotCtx.camera = camera;
        plotCtx.controls = controls;
        plotCtx.iplots = iplots;

        DEBUG_plotCtx = plotCtx;

        // begin animating
        ThreePlot.animate(plotCtx);

        // ---------------------
        // Helpers

        function initLights() {
            // TODO directional light? attach to camera? need to change this!
            // for (var i = 0; i < lightPosns.length; i++) {
                var p = METRICS.center;
                var distance = METRICS.maxDist;
                var light = new THREE.PointLight( 0xffffff, 1.5, 1.5 * distance );
                light.position = p;
                scene.add( light );
                // lights.push( light );
            // };
        }
    },
}