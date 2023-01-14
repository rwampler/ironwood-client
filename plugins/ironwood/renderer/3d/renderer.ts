import * as THREE from 'three';
import Stats from 'stats.js';

import Noise from '~/plugins/ironwood/util/noise';
import State from '~/plugins/ironwood/state';

export default class Renderer {
  renderDomId: string;
  state: State;

  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;

  clock: THREE.Clock;
  stats: Stats;

  constructor (renderDomId: string, state: State) {
    this.renderDomId = renderDomId;
    this.state = state;

    this.renderer = new THREE.WebGLRenderer();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 1, 10000 );

    this.clock = new THREE.Clock();
    this.stats = new Stats();
  }

  configure () {
    // this.scene.background = new THREE.Color( 0xefd1b5 );
    // this.scene.fog = new THREE.FogExp2( 0xefd1b5, 0.0025 );

    // const data = generateHeight( worldWidth, worldDepth );

    const w = 256;
    const h = 256;
    const zoom = 100;

    const geometry = new THREE.PlaneGeometry(w, h, w - 1, h - 1);
    geometry.rotateX(-Math.PI / 2);


    const seed = Math.random();
    const data = Noise.perlin(w, h, {
      seed: `seed-${seed}-${0}-${0}`,
      octaveCount: 8,
      amplitude: 0.1,
      persistence: 0.5
    });

    const vertices = geometry.attributes.position.array;
    console.log("vert: " + vertices.length);
    console.log("data: " + data.length);
    for (let i = 0; i < data.length; i++) {
      geometry.attributes.position.setY(i, data[ i ] * 50);
      // vertices[ j + 1 ] = data[ i ] * 20;
    }

    // geometry.attributes.position.setY(0, 2);
    // geometry.attributes.position.setY(4, 2);
    // geometry.attributes.position.setY(5, 2);
    // geometry.attributes.position.setY(9, 2);

    // geometry.attributes.position.setY(9 * w + 0, 2);
    // geometry.attributes.position.setY(9 * w + 4, 2);
    // geometry.attributes.position.setY(9 * w + 5, 2);
    // geometry.attributes.position.setY(9 * w + 9, 2);

    this.camera.position.set(10, data[0 * w + 0] + zoom, 10);
    this.camera.lookAt(-5, data[5 * w + 5], -5);



    const texture = new THREE.DataTexture(data, w, h, THREE.RedFormat);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( {color: 0x964B00} ) );
    // this.scene.add(mesh);

    const wireframe = new THREE.WireframeGeometry( geometry );
    const line = new THREE.LineSegments(wireframe);
    (<THREE.Material>line.material).depthTest = false;
    (<THREE.Material>line.material).opacity = 0.25;
    (<THREE.Material>line.material).transparent = true;
    this.scene.add(line);

    const humanHeight = 2;
    const humanHead = humanHeight / 7.5;
    const humanLegs = humanHead * 3.5;
    const humanWaist = humanHeight * 0.5; // M: 0.428/0.45–0.49/0.63  W: 0.424/0.46–0.53/0.63
    const humanShoulder = humanWaist / 1.5; // M: 1.8  W: 1

    const humanGeometry = new THREE.BoxGeometry(humanWaist, humanHeight, humanWaist * 0.6);
    const cube = new THREE.Mesh(humanGeometry, new THREE.MeshBasicMaterial( {color: 0x00ff00} ));
    cube.position.set(-2.5, 20, -2.5);
    this.scene.add( cube );


    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.state.render.width, this.state.render.height);

    // controls = new FirstPersonControls( camera, renderer.domElement );
    // controls.movementSpeed = 150;
    // controls.lookSpeed = 0.1;

    const container: HTMLElement | null = document.getElementById(this.renderDomId);
    container?.appendChild(this.renderer.domElement);
    container?.appendChild(this.stats.dom);
  }

  resize (): void {
    this.camera.aspect = this.state.render.width / this.state.render.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.state.render.width, this.state.render.height);
  }

  tick (): void {
    // controls.update( clock.getDelta() );
    this.renderer.render(this.scene, this.camera);

    this.stats.update();
  }

}
