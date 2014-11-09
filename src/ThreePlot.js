var ThreePlot = {

    "getMetrics": function (plotCtx) {
        var res = {
            "maxX": 0, "maxY": 0, "maxZ": 0,
            "minX": 0, "minY": 0, "minZ": 0,
        };
        
        // set Max and Min helper
        function setMaxMin (data) {
            for (var j = 0; j < data.length; j++) {
                var px = p.data[j][0],
                    py = p.data[j][1],
                    pz = p.data[j][2];
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
        
        // type specific
        for (var i = 0; i < plotCtx.iplots.length; i++) {
            var ip = plotCtx.iplots[i],
                p  = ip.plot;
            if (p.type === "lineplot") {
                if (p.animated) {
                    if (ip.threeObj) {
                        setMaxMin( ip.threeObj.geometry.vertices );
                    }
                } else {
                    setMaxMin( p.data );
                }
            } else if (p.type === "surfaceplot") {
                // TODO
            }
        };

        // compute extra metrics
        res.midX    = (res.maxX + res.minX)/2;
        res.midY    = (res.maxY + res.minY)/2;
        res.midZ    = (res.maxZ + res.minZ)/2;
        res.distX   = (res.maxX - res.minX)/2;
        res.distY   = (res.maxY - res.minY)/2;
        res.distZ   = (res.maxZ - res.minZ)/2;
        res.maxDist = Math.sqrt( Math.pow(res.distX, 2) + Math.pow(res.distY,2) + Math.pow(res.distZ, 2));
        res.center  = new THREE.Vector3(res.midX, res.midY, res.midZ);

        return res;
    },

    "retargetCamera": function (plotCtx) {
        var M = ThreePlot.getMetrics(plotCtx),
            relativeCameraPosn = new THREE.Vector3(
                METRICS.distX,
                METRICS.distY,
                METRICS.distZ
            ),
            cameraPosn = relativeCameraPosn.add(M.center);
        plotCtx.camera.position = cameraPosn;
        plotCtx.camera.lookAt(M.center);
        plotCtx.controls.target.copy(M.center); // for orbit
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
                var xyz = THREE.Vector3( plot.xyz[0], plot.xyz[1], plot.xyz[2] );
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
                    var xyz = THREE.Vector3( plot.data[j][0], plot.data[j][1], plot.data[j][2]);
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

        /*\
        |*| Settings
        \*/

        var userSettings = arguments[2] || {};
        var settings = {};
        settings.showGrid    = userSettings.showGrid    || true; // TODO
        settings.showAxes    = userSettings.showAxes    || true; // TODO
        settings.autoRotate  = userSettings.autoRotate  || false;
        settings.ctrlType    = userSettings.ctrlType    || "orbit";
        settings.near        = userSettings.near        || 0.1;
        settings.far         = userSettings.far         || 500;
        settings.cameraAngle = userSettings.cameraAngle || 45;
        // Used below:
        // userSettings.cameraPosn
        // userSettings.orbitTarget
        // TODO missing some options?

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
            METRICS  = ThreePlot.getMetrics(plots),
            // ThreeJS variables
            orbitTarget = userSettings.orbitTarget || METRICS.center,
            relativeCameraPosn = new THREE.Vector3(
                Math.max(METRICS.distX, METRICS.distZ),
                METRICS.distY,
                0
            ).multiplyScalar(10),
            cameraPosn = userSettings.cameraPosn || relativeCameraPosn.add(orbitTarget),
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

        // retarget camera (helpful for animations)
        plotTarget.addEventListener(
            'keydown',
            (function (plotCtx) {
                return function (e) {
                    if (e.char === 'r') ThreePlot.retargetCamera(plotCtx);
                }
            })(plotCtx),
            false
        );
        
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