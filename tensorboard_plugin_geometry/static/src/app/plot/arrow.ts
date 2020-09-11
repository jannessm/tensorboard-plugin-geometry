import { BoxBufferGeometry, BufferAttribute, BufferGeometry, CylinderBufferGeometry, Group, Matrix4, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { BufferGeometryUtils } from "./buffer-geometry-utils";

export class ArrowHelper {
	mat = new MeshBasicMaterial({ vertexColors: true });

	lines_buffer: BufferGeometry[] = [];
	cones_buffer: BufferGeometry[] = [];

	addArrowToBuffer(origin: Vector3, direction: Vector3, color: number[]) {
		const height = (new Vector3()).distanceTo(direction);
		const line = new BoxBufferGeometry(0.01, height, 0.01);
		
		const cone = new CylinderBufferGeometry( 0, 0.025, 0.05, 5, 1 );        
		const translation = new Matrix4();
		translation.setPosition(new Vector3(0, height, 0));
		cone.applyMatrix4(translation);

		translation.setPosition(new Vector3(0, height / 2, 0))
		line.applyMatrix4(translation);
		
		line.lookAt(direction);
		cone.lookAt(direction);
		
		translation.setPosition(origin);
		line.applyMatrix4(translation);
		cone.applyMatrix4(translation);
		this._setColor(line, color);
		this._setColor(cone, color);

		this.lines_buffer.push(line);
		this.cones_buffer.push(cone);
	}

	finalize() {
		const merged_lines = BufferGeometryUtils.mergeBufferGeometries(this.lines_buffer, false);
		const mesh_l = new Mesh(merged_lines, this.mat);
		const merged_cones = BufferGeometryUtils.mergeBufferGeometries(this.cones_buffer, false);
		const mesh_c = new Mesh(merged_cones, this.mat);

		this.lines_buffer = [];
		this.cones_buffer = [];

		const group = new Group();
		group.add(mesh_l);
		group.add(mesh_c);

		return group;
	}

	_setColor(object: BufferGeometry, color: number[]) {
		// make an array to store colors for each vertex
		const numVerts = object.getAttribute('position').count;
		const itemSize = 3;  // r, g, b
		const colors = new Uint8Array(itemSize * numVerts);

		// copy the color into the colors array for each vertex
		colors.forEach((v, ndx) => {
			colors[ndx] = color[ndx % 3];
		});

		const normalized = true;
		const colorAttrib = new BufferAttribute(colors, itemSize, normalized);
		object.setAttribute('color', colorAttrib);
	}
}