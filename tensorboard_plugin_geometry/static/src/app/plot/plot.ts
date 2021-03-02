import Vue from 'vue';
import Component from "vue-class-component";
import * as colormap from 'colormap';

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
  Vector3,
  OrthographicCamera,
  MeshBasicMaterial,
  DirectionalLight,
  Sprite,
  SpriteMaterial,
  CanvasTexture
} from 'three';

import {TrackballControls} from './trackball-controls';
import {Lut, ColorMapKeywords} from './lut';

import WithRender from './plot.html';

import './plot.scss';
import { Settings } from '../settings';
import { ThreeFactory } from '../three-factory';
import { CAMERA_TYPE, OrthograficCameraConfig, PerspectiveCameraConfig } from '../models/metadata';
import { StepData } from '../models/step';

@WithRender
@Component({
  props: ['data', 'width', 'config'],
})
export default class PlotComponent extends Vue {
  scene = new Scene();
  lutScene = new Scene();
  camera: PerspectiveCamera | OrthographicCamera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.0001, 1000 );
  orthoCamera = new OrthographicCamera( - 1, 1, 1, - 1, 0.1, 1000 );
  renderer = new WebGLRenderer();
  hemiLight = new HemisphereLight( 0xffffbb, 0x080820, 0.7);
  dirLight = new DirectionalLight(0xffffbb, 1);
  controls: TrackballControls = new TrackballControls(this.camera, this.renderer.domElement);
  last_width = 0;
  geometries: (Group | Points)[] = [];
  features: Group[] = [];
  lut: Lut = new Lut();
  lut_plane: Sprite | undefined;
  show_lut = false;
  max_mag = 1.0;
  is_active = false;

  mounted() {
    // listeners
    this.$el.appendChild(this.renderer.domElement);
    this.$watch('width', this.update); // for toggle fullscreen
    window.addEventListener('resize', this.update); // for window resize
    this.$props.data.subscribe(this.updateData);

    // ui Scene
    this.orthoCamera.position.set( 0, 0, 10 );

    // empty scene
    this.camera.position.set(0,0,-5);
    this.camera.lookAt(0,0,0);
    
    this.scene.background = new Color( 0xffffff );
    this.renderer.shadowMap.enabled = true;
    this.renderer.autoClear = false;
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.refresh();
    
    this.scene.background = new Color( 0xf0f0f0 );
    this.scene.add( this.hemiLight );
    this.dirLight.castShadow = true;
    this.scene.add(this.dirLight);

    const axesHelper = new AxesHelper( 1000000 );
    this.scene.add( axesHelper );

    this.controls = new TrackballControls(this.camera, this.renderer.domElement);
    this.controls.addEventListener('start', this.startUpdate);
    this.controls.addEventListener('end', this.stopUpdate);

    Settings.point_size.subscribe(this.updatePointSize);

    Settings.show_features.subscribe(display => {
      this.features.forEach(group => group.visible = display);
      this.show_lut = display;
      this.update();
    });
    
    Settings.show_vertices.subscribe(display => {
      this.geometries.forEach(group => group.visible = display);
      this.update();
    });
    
    Settings.show_wireframe.subscribe(display => {
      this.geometries.forEach(group => {
        if (group instanceof Group) {
          (group as Group).traverseVisible(mesh => {
            if (mesh instanceof Mesh) {
              (mesh.material as MeshBasicMaterial).wireframe = display;
            }
          });
        }
      });
      this.update();
    });
  }

  startUpdate() {
    this.is_active = true;
    this.animate();
  }

  stopUpdate() {
    this.is_active = false;
  }

  animate() {
    if (this.is_active) {
      requestAnimationFrame(this.animate);
      this.update();
    }
  }
  
  update(event: Event | undefined = undefined, width: number | undefined = undefined, height: number | undefined = undefined) {
    if (width === undefined || height === undefined) {
      width = (this.$el as HTMLElement).offsetWidth;
      height = (this.$el as HTMLElement).offsetWidth;
    }

    if (width !== this.last_width) {
      (this.camera as PerspectiveCamera).aspect = width / height;
      this.renderer.setSize(width, height);
      this.last_width = width;
    }

    this.controls.handleResize();
    this.controls.update();
    
    this.refresh();
  }

  updateData(data: StepData) {
    this.scene.remove.apply(this.scene, this.features);
    this.scene.remove.apply(this.scene, this.geometries);
    this.features = [];
    this.geometries = [];
    
    this.update();
    if (data.broken || data.not_initialized) {
      this.refresh();
      return;
    }

    ////////// update mesh /////////
    if (!!data && !!data.geometry) {

      this.geometries.push(data.geometry);
      this.scene.add(data.geometry);

    } 
    ///////// update features ////////
    if (!!data && !!data.features) {
      this.features.push(data.features);
      this.scene.add(data.features);

      if (!this.lut_plane) {
        this.lut_plane = new Sprite( new SpriteMaterial( {
          map: new CanvasTexture( this.lut.createCanvas() )
        } ) );
        this.lut_plane.castShadow = false;
        this.lut_plane.position.set(-1.8, 0, 1);
        this.lut_plane.scale.setY(2);
        this.lut_plane.scale.setX(2);
        this.lutScene.add(this.lut_plane);
      }

      const cmap_label = this.$props.config?.features_cmap || 'jet';
      this.max_mag = data.max_magnitude || 1.0;
      this.lut.setMax(this.max_mag);
      
      if (Object.keys(ColorMapKeywords).indexOf(cmap_label) < 0) {
        const cmap = colormap({
          colormap: cmap_label,
          nshades: 101,
          format: 'hex'
        }).map((val: string, id) => 
          [id / 101.0, parseInt(val.substr(1), 16)]
        );
        this.lut.addColorMap(cmap_label, cmap);
      }
      
      this.lut.setColorMap(cmap_label, 101);
      this.show_lut = true;
      const map = this.lut_plane.material.map;
      if (map) {
        this.lut.updateCanvas(map.image);
        map.needsUpdate = true;
      }
    } else {
      this.show_lut = false;
    }

    /////// update config ////////
    this.updateConfig();

    /////// update visibility according to settings ///////
    this.features.map(group => group.visible = Settings.show_features.value);
    this.geometries.map(group => group.visible = Settings.show_vertices.value);
    this.geometries.forEach(group => {
      if (group instanceof Group) {
        (group as Group).traverseVisible(mesh => {
          if (mesh instanceof Mesh) {
            (mesh.material as MeshBasicMaterial).wireframe = Settings.show_wireframe.value;
          }
        });
      }
    });

    //////// update camera position ////////
    if (this.camera instanceof PerspectiveCamera) {
      this.setPerspCameraPosition();
    
    } else if (this.camera instanceof OrthographicCamera) {
      this.setOrthoCameraPosition();
    }

    this.controls = new TrackballControls(this.camera, this.renderer.domElement);
    this.reset();
  }

  updatePointSize(new_point_size: number) {
    this.geometries.forEach(val => {
      val.traverse(obj => {
        if (obj instanceof Points) {
          obj.material.size = new_point_size;
        }
      })
    });

    this.refresh();
  }

  setPerspCameraPosition() {
    const config = this.$props.config;
    if (!!config.camera && !!config.camera.position) {
      return
    }

    const camera = this.camera as PerspectiveCamera;
    const bounds = this._getBoundingBox();

    const offset = 0.1;
    const bounding_sphere = new Sphere();
    bounds.getBoundingSphere(bounding_sphere);
    
    let r = bounding_sphere.radius;
    r += r * offset;
    const distance = r / Math.sin(camera.getEffectiveFOV() / 2 * Math.PI / 180);
    const new_position = bounding_sphere.center.add(new Vector3(distance, 0, 0));
    const target = bounding_sphere.center;
    const backside = new Vector3().addScaledVector(new_position, -1);

    this.dirLight.position.copy(new_position);
    this.hemiLight.position.copy(backside);
    this.controls.position0.copy(new_position);
    this.controls.object.position.copy(new_position);
    this.controls.target0.copy(target);
    this.controls.target.copy(target);
    this.controls.update();
  }

  setOrthoCameraPosition() {
    const config = this.$props.config;
    if (!!config.camera && !!config.camera.position) {
      return
    }

    const camera = this.camera as OrthographicCamera;
    const bounds = this._getBoundingBox();
    
    const offset = 0.1;
    const bounding_sphere = new Sphere();
    bounds.getBoundingSphere(bounding_sphere);

    const width = (this.$el as HTMLElement).offsetWidth;
    const height = (this.$el as HTMLElement).offsetWidth;
    const aspect = width / height;

    let max_side = Math.max(bounds.max.sub(bounds.min).x, bounds.max.sub(bounds.min).y);
    max_side += max_side * offset;

    camera.left = max_side * aspect / -2;
    camera.right = max_side * aspect / 2;
    camera.top = max_side / 2;
    camera.bottom = max_side / -2;

    const new_position = bounding_sphere.center.add(new Vector3(0,0, max_side));
    const target = bounding_sphere.center;
    const backside = new Vector3().addScaledVector(new_position, -1);

    this.dirLight.position.copy(new_position);
    this.hemiLight.position.copy(backside);
    this.controls.position0.copy(new_position);
    this.controls.object.position.copy(new_position);
    this.controls.target0.copy(target);
    this.controls.target.copy(target);
    this.controls.update();
  }

  updateConfig() {
    const config = this.$props.config;

    //// update scene ////
    if (!!config.scene && !!config.scene.background_color && config.scene.background_color.length === 3) {
      this.scene.background = new Color(ThreeFactory._toHex(config.scene.background_color));
    }

    //// update camera ////
    if (!!config.camera) {
      // change camera type
      if (!!config.camera.type && config.camera.type === CAMERA_TYPE.PERSPECTIVE && !(this.camera instanceof PerspectiveCamera)) {
        const width = (this.$el as HTMLElement).offsetWidth;
        const height = (this.$el as HTMLElement).offsetWidth;
        this.camera = new PerspectiveCamera(50, width / height, 0.1, 1000);
      } else if (!!config.camera.type && config.camera.type === CAMERA_TYPE.ORTHOGRAFIC && !(this.camera instanceof OrthographicCamera)) {
        this.camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
        this.camera.position.set(0,0,10);
        this.camera.lookAt(0,0,0);
        this.controls.dispose();

        this.controls.removeEventListener('start', this.startUpdate);
        this.controls.removeEventListener('end', this.stopUpdate);
        this.controls = new TrackballControls(this.camera, this.renderer.domElement);
        this.controls.addEventListener('start', this.startUpdate);
        this.controls.addEventListener('end', this.stopUpdate);
      }
  
      // change position
      if (!!config.camera.position) {
        this.camera.position.set(config.camera.position[0], config.camera.position[1], config.camera.position[2]);
        this.camera.lookAt(0,0,0);
      }

      // change fov arguments
      if (!!config.camera.far && // must be greater than 0
        ((config.camera.near && config.camera.near < config.camera.far) || // near is set and smaller
        (!config.camera.near && this.camera.near < config.camera.far)) // or camera as smaller near value
      ) {
        this.camera.far = config.camera.far;
      }
      if (!!config.camera.near && // must be greater than 0
        ((config.camera.far && config.camera.near < config.camera.far) || // far is set and greater
        (!config.camera.far && config.camera.near < this.camera.far)) // or camera as smaller near value) { // must be greater than 0
      ){
        this.camera.near = config.camera.near;
      }
      // perspective specific args
      if (this.camera instanceof PerspectiveCamera) {
        this.camera.fov = (config.camera as PerspectiveCameraConfig).fov || 50;
      }
      // orthografic specific args
      if (this.camera instanceof OrthographicCamera) {
        this.camera.left = (config.camera as OrthograficCameraConfig).left || -1;
        this.camera.right = (config.camera as OrthograficCameraConfig).right || 1;
        this.camera.top = (config.camera as OrthograficCameraConfig).top || 1;
        this.camera.bottom = (config.camera as OrthograficCameraConfig).bottom || -1;
      }

    }
  }

  screenshot(filename='plot.png') {    
    this.refresh();
    const link = document.createElement('a');
    link.href = this.renderer.domElement.toDataURL();
    link.download = filename;

    return link;
  }

  reset() {
    this.controls.reset();
    this.controls.update();
    this.refresh();
  }

  rotateUpwards() {
    this.controls.rotateUpwards(Math.PI / 2); // 90 deg
    this.controls.update(true);
    this.refresh();
  }

  rotateSideways() {
    this.controls.rotateSideways( - Math.PI / 2); // 90 deg
    this.controls.update(true);
    this.refresh();
  }

  private _getBoundingBox() {
    const bounds = new Box3();
    this.scene.updateWorldMatrix(false, true);
    
    this.scene.traverse(obj => {
      if (obj instanceof Points || obj instanceof Mesh) {
        bounds.expandByObject(obj);
      }
    });
    return bounds;
  }

  refresh() {
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);

    if (this.show_lut) {
      this.renderer.render(this.lutScene, this.orthoCamera);
    }
  }
}