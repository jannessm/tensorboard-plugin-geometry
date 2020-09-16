import Vue from 'vue';
import Component from "vue-class-component";

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Mesh,
  Group,
  HemisphereLight,
  AxesHelper,
  Color,
  Points,
  Sphere,
  Box3,
  Vector3, SphereBufferGeometry, MeshBasicMaterial
} from 'three';

import {OrbitControls} from './orbit-controls';

import WithRender from './plot.html';

import './plot.scss';
import { Settings } from '../settings';

@WithRender
@Component({
  props: ['data', 'config', 'width'],
})
export default class PlotComponent extends Vue {
  scene = new Scene();
  camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000 );
  renderer = new WebGLRenderer();
  controls = new OrbitControls( this.camera, this.renderer.domElement );
  last_width = 0;
  geometries: (Mesh | Points)[] = [];
  features: Group[] = [];

  mounted() {
    this.$el.appendChild(this.renderer.domElement);
    this.$watch('width', this.update);
    this.$watch('data', this.updateData);
    window.addEventListener('resize', this.update);
    
    this.camera.position.set(0,0,-5);
    this.camera.lookAt(0,0,0);
    
    // empty scene
    this.scene.background = new Color( 0xffffff );
    this.renderer.render( this.scene, this.camera );
    
    
    this.scene.background = new Color( 0xf0f0f0 );
    const light = new HemisphereLight( 0xffffbb, 0x080820, 1 );
    light.position.set( 0, 50, 0 );
    const axesHelper = new AxesHelper( 1000 );
    this.scene.add( axesHelper );
    this.scene.add( light );

    this.controls = new OrbitControls( this.camera, this.renderer.domElement );    
    this.controls.addEventListener('change', this.update);

    Settings.point_size.subscribe(this.updatePointSize);
  }
  
  update() {
    const width = (this.$el as HTMLElement).offsetWidth;
    const height = (this.$el as HTMLElement).offsetHeight;

    if (width !== this.last_width) {
      (this.camera as PerspectiveCamera).aspect = width / height;
      this.renderer.setSize(width, height);
      this.last_width = width;
      this.renderer.render( this.scene, this.camera );
    } else {
      this.renderer.render( this.scene, this.camera );
    }
  }

  updateData() {
    this.update();
    this.scene.remove.apply(this.scene, this.features);
    this.scene.remove.apply(this.scene, this.geometries);
    this.features = [];
    this.geometries = [];

    ////////// update mesh /////////
    if (!!this.$props.data.geometry) {

      this.geometries.push(this.$props.data.geometry);
      this.scene.add(this.$props.data.geometry);

    } 
    ///////// update features ////////
    if (!!this.$props.data.features) {
      this.features.push(this.$props.data.features);
      this.scene.add(this.$props.data.features);
    }

    //////// update camera position ////////
    this.setCameraPosition();

    this.renderer.render(this.scene, this.camera);
  }

  updatePointSize(new_point_size: number) {
    this.geometries.forEach(val => {
      val.traverse(obj => {
        if (obj instanceof Points) {
          obj.material.size = new_point_size;
        }
      })
    });

    this.renderer.render(this.scene, this.camera);
  }

  setCameraPosition(camera?: PerspectiveCamera) {
    if (!camera) {
      camera = this.camera;
    }
    this.scene.updateWorldMatrix(false, true);
    const bounds = new Box3();
    
    this.scene.traverse(obj => {
      if (obj instanceof Points || obj instanceof Mesh) {
        bounds.expandByObject(obj);
      }
    });
    
    const offset = 0.1;
    const bounding_sphere = new Sphere();
    bounds.getBoundingSphere(bounding_sphere);
    
    let r = bounding_sphere.radius;
    r += r * offset;
    const distance = r / Math.sin(camera.getEffectiveFOV() / 2 * Math.PI / 180);
    const new_position = bounding_sphere.center.add(new Vector3(0, 0, distance));
    
    camera.position.set(new_position.x, new_position.y, new_position.z);
    camera.lookAt(bounding_sphere.center);
  }

  screenshot() {    
    this.renderer.render(this.scene, this.camera);
    const link = document.createElement('a');
    link.href = this.renderer.domElement.toDataURL();
    link.download = 'plot.png';
    
    //Firefox requires the link to be in the body
    document.body.appendChild(link);
    
    //simulate click
    link.click();

    //remove the link when done
    document.body.removeChild(link);

  }
}