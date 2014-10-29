/*\
|*|  Settings
\*/

// initial conditions bounds
var xbnd = 8.0;
var ybnd = 8.0;
var zbnd = 8.0;

// length of trajectory to display
var trajLength = 1000;

// rotate camera when user not interacting
var autoRot = true;

// point that the camera orbits about
orbitTarget = [0,0,28];

// initial position of camera
cameraPos = [45,-85,25];

/*\
|*|  Runge Kutta
\*/

function rk4 (system) {
  // unpack
  var xyz = system.xyz,
      f   = system.f,
      dt  = system.dt,
      // internal vars
      aaa,xyz1,bbb,xyz2,ccc,xyz3,ddd,xyz4;
  // RK method
  aaa  = sm(   dt,   f(xyz) );
  xyz1 = add3( xyz,  sm( (dt/2.0), aaa ));
  bbb  = sm(   dt,   f(xyz1));
  xyz2 = add3( xyz1, sm( (dt/2.0), bbb ));
  ccc  = sm(   dt,   f(xyz2));
  xyz3 = add3( xyz2, sm( dt, ccc) );
  ddd  = sm(   dt,   f(xyz3));
  // Compute estimated component
  xyz4 = add3(
      xyz,
      sm(
          (dt/6.),
          add3(           // god
              aaa,
              sm(2, bbb), // damnit
              sm(2, ccc),
              ddd         // javascript
          )
      )
  );
  // finish up
  system.xyz = xyz4;
  return system;
}

function sm (c, arr) {
    // scalar multiplication
    return arr.map(function (x) { return c*x });
}

function add3 (/* variable number of arrays */) {
    // add 3 dimensional arrays
    var arrays = arguments;
    var arr = [];
    for (var i = 0; i < 3; i++) {
        arr_i = 0;
        for (var j = 0; j < arrays.length; j++) {
            arr_i += arrays[j][i];
        }
        arr.push(arr_i);
    };
    return arr;
}

/*\
|*|  Helpers
\*/

function lorenz (xyz) {
  // Lorenz equations, a chaotic DE system
  // unpack
  var x = xyz[0],
      y = xyz[1],
      z = xyz[2],
      // constants
      delta = 10.0,
      r = 28.0,
      b = 8.0/3.0;
  // compute step
  return [delta*(y-x), r*x - y - x*z, x*y - b*z];
}

function v(xyz) {
  return new THREE.Vector3(xyz[0],xyz[1],xyz[2]);
}

function randomIC (n,xbnd,ybnd,zbnd) {
  // create 3 initial conditions extremely close together
  var seedx = (Math.random() - 0.5)*2*xbnd,
      seedy = (Math.random() - 0.5)*2*ybnd,
      seedz = (Math.random() - 0.5)*2*zbnd,
      ics = [];
  for (var i = 0; i < n; i++) {
    ics.push([
      seedx+Math.random()/10.0,
      seedy+Math.random()/10.0,
      seedz+Math.random()/10.0
    ]);
  };
  return ics;
}

/*\
|*| Setup -- Add your own trajectories here
|*|
|*| A system is a JSON object that must have:
|*|   * a system.xyz property which is an array of 3 numbers
|*|   * a system.step() function that takes no parameters and
|*|     which updates the system.xyz attribute when called
|*|
|*| Simply create a system object and push it onto systems,
|*| the rest is taken care of for you
\*/

var systems = [];

// add some DE trajectories with similar ICs
var n1 = 3;
var ics = randomIC(n1,xbnd,ybnd,zbnd);
console.log("Initial conditions:");
for (var i = 0; i < ics.length; i++) {
  console.log(ics[i]);
};
for (var i = 0; i < n1; i++) {
  systems.push({
    f : lorenz,
    dt : 1/170.0,
    xyz : ics[i],
    steps : 350, // RK steps per animation frame
    step : function () {
      // step can be any function that updates
      // the system.xyz value
      for (var i = 0; i < this.steps; i++) {
        rk4(this)
      }
    }
  });
};

// parametric trajectory example: a heart!
// x=16sin^3t, y=13cost-5cos(2t)-2cos(3t)-cos(4t)
/*
systems.push({
  step: function () {
    var t = this.t;
    this.xyz = [
      16*Math.pow(Math.sin(t), 3),
      0,
      20+13*Math.cos(t)-5*Math.cos(2*t)-Math.cos(4*t)
    ];
    this.t += dt;
  },
  t: 0,
  dt: 1/170.0,
  xyz: [0,0,20+7]
})
*/

/*\
|*|  Set up ThreeJS
\*/

function show(systems, settings) {
  if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

  orbitTarget = settings.orbitTarget || getOrbitTarget();
  cameraPos = settings.cameraPos || getCameraPos();
  autoRotate = settings.autoRotate || true;

  var numTraj = systems.length;

  var SCALE = 1;

  var WIDTH  = window.innerWidth;
  var HEIGHT = window.innerHeight;

  var BLACK   = new THREE.Color().setRGB(0,0,0);
  var WHITE   = new THREE.Color().setRGB(1,1,1);
  var SKYBLUE = new THREE.Color().setRGB(178/255,221/255,255/255);

  var NEAR = 0.1;
  var FAR  = 500.0;

  var CAMANGLE = 45;

  // core
  var renderer,
      scene,
      container,
      camera,
      controls,
      trajs = [],
      orbitTarget = new THREE.Vector3(
        orbitTarget[0],
        orbitTarget[1],
        orbitTarget[2]
      ),
      cameraPos = new THREE.Vector3(
        cameraPos[0],
        cameraPos[1],
        cameraPos[2]
      )
      ;

  // containers
  var lights = [];
  var morphs = [];
  var skins = [];

  // fullscreen
  var isFullscreen = false;
  window.addEventListener( 'touchend', function () {
    if ( isFullscreen === false ) {
      document.body.webkitRequestFullscreen();
      isFullscreen = true;
    } else {
      document.webkitExitFullscreen();
      isFullscreen = false;
    }
  });

  // run
  init();

  // -----------------------------

  function init() {

    container = document.getElementById( 'container' );

    // renderer
    renderer = new THREE.WebGLRenderer({
      // scale: SCALE,
      // brightness: 2,
      antialias: true
    });
    renderer.setSize(WIDTH,HEIGHT);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0px";
    renderer.domElement.style.left = "0px";
    renderer.setClearColor( BLACK );
    container.appendChild( renderer.domElement );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(CAMANGLE, WIDTH/HEIGHT, NEAR, FAR);
    camera.position.set(cameraPos);
    camera.up = new THREE.Vector3(0,0,1);
    camera.lookAt(orbitTarget);
    scene.add(camera);

    /*
    controls = new THREE.FlyControls( camera );
    controls.dragToLook = true;
    controls.autoForward = true;
    */
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.target.copy(orbitTarget);

    // auto rotate controls
    // TODO maybe pause rotation on mouse down or something
    controls.autoRotate = autoRotate;

    // add lights and other objects
    initLights();
    initObjects();

    // events
    window.addEventListener( 'resize', onWindowResize, false );

    // animate later
    animate();
  }

  // -----------------------------

  function resetCamera() {
    camera.position = cameraPos;
    camera.lookAt(orbitTarget);
  }

  // -----------------------------

  function initLights() {
    var distance = 40;
    var light = new THREE.PointLight( 0xffffff, 1.5, 1.5 * distance );
    scene.add( light );
    lights.push( light );
  }

  // -----------------------------

  function initObjects() {
    for (var i=0; i<numTraj; i++){
      var material = new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(i/numTraj,80/100,65/100),
        linewidth: 3
      });
      
      var geometry = new THREE.Geometry();
      geometry.dynamic = true;
      var xyz = v(systems[i].xyz);
      for (var j=0; j<trajLength; j++) {
        geometry.vertices.push(xyz);
      }

      var traj = new THREE.Line(geometry, material);
      trajs.push(traj);
      scene.add(traj);
    }
  }

  // -----------------------------

  function onWindowResize( event ) {
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;

    renderer.setSize( WIDTH, HEIGHT );
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
  }

  // -----------------------------

  function animate() {
    requestAnimationFrame( animate );

    // iterate with rk4
    for (var i = 0; i < numTraj; i++) {
      var system = systems[i];
      var traj = trajs[i];

      system.step();
      
      var new_xyz = v(system.xyz);

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
}