import { BufferGeometry, Color, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, Points, PointsMaterial, Uint32BufferAttribute, Vector3 } from "three";
import { ArrowHelper } from "./arrow";

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
      vertices,
      vertices_arr,
      faces,
      faces_arr,
      colors
    );
  }

  static createPointCloud(
    vertices: number,
    vertices_arr: Float32Array,
    colors?: Uint8Array
  ): Points {
    const point_size = 0.05;

    // add points & mesh
    const points_geo = new BufferGeometry();
    points_geo.setAttribute( 'position', new Float32BufferAttribute( vertices_arr, 3 ));

    let points_mat = new PointsMaterial( { size: point_size, color: 0xf57000 } );
    
    if (colors && colors.length > 0) {
      const color_arr: number[] = [];
      for (let i = 0; i < vertices; i++) {
        const new_col = new Color();
        new_col.setRGB(colors[i*3], colors[i*3 + 1], colors[i*3 + 2]);
        color_arr.push(new_col.r, new_col.g, new_col.b);
      }
      points_geo.setAttribute( 'color', new Float32BufferAttribute(color_arr, 3));
      points_mat.vertexColors = true;
    }
    
    return new Points(points_geo, points_mat);
  }

  static createMesh(
    vertices: number,
    vertices_arr: Float32Array,
    faces: number,
    faces_arr: Uint32Array,
    colors?: Uint8Array
  ): Mesh {

    // add points & mesh
    const mesh_geo = new BufferGeometry();
    const mesh_mat = new MeshBasicMaterial( { color: 0xf57000 } );
    
    mesh_geo.setAttribute( 'position', new Float32BufferAttribute( vertices_arr, 3 ));
    mesh_geo.setIndex(new Uint32BufferAttribute(faces_arr, 1));

    if (colors && colors.length > 0) {
      const color_arr: number[] = [];
      for (let i = 0; i < vertices; i++) {
        const new_col = new Color();
        new_col.setRGB(colors[i*3], colors[i*3 + 1], colors[i*3 + 2]);
        color_arr.push(new_col.r, new_col.g, new_col.b);
      }
      mesh_geo.setAttribute( 'color', new Float32BufferAttribute(color_arr, 3));
      mesh_mat.vertexColors = true;
    }

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

  
    const arrowHelper = new ArrowHelper();

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
      }

      arrowHelper.addArrowToBuffer(origin, direction, color);
    }
      
    return arrowHelper.finalize();
  }
}