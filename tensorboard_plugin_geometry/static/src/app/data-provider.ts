import { ApiService } from "./api";
import { StepMetadata } from "./models/metadata";
import { CONTENT_TYPES } from "./models/content-types";

export class DataProvider {
  run = '';
  tag = '';
  steps: number[] = [];
  steps_metadata: StepMetadata[] = [];
  
  constructor() {}

  async init(run: string, tag: string) {
    this.run = run;
    this.tag = tag;
    const res = await ApiService.getMetadata(this.run, this.tag);

    this.steps = res.data.map(val => val.step).filter((val, id, arr) => arr.indexOf(val) === id);
    for (let i = 0; i < this.steps.length; i++) {
      this.steps_metadata.push(this.initStepMetadata());
    }
    
    res.data.forEach(val => {
      const id = this.getStepId(val.step);
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

  getWalltime(step: number): number {
    return this.steps_metadata[this.getStepId(step)].wall_time;
  }

  getStepId(step: number): number {
    return this.steps.findIndex(val => val === step);
  }
}