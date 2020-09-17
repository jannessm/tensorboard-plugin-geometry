import { ApiService } from "./api";
import { StepMetadata, ThreeConfig } from "./models/metadata";
import { CONTENT_TYPES } from "./models/content-types";
import { StepData } from "./models/step-data";
import { PendingPromise } from "./models/pending-promise";
import { ThreeFactory } from "./three-factory";

export class DataProvider {
  initialized: PendingPromise<void>;
  _res = () => {};

  run = '';
  tag = '';
  steps: number[] = [];
  steps_metadata: StepMetadata[] = [];
  steps_data: (StepData | undefined)[] = [];
  
  constructor() {
    this.initialized = new PendingPromise<void>(res => {this._res = res});
  }

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
      this.steps_metadata[id].description = val.description;
    });

    this._res();
  }

  initStepMetadata(): StepMetadata {
    return {
      wall_time: 0,
      step: 1,
      description: '',
      config: {},
      VERTICES: {shape: []},
      VERT_COLORS: {shape: []},
      FACES: {shape: []},
      FEATURES: {shape: []},
      FEAT_COLORS: {shape: []},
    };
  }

  async getData(id: number): Promise<StepData | undefined> {
    if (!this.steps_data[id] && !!id) {
      const data = await ApiService.getData(this.run, this.tag, this.steps[id], this.getWalltimeById(id));

      this.steps_data[id] = {
        geometry: ThreeFactory.createGeometry(
          this.steps_metadata[id].VERTICES.shape,
          data.vertices,
          this.steps_metadata[id].FACES.shape,
          data.faces,
          data.vert_colors,
          this.steps_metadata[id].config),
        features: ThreeFactory.createFeatureArrows(
          this.steps_metadata[id].VERTICES.shape,
          data.vertices,
          data.features,
          data.feat_colors,
          this.steps_metadata[id].config)
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
}