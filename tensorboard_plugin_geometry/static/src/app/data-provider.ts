import { ApiService } from "./api";
import { StepMetadata, ThreeConfig } from "./models/metadata";
import { CONTENT_TYPES } from "./models/content-types";
import { StepData } from "./models/step-data";

export class DataProvider {
  run = '';
  tag = '';
  steps: number[] = [];
  steps_metadata: StepMetadata[] = [];
  steps_data: (StepData | undefined)[] = [];
  
  constructor() {}

  async init(run: string, tag: string) {
    this.run = run;
    this.tag = tag;
    const res = await ApiService.getMetadata(this.run, this.tag);

    this.steps = res.data.map(val => val.step).filter((val, id, arr) => arr.indexOf(val) === id);
    for (let i = 0; i < this.steps.length; i++) {
      this.steps_metadata.push(this.initStepMetadata());
      this.steps_data.push(undefined);
    }
    
    res.data.forEach(val => {
      const id = this.steps.findIndex(step => val.step === step);
      this.steps_metadata[id].step = val.step;
      this.steps_metadata[id].wall_time = val.wall_time;
      this.steps_metadata[id].config = JSON.parse(val.config);
      this.steps_metadata[id][CONTENT_TYPES[val.content_type]].shape = val.data_shape;
    });
  }

  initStepMetadata(): StepMetadata {
    return {
      wall_time: 0,
      step: 1,
      config: {},
      VERTICES: {shape: []},
      FEATURES: {shape: []},
      FACES: {shape: []},
    };
  }

  async getData(id: number): Promise<StepData | undefined> {
    if (!this.steps_data[id] && !!id) {
      const data = await ApiService.getData(this.run, this.tag, this.steps[id], this.getWalltimeById(id));

      this.steps_data[id] = {
        vertices: this.reshape3D(data.vertices, this.steps_metadata[id].VERTICES.shape),
        faces: this.reshape3D(data.faces, this.steps_metadata[id].FACES.shape),
        features: this.reshape3D(data.features, this.steps_metadata[id].FEATURES.shape)
      }
    }

    return this.steps_data[id];
  }

  getConfigById(id: number): ThreeConfig {
    return this.steps_metadata[id]?.config;
  }

  getWalltimeById(id: number): number {
    return this.steps_metadata[id].wall_time;
  }

  reshape3D(data: Float32Array | Uint32Array, shape: number[]): number[][][] {
    if (shape.length !== 3 && data.length > 0) {
      throw Error('only can reshape 3D arrays!');
    }

    // const iter = data.entries();
    const arr: number[][][] = [];

    for (let i = 0; i < shape[0] ; i++) {
      const arr1: number[][] = [];
      for (let j = 0; j < shape[1]; j++) {
        const arr2: number[] = [];
        for (let k = 0; k < shape[2]; k++) {
          arr2.push(data[i * shape[1] + j * shape[2] + k]);
        }
        arr1.push(arr2);
      }
      arr.push(arr1);
    }

    return arr;
  }
}