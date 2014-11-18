var ThreePlot = {

    "activePlots": [],

    "getMetrics": function (plotCtx) {
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
        res.maxDist = Math.sqrt(
            Math.pow(res.distX, 2) +
            Math.pow(res.distY, 2) +
            Math.pow(res.distZ, 2)
        );
        res.center  = new THREE.Vector3(res.midX, res.midY, res.midZ);

        return res;
    },

    "retargetCamera": function (plotCtx) {
        var M = ThreePlot.getMetrics(plotCtx),
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
        // Light
        var light = new THREE.PointLight( 0xffffff, 1.5, 3 * M.maxDist );
        light.position = M.center;
        plotCtx.scene.remove(plotCtx.light);
        plotCtx.light = light;
        plotCtx.scene.add( light );
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
                var xyz = new THREE.Vector3( plot.xyz[0], plot.xyz[1], plot.xyz[2] );
                for (var j=0; j<plot.lineLength; j++) {
                   geometry.vertices.push(xyz);
                }
                var traj = new THREE.Line(geometry, material);
                // prevent culling (could be inefficient for many lines)
                traj.frustumCulled = false;

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
                    var xyz = new THREE.Vector3( plot.data[j][0], plot.data[j][1], plot.data[j][2]);
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
            throw "Unsupported Plot Type: Surface plotting coming soon";
            if (plot.animated) {
                //
            } else {
                //function () {};
            };
            break;

            // -------------------------------------------------------
            // FUTURE: "ode3", "pde3", "graph", "wolframalpha", ...
        }

        return iplot;

    },

    "animate": function () {
        "Plot plotCtx objects";

        for (var i = 0; i < ThreePlot.activePlots.length; i++) {
            var plotCtx = ThreePlot.activePlots[i];

            // increment iterator plot objects
            for (var i = 0; i < plotCtx.iplots.length; i++) {
                plotCtx.iplots[i].update();
            };

            // update controls and render
            plotCtx.controls.update( 1 );
            plotCtx.renderer.render( plotCtx.scene, plotCtx.camera );
        };

        // loop
        requestAnimationFrame( ThreePlot.animate );
    },

    "plot": function(plots, plotTarget) {
        "Sets up all the ThreeJS machinery and starts animation loop";

        /*\
        |*| Unpack settings
        \*/

        var userSettings = arguments[2] || {};
        var settings     = {};
        var ZERO         = new THREE.Vector3(0,0,0);
        settings.showGrid    = userSettings.showGrid    || true; // TODO
        settings.showAxes    = userSettings.showAxes    || true; // TODO
        settings.autoRotate  = userSettings.autoRotate  || false;
        settings.ctrlType    = userSettings.ctrlType    || "orbit";
        settings.near        = userSettings.near        || 0.005;
        settings.far         = userSettings.far         || 500;
        settings.cameraAngle = userSettings.cameraAngle || 45;
        settings.cameraPosn  = userSettings.cameraPosn  || ZERO;
        settings.orbitTarget = userSettings.orbitTarget || ZERO

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

        var light = new THREE.PointLight( 0xffffff, 1.5, 60 );
        light.position = ZERO;
        scene.add( light );

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

        // fix camera
        ThreePlot.retargetCamera(plotCtx);

        // ---------------------
        // Events

        // retarget camera (helpful for animations)
        plotTarget.addEventListener(
            'dblclick',
            (function (plotCtx) {
                return function (e) {
                    ThreePlot.retargetCamera(plotCtx);
                }
            })(plotCtx),
            false
        );

        ThreePlot.activePlots.push(plotCtx);
        return plotCtx.id;
    },
}

// Start main loop
ThreePlot.animate();