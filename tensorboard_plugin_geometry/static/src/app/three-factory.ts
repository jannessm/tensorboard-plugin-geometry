import { BufferGeometry, Color, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, Points, PointsMaterial, Uint32BufferAttribute, Vector3 } from "three";
import { ArrowHelper } from "./arrow";
import * as colormap from 'colormap';
import { Settings } from "./settings";
import { ThreeConfig } from "./models/metadata";

export class ThreeFactory {

  static createGeometry(
    vertices_shape: number[],
    vertices_arr: Float32Array,
    face_shape?: number[],
    faces_arr?: Uint32Array,
    face_colors?: number[],
    face_colors_arr?: Uint8Array,
    vert_colors?: Uint8Array,
    config?: ThreeConfig
  ): Group | Points {
    if (!vertices_shape || !vertices_arr || vertices_arr.length <= 0 || vertices_shape[1] <= 0) {
      throw new Error('no vertices provided');
    }

    // check shapes
    if (!vertices_shape || vertices_shape.length !== 3 || vertices_shape[1] <= 0) {
      throw new Error(`vertices must be of shape [b, n, 3] but got ${vertices_shape}`);
    }
    if ((!face_shape && !!faces_arr) || (!!face_shape && !faces_arr)) {
      throw new Error('need faces and its shape not only one');
    }
    if (!!faces_arr && !!face_shape && face_shape.length > 0 && (faces_arr.length <= 0 || face_shape[1] <= 0)) {
      throw new Error(`faces must be of shape [b, n, 3], but got ${face_shape}`);
    }

    // check colors
    if (!!vert_colors && vert_colors.length > 0 && vert_colors.length / 3 !== vertices_shape[0] * vertices_shape[1]) {
      throw new Error(`there must be a color for each vertex, but got ${vert_colors.length / 3} instead of ${vertices_shape[0] * vertices_shape[1]}`);
    }
    if (!!face_shape && !!face_colors && !!face_colors_arr && face_colors_arr.length > 0 && face_colors_arr.length / 3 !== face_shape[0]) {
      throw new Error(`there must be a color for each sample, but got ${face_colors_arr.length / 3} instead of ${face_shape[0]}`);
    }

    if (!face_shape || !faces_arr || face_shape.length === 0 || faces_arr.length === 0) {
      return ThreeFactory.createPointCloud(
        vertices_shape,
        vertices_arr,
        vert_colors,
        config?.vertices_cmap
      );
    }

    return ThreeFactory.createMesh(
      vertices_shape,
      face_shape,
      vertices_arr,
      faces_arr,
      face_colors,
      face_colors_arr // no config required, since colors are not supported
    );
  }

  static createPointCloud(
    vertices_shape: number[],
    vertices_arr: Float32Array,
    colors?: Uint8Array,
    vertices_cmap?: string
  ): Points {
    const point_size = Settings.point_size.value;

    const points_geo = new BufferGeometry();
    points_geo.setAttribute('position', new Float32BufferAttribute( vertices_arr.slice(0, vertices_shape[0] * vertices_shape[1] * vertices_shape[2]), 3 ));
    
    let points_mat = new PointsMaterial( { size: point_size, vertexColors: true } );
    
    const color_arr = ThreeFactory._getColors(vertices_shape[0] * vertices_shape[1], colors, vertices_cmap);
    points_geo.setAttribute('color', new Float32BufferAttribute(color_arr, 3));
    
    return new Points(points_geo, points_mat);
  }

  static createMesh(
    vertices_shape: number[],
    faces_shape: number[],
    vertices_arr: Float32Array,
    faces_arr: Uint32Array,
    face_colors?: number[],
    face_colors_arr?: Uint8Array
  ): Group {
    const geometries = new Group();
    for (let i = 0; i < vertices_shape[0]; i++) {
      // add points & mesh
      let mesh_geo = new BufferGeometry();
      const mesh_mat = new MeshBasicMaterial( { color: 0xf57000 } );
      
      if (!!face_colors && !!face_colors_arr && face_colors_arr.length > 0) {
        console.log(face_colors_arr[i * 3],
          face_colors_arr[i * 3 + 1],
          face_colors_arr[i * 3 + 2]);
        mesh_mat.color = new Color(ThreeFactory._toHex([
          face_colors_arr[i * 3],
          face_colors_arr[i * 3 + 1],
          face_colors_arr[i * 3 + 2]
        ]));
        console.log(mesh_mat.color);
      }

      const pos_offset = vertices_shape[1] * 3;
      const pos_attr = new Float32BufferAttribute(vertices_arr.slice(i * pos_offset, (i+1) * pos_offset), 3);
      mesh_geo.setAttribute( 'position', pos_attr);
      
      const face_offset = faces_shape[1] * 3;
      const face_attr = new Uint32BufferAttribute(faces_arr.slice(i * face_offset, (i + 1) * face_offset), 1);
      mesh_geo.setIndex(face_attr);
      
      // meshes do not support colors!!! (only opporunity would be to color each face separetly.
      // this is too inefficient! use point cloud instead and adjust point_size
      
      geometries.add(new Mesh(mesh_geo, mesh_mat));
    }

    return geometries;
  }

  static createFeatureArrows(
    vertices: number[],
    vertices_arr: Float32Array,
    features_arr: Float32Array,
    feat_colors?: Uint8Array,
    config?: ThreeConfig
  ): Group | undefined {
    if (!features_arr || features_arr.length == 0) {
      return;
    }

    if (
      vertices[0] * vertices[1] !== features_arr.length / 3 || 
      vertices[0] * vertices[1] !== vertices_arr.length / 3
    ) {
      throw new Error('features and vertices do not have the same shape');
    }

    if (!!feat_colors && feat_colors.length > 0 && feat_colors.length / 3 !== vertices[0] * vertices[1]) {
      throw new Error('there must be a color for each feature');
    }

    const cmap = colormap({
      colormap: 'jet',
      nshades: 101,
      format: 'hex'
    }).map((val: string) => 
      parseInt(val.substr(1), 16)
    );
    const arrowHelper = new ArrowHelper();
    const zero_vec = new Vector3();

    // get max vector length
    let max_len = 0;
    for (let i = 0; i < vertices[0]; i++) {
      for (let j = 0; j < vertices[1]; j++) {
        const direction = new Vector3(
          features_arr[i * vertices[1] + j * 3],
          features_arr[i * vertices[1] + j * 3 + 1],
          features_arr[i * vertices[1] + j * 3 + 2]
        );
        max_len = Math.max(max_len, zero_vec.distanceTo(direction));
      }
    }

    // add arrows
    for (let i = 0; i < vertices[0]; i++) {
      for (let j = 0; j < vertices[1]; j++) {
        const origin = new Vector3(
          vertices_arr[i * vertices[1] * 3 + j * 3],
          vertices_arr[i * vertices[1] * 3 + j * 3 + 1],
          vertices_arr[i * vertices[1] * 3 + j * 3 + 2]
        );
        const direction = new Vector3(
          features_arr[i * vertices[1] * 3 + j * 3],
          features_arr[i * vertices[1] * 3 + j * 3 + 1],
          features_arr[i * vertices[1] * 3 + j * 3 + 2]
        );

        let color;
        if (!!feat_colors && feat_colors?.length > 0) {
          color = [
            feat_colors[i * vertices[1] * 3 + j * 3],
            feat_colors[i * vertices[1] * 3 + j * 3 + 1],
            feat_colors[i * vertices[1] * 3 + j * 3 + 2]
          ];
        } else {
          const len = zero_vec.distanceTo(direction);
          const c = new Color(cmap[Math.floor(len/max_len * 100)]);
          color = [c.r, c.g, c.b].map(val => Math.floor(val * 255));
        }
        
        arrowHelper.addArrowToBuffer(origin, direction, color);
      }
    }
      
    return arrowHelper.finalize();
  }

  static _getColors(vertices: number, colors?: Uint8Array, cmap?: string): number[] {
    const color_arr: number[] = [];
    
    // if colors are given
    if (!!colors && colors.length > 0) {
      for (let i = 0; i < vertices; i++) {
        const new_col = new Color();
        new_col.setRGB(
          colors[i*3] / 255,
          colors[i*3 + 1] / 255,
          colors[i*3 + 2] / 255);
        color_arr.push(new_col.r, new_col.g, new_col.b);
      }
        
    // else apply colormap
    } else {
      const colors = colormap({
        colormap: cmap || 'jet',
        nshades: vertices,
        format: 'hex'
      }).map((val: string) => 
      parseInt(val.substr(1), 16)
      );
      
      for (let i = 0; i < vertices; i++) {
        const new_col = new Color(colors[i]);
        color_arr.push(new_col.r, new_col.g, new_col.b);
      }
    }

    return color_arr;
  }

  static _toHex(color: number[]): number {
    return parseInt(color.reduce((str, val) => str + parseInt(`${val}`, 10).toString(16).padStart(2, '0'), ''), 16);
  }
}