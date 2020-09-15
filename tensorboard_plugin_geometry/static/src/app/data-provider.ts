import { ApiService } from "./api";
import { StepMetadata, ThreeConfig } from "./models/metadata";
import { CONTENT_TYPES } from "./models/content-types";
import { StepData } from "./models/step-data";
import { ThreeFactory } from "./three-factory";

class PendingPromise<T> {
  isPending = true;
  isRejected = false;
  internalPromise: Promise<T>;

  constructor(callback) {
    this.internalPromise = new Promise<T>(callback).then(val => {
      this.isPending = false;
      return val;
    }, (err) => {
      this.isRejected = true;
      this.isPending = false
      return err;
    });
  }

  state() {
    return this.isPending ? "pending" : this.isRejected ? "rejected" : "resolved";
  }

  then(func) {
    return this.internalPromise.then(func);
  }
}

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
    });

    this._res();
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
        geometry: ThreeFactory.createGeometry(
          this.steps_metadata[id].VERTICES.shape[1],
          data.vertices,
          this.steps_metadata[id].FACES.shape[1],
          data.faces),
        features: ThreeFactory.createFeatureArrows(
          this.steps_metadata[id].VERTICES.shape[1],
          data.vertices,
          data.features)
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