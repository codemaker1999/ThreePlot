var ThreePlot = {
    
    "settings": {
        "showGrid": true,
        "showAxes": true,
        "autoRotate": true,
        "ctrlType": "orbit",
        "near": 0.1,
        "far": 500,
        "cameraAngle": 45
    },

    "helpers": {

        "v": function (xyz) {
            return new THREE.Vector3(xyz[0],xyz[1],xyz[2]);
        },

        "getMetrics": function (plots, settings) {
            // TODO
            // return {orbitTarget,cameraPosn,...}
            // RETURN THREEJS OBJECTS!!
            var maxVal,
                minVal,
                sot = settings.orbitTarget,
                scp = settings.cameraPosn,
                ot = sot ? this.v(sot) : getOT(),
                cp = scp ? this.v(scp) : getCP();
            function getOT () {
                // set max and min values for use later
            };
            function getCP () {
                // ot is defined, reuse max / min values
            };
            function lighting () {
                // return list of light positions
                // TODO expose through API?
            }
            return {
                "orbitTarget": ot,
                "cameraPosn": cp,
                "lightPosns": lighting()
            }
        }

    },

    "plot": function(plots, plotTarget) {
        // check for webGL support
        if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

        // preliminary setup
        var NUMPLOTS = plots.length,
            // var SCALE = 1, // TODO expose this option?
            WIDTH    = plotTarget.style.width, // TODO don't even know if this works
            HEIGHT   = plotTarget.style.height,
            BLACK    = new THREE.Color().setRGB(0,0,0),
            WHITE    = new THREE.Color().setRGB(1,1,1),
            NEAR     = this.settings.near,
            FAR      = this.settings.far,
            CAMANGLE = this.settings.cameraAngle,
            CTRLTYPE = this.settings.ctrlType,
            AUTOROT  = this.settings.autoRotate,
            METRICS  = this.helpers.getMetrics(plots, this.settings),
            //
            orbitTarget = METRICS.orbitTarget,
            cameraPosn   = METRICS.cameraPosn,
            renderer,
            scene,
            camera,
            controls,
            // containers
            lights = [],
            morphs = [],
            skins = [];

        // fullscreen TODO: bad UX on mobile, purely embedded is fine
        // var isFullscreen = false;
        // window.addEventListener( 'touchend', function () {
        //     if ( isFullscreen === false ) {
        //         document.body.webkitRequestFullscreen();
        //         isFullscreen = true;
        //     } else {
        //         document.webkitExitFullscreen();
        //         isFullscreen = false;
        //     }
        // });

        // run
        init();

        // -----------------------------

        function init() {

            // renderer
            renderer = new THREE.WebGLRenderer({
                // scale: SCALE,
                // brightness: 2,
                antialias: true
            });
            renderer.setSize(WIDTH,HEIGHT);
            //TODO? renderer.domElement.style.position = "absolute"; 
            renderer.domElement.style.top = "0px";
            renderer.domElement.style.left = "0px";
            renderer.setClearColor( BLACK );
            plotTarget.appendChild( renderer.domElement );

            scene = new THREE.Scene();

            camera = new THREE.PerspectiveCamera(CAMANGLE, WIDTH/HEIGHT, NEAR, FAR);
            camera.position.set(cameraPosn);
            camera.up = new THREE.Vector3(0,0,1);
            camera.lookAt(orbitTarget);
            scene.add(camera);

            if (ctrlType === "fly") {
                controls = new THREE.FlyControls( camera );
                controls.dragToLook = true;
                // controls.autoForward = true;
            } else /* TODO if (ctrlType === "orbit")*/ {
                controls = new THREE.OrbitControls( camera, renderer.domElement );
                controls.target.copy(orbitTarget);
            }

            // TODO maybe pause rotation on mouse down or something
            controls.autoRotate = AUTOROT;

            // add lights and other objects
            initLights(METRICS.lightPosns);
            initObjects();

            // events
            // can probably nerf this, enforce embedding only
            // window.addEventListener( 'resize', onWindowResize, false );

            animate();
        }

        // -----------------------------

        function resetCamera() {
            camera.position = cameraPosn;
            camera.lookAt(orbitTarget);
        }

        // -----------------------------

        function initLights(lightPosns) {
            // TODO directional light? attach to camera? need to change this!
            for (var i = 0; i < lightPosns.length; i++) {
                var p = lightPosns[i]
                var distance = 40;
                var light = new THREE.PointLight( 0xffffff, 1.5, 1.5 * distance );
                light.position = p;
                scene.add( light );
                lights.push( light );
            };
        }

        // -----------------------------

        function initObjects() {
            // TODO big changes incoming here..
            for (var i=0; i<numTraj; i++){
                var material = new THREE.LineBasicMaterial({
                color: new THREE.Color().setHSL(i/numTraj,80/100,65/100),
                linewidth: 3
                });

                var geometry = new THREE.Geometry();
                geometry.dynamic = true;
                var xyz = this.helpers.v(systems[i].xyz);
                for (var j=0; j<trajLength; j++) {
                   geometry.vertices.push(xyz);
                }

                var traj = new THREE.Line(geometry, material);
                trajs.push(traj);
                scene.add(traj);
            }
        }

        /*/ TODO can probably nerf this, enforce embedding only
        function onWindowResize( event ) {
            WIDTH = window.innerWidth;
            HEIGHT = window.innerHeight;

            renderer.setSize( WIDTH, HEIGHT );
            camera.aspect = WIDTH / HEIGHT;
            camera.updateProjectionMatrix();
        }
        /*/

        // -----------------------------

        function animate() {
            requestAnimationFrame( animate );

            // iterate with rk4
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

            //render
            render();
        }

        function render() {
            controls.update( 1 );
            renderer.render( scene, camera );
        }
    },
}