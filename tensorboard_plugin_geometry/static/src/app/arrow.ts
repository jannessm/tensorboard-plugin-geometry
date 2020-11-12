import { BoxBufferGeometry, BufferAttribute, BufferGeometry, CylinderBufferGeometry, Group, Matrix4, Mesh, MeshBasicMaterial, Quaternion, Vector3 } from "three";
import { BufferGeometryUtils } from "./buffer-geometry-utils";

export class ArrowHelper {
	mat = new MeshBasicMaterial({ vertexColors: true });

	lines_buffer: BufferGeometry[] = [];
	cones_buffer: BufferGeometry[] = [];

	addArrowToBuffer(
		origin: Vector3,
		direction: Vector3,
		color: number[],
		max_len: number,
		normalized: boolean
	) {
		let height = direction.length();

		if (normalized) {
			height = height / max_len * 10;
		}
		
		//create geometries

		const line = new BoxBufferGeometry(0.1, height, 0.1);
		line.translate(0, - height / 2, 0);
		const cone = new CylinderBufferGeometry( 0, 0.025, 0.05, 5, 1 );
		
		// rotate in direction
		const translation = new Matrix4();
		const quaternation = new Quaternion().setFromUnitVectors(new Vector3(0,1,0), direction.clone().normalize());
		translation.makeRotationFromQuaternion(quaternation);
		
		// translate to origin
		if (normalized) {
			translation.setPosition(origin.add(direction.multiplyScalar(1 / max_len * 10)));
		} else {
			translation.setPosition(origin.add(direction));
		}
		
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