import { BufferGeometry, Color, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, Points, PointsMaterial, Uint32BufferAttribute, Vector3 } from "three";
import { ArrowHelper } from "./arrow";
import * as colormap from 'colormap';

export class ThreeFactory {

  static createGeometry(
    vertices: number,
    vertices_arr: Float32Array,
    faces?: number,
    faces_arr?: Uint32Array,
    colors?: Uint8Array
  ): Mesh | Points {
    if (!vertices || vertices_arr.length <= 0) {
      throw new Error('no vertices provided');
    }

    if (!faces || !faces_arr) {
      return ThreeFactory.createPointCloud(vertices, vertices_arr, colors);
    }

    return ThreeFactory.createMesh(
      vertices_arr,
      faces_arr
    );
  }

  static createPointCloud(
    vertices: number,
    vertices_arr: Float32Array,
    colors?: Uint8Array
  ): Points {
    const point_size = 0.1;

    // add points & mesh
    const points_geo = new BufferGeometry();
    points_geo.setAttribute( 'position', new Float32BufferAttribute( vertices_arr, 3 ));

    let points_mat = new PointsMaterial( { size: point_size, color: 0xf57000 } );
    
    const color_arr = ThreeFactory._getColors(vertices, colors);

    points_geo.setAttribute( 'color', new Float32BufferAttribute(color_arr, 3));
    points_mat.vertexColors = true;
    
    return new Points(points_geo, points_mat);
  }

  static createMesh(
    vertices_arr: Float32Array,
    faces_arr: Uint32Array
  ): Mesh {

    // add points & mesh
    let mesh_geo = new BufferGeometry();
    const mesh_mat = new MeshBasicMaterial( { color: 0xf57000 } );
    
    mesh_geo.setAttribute( 'position', new Float32BufferAttribute( vertices_arr, 3 ));
    mesh_geo.setIndex(new Uint32BufferAttribute(faces_arr, 1));

    // meshes do not support colors!!! (only opporunity would be to color each face separetly.
    // this is too inefficient! use point cloud instead and adjust point_size instead

    return new Mesh(mesh_geo, mesh_mat);
  }

  static createFeatureArrows(
    vertices: number,
    vertices_arr: Float32Array,
    features_arr: Float32Array,
    colors?: Uint8Array
  ): Group | undefined {
    if (!features_arr || features_arr.length == 0) {
      return;
    }

    if (vertices !== features_arr.length / 3 && vertices_arr.length / 3 !== vertices) {
      throw new Error('features and vertices do not have the same shape');
    }

    if (!!colors && colors.length !== vertices) {
      throw new Error('there must be a color for each vertex');
    }

    const cmap = colormap({
      colormap: 'jet',
      nshades: 101,
      format: 'hex'
    }).map((val: string) => 
      parseInt(val.substr(1), 16)
    );
    const arrowHelper = new ArrowHelper();

    // get max vector length
    let max_len = 0;
    const zero_vec = new Vector3();
    for (let i = 0; i < vertices; i++) {
      const direction = new Vector3(
        features_arr[i * 3],
        features_arr[i * 3 + 1],
        features_arr[i * 3 + 2]
      );
      max_len = Math.max(max_len, zero_vec.distanceTo(direction));
    }

    // add arrows
    for (let i = 0; i < vertices; i++) {
      const origin = new Vector3(
        vertices_arr[i * 3],
        vertices_arr[i * 3 + 1],
        vertices_arr[i * 3 + 2]
      );
      const direction = new Vector3(
        features_arr[i * 3],
        features_arr[i * 3 + 1],
        features_arr[i * 3 + 2]
      );

      let color = [255, 0, 0];
      if (colors) {
        color = [
          colors[i * 3],
          colors[i * 3 + 1],
          colors[i * 3 + 2]
        ];
      } else {
        const len = zero_vec.distanceTo(direction);
        const c = new Color(cmap[Math.floor(len/max_len * 100)]);
        color = [c.r, c.g, c.b].map(val => Math.floor(val * 255));
      }

      arrowHelper.addArrowToBuffer(origin, direction, color);
    }
      
    return arrowHelper.finalize();
  }

  static _getColors(vertices:number, colors?: Uint8Array): number[] {
    const color_arr: number[] = [];
    // if colors are given
    if (colors && colors.length > 0) {
      for (let i = 0; i < vertices; i++) {
        const new_col = new Color();
        new_col.setRGB(colors[i*3] / 255, colors[i*3 + 1] / 255, colors[i*3 + 2] / 255);
        color_arr.push(new_col.r, new_col.g, new_col.b);
      }

    // else apply colormap
    } else {
      const cmap = colormap({
          colormap: 'jet',
          nshades: vertices,
          format: 'hex'
        }).map((val: string) => 
          parseInt(val.substr(1), 16)
        );

      for (let i = 0; i < vertices; i++) {
        const new_col = new Color(cmap[i]);
        color_arr.push(new_col.r, new_col.g, new_col.b);
      }
    }

    return color_arr;
  }
}