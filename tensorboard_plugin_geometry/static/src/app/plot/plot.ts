import Vue from 'vue';
import Component from "vue-class-component";
import * as THREE from 'three';

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  SphereBufferGeometry,
  MeshBasicMaterial,
  Mesh,
  Group,
  HemisphereLight,
  AxesHelper,
  Color,
  ArrowHelper,
  Vector3
} from 'three';

import {OrbitControls} from './orbit-controls';

import WithRender from './plot.html';

import './plot.scss';

@WithRender
@Component({
  props: ['data', 'config', 'width'],
})
export default class PlotComponent extends Vue {
  scene: Scene = new Scene();
  camera: PerspectiveCamera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000 );
  renderer: WebGLRenderer = new WebGLRenderer();
  controls: OrbitControls = new OrbitControls( this.camera, this.renderer.domElement );
  last_width = 0;
  meshes: Group[] = [];
  features: Group[] = [];

  mounted() {
    this.$el.appendChild(this.renderer.domElement);
    this.$watch('width', this.update);
    this.$watch('data', this.updateData);
    window.addEventListener('resize', this.update);
    
    this.scene.background = new Color( 0xf0f0f0 );
    const light = new HemisphereLight( 0xffffbb, 0x080820, 1 );
    light.position.set( 0, 50, 0 );
    const axesHelper = new AxesHelper( 5 );
    this.scene.add( axesHelper );
    this.scene.add( light );

    console.log(this.camera instanceof THREE.PerspectiveCamera)
    this.controls = new OrbitControls( this.camera, this.renderer.domElement );    
    
    this.controls.addEventListener('change', this.update);
  }
  
  update() {
    const width = (this.$el as HTMLElement).offsetWidth;
    
    if (width !== this.last_width) {
      (this.camera as PerspectiveCamera).aspect = width / (this.$el as HTMLElement).offsetHeight;
      this.renderer.setSize(width, (this.$el as HTMLElement).offsetHeight);
    }
    this.renderer.render( this.scene, this.camera );
  }

  updateData() {
    this.update();

    ////////// update mesh /////////
    if (this.$props.data.vertices.length > 0 && this.$props.data.vertices[0].length > 0) {
      this.scene.remove.apply(this.scene, this.meshes);

      const sphere_r = 0.1;

      // add mesh
      const mesh = new Group();
      for (let i = 0; i < this.$props.data.vertices[0].length; i++) {
        const geo = new SphereBufferGeometry(sphere_r, 16, 16);
        const mat = new MeshBasicMaterial({color: 0xf57000});
        const sphere = new Mesh(geo, mat);
        sphere.position.set(
          this.$props.data.vertices[0][i][0],
          this.$props.data.vertices[0][i][1],
          this.$props.data.vertices[0][i][2]);
        mesh.add(sphere);
      }
      this.meshes.push(mesh);
      this.scene.add(mesh);
    }

    ///////// update features ////////
    if (this.$props.data.features.length > 0 && this.$props.data.features[0].length > 0) {
      this.scene.remove.apply(this.scene, this.features);

      // add arrows
      const arrows = new Group();
      for (let i = 0; i < this.$props.data.features[0].length; i++) {
        const origin = new Vector3(
          this.$props.data.vertices[0][i][0],
          this.$props.data.vertices[0][i][1],
          this.$props.data.vertices[0][i][2]
        );
        const direction = new Vector3(
          this.$props.data.features[0][i][0],
          this.$props.data.features[0][i][1],
          this.$props.data.features[0][i][2]
        );

        const arrow = new ArrowHelper(direction, origin, 1, 0x000000);
        arrows.add(arrow);
      }
      this.features.push(arrows);
      this.scene.add(arrows);
    }

    this.camera.position.set(5,5,5);
    this.camera.lookAt(0,0,0);
    this.renderer.render(this.scene, this.camera);
  }

  _calc_min_distance() {
    let min_distance = Infinity;
    const vertex1 = this.$props.data.vertices[0][0];
    
    for (let i = 1; i < this.$props.data.vertices[0].length; i++) {
      let dist = 0;
      for (let j = 0; j < 3; j++) {
        dist += Math.pow(vertex1[j] - this.$props.data.vertices[0][i][j], 2)
      }
      min_distance = Math.min(Math.sqrt(dist), min_distance);
    }

    return min_distance;
  }
}