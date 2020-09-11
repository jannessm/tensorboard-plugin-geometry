import Vue from 'vue';
import Component from "vue-class-component";

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  MeshBasicMaterial,
  Mesh,
  Group,
  HemisphereLight,
  AxesHelper,
  Color,
  Vector3,
  Points,
  BufferGeometry,
  PointsMaterial,
  Float32BufferAttribute
} from 'three';

import {BufferGeometryUtils} from './buffer-geometry-utils';

import {ArrowHelper} from './arrow';

import {OrbitControls} from './orbit-controls';

import WithRender from './plot.html';

import './plot.scss';

@WithRender
@Component({
  props: ['data', 'config', 'width'],
})
export default class PlotComponent extends Vue {
  scene: Scene = new Scene();
  camera: PerspectiveCamera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000 );
  renderer: WebGLRenderer = new WebGLRenderer();
  controls: OrbitControls = new OrbitControls( this.camera, this.renderer.domElement );
  last_width = 0;
  meshes: Mesh[] = [];
  points: Points[] = [];
  features: Group[] = [];

  arrowHelper = new ArrowHelper();

  mounted() {
    this.$el.appendChild(this.renderer.domElement);
    this.$watch('width', this.update);
    this.$watch('data', this.updateData);
    window.addEventListener('resize', this.update);
    
    this.camera.position.set(5,5,5);
    this.camera.lookAt(0,0,0);
    
    this.scene.background = new Color( 0xf0f0f0 );
    const light = new HemisphereLight( 0xffffbb, 0x080820, 1 );
    light.position.set( 0, 50, 0 );
    const axesHelper = new AxesHelper( 5 );
    this.scene.add( axesHelper );
    this.scene.add( light );

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
    if (this.$props.data.vertices.length > 0 && this.$props.data.vertices[0].length > 0 && this.$props.data.faces.length === 0) {
      this.scene.remove.apply(this.scene, this.meshes);
      this.scene.remove.apply(this.scene, this.points);

      const point_size = 0.05;

      // add points & mesh
      const points_geo = new BufferGeometry();
      
      const vertices: number[] = [];
      for (let i = 0; i < this.$props.data.vertices[0].length; i++) {
        vertices.push(
          this.$props.data.vertices[0][i][0],
          this.$props.data.vertices[0][i][1],
          this.$props.data.vertices[0][i][2]);
      }

      points_geo.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ));
      const points_mat = new PointsMaterial( { color: 0xf57000 } );
      points_mat.size = point_size;
      const points = new Points(points_geo, points_mat);
      this.points.push(points);
      this.scene.add(points);

    // if there are faces
    } else if (this.$props.data.vertices.length > 0 && this.$props.data.vertices[0].length > 0 && this.$props.data.faces.length > 0 && this.$props.data.faces[0].length > 0) {
      this.scene.remove.apply(this.scene, this.meshes);
      this.scene.remove.apply(this.scene, this.points);

      const point_size = 0.05;

      // add points & mesh
      const mesh_geo = new BufferGeometry();
      const mesh_mat = new MeshBasicMaterial( { color: 0xf57000 } );
      
      const vertices: number[] = [];
      for (let i = 0; i < this.$props.data.vertices[0].length; i++) {
        vertices.push(
          this.$props.data.vertices[0][i][0],
          this.$props.data.vertices[0][i][1],
          this.$props.data.vertices[0][i][2]);
      }
      mesh_geo.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ));

      const faces: number[] = [];
      for (let i = 0; i < this.$props.data.faces[0].length; i++) {
        faces.push(
          this.$props.data.faces[0][i][0],
          this.$props.data.faces[0][i][1],
          this.$props.data.faces[0][i][2]);
      }
      mesh_geo.setIndex(faces);
      const mesh = new Mesh(mesh_geo, mesh_mat);
      this.meshes.push(mesh);
      this.scene.add(mesh);
    }

    ///////// update features ////////
    if (this.$props.data.features.length > 0 && this.$props.data.features[0].length > 0) {
      this.scene.remove.apply(this.scene, this.features);

      // add arrows
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

        this.arrowHelper.addArrowToBuffer(origin, direction, [255, 0, 0]);
      }
      
      const arrows = this.arrowHelper.finalize();
      this.features.push(arrows);
      this.scene.add(arrows);
    }
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