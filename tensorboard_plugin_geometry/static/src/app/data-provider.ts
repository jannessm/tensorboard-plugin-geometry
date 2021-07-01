import { ApiService } from "./api";
import { ThreeConfig } from "./models/metadata";
import { CONTENT_TYPES } from "./models/content-types";
import { StepData, Steps } from "./models/step";
import { ThreeFactory } from "./three-factory";
import { Observeable } from "./models/observeable";
import { Settings } from "./settings";

export class DataProvider {

  run = '';
  tag = '';
  steps_metadata = new Observeable<Steps>({ steps: {}, step_ids: [] });
  steps_data: (StepData | undefined)[] = [];
  norm_steps_data: (StepData | undefined)[] = [];
  current_step_id = -1;
  
  constructor() {}

  async init(run: string, tag: string) {
    this.run = run;
    this.tag = tag;
    this.updateMetaData();
  }

  async updateMetaData() {
    const res = await ApiService.getMetadata(this.run, this.tag);
    // save steps
    const steps: Steps = { steps: {}, step_ids: [] };
    res.data.forEach(step => {
      if (!steps.config && typeof step.config == 'string') {
        steps.config = JSON.parse(step.config);
      } else if (!steps.config && typeof step.config == 'object') {
        steps.config = step.config;
      }
      steps.description = step.description;
      
      if (!steps.steps[step.step]) {
        steps.steps[step.step] = {
          first_wall_time: Infinity,
        }
      }
      steps.steps[step.step].first_wall_time = Math.min(
        step.wall_time,
        steps.steps[step.step].first_wall_time);

      if (!steps.steps[step.step][CONTENT_TYPES[step.content_type]]) {
        steps.steps[step.step][CONTENT_TYPES[step.content_type]] = {shape: [], wall_time: 0};
      }

      steps.steps[step.step][CONTENT_TYPES[step.content_type]].shape = step.data_shape;
      steps.steps[step.step][CONTENT_TYPES[step.content_type]].wall_time = step.wall_time;
    });
      
    steps.step_ids = Object.keys(steps.steps).map(val => parseInt(val)).sort((a, b) => a - b);
      
    if (
      // config changed
      (steps.config !== this.steps_metadata.value.config) ||
      // description changed
      (steps.description !== this.steps_metadata.value.description) ||
      // step ids changed
      this._array_equal(steps.step_ids, this.steps_metadata.value.step_ids) ||
      // new content_types
      this._new_content_types(steps, this.steps_metadata.value)
    ) {
      this.steps_metadata.next(steps);
    }
  }

  async getData(id: undefined | number = undefined, isBufferCall = false): Promise<StepData | undefined> {
    if (!id) {
      id = this.steps_metadata.value.step_ids[this.current_step_id];
    }
    const normalize = Settings.norm_features.value;
    const this_data = Settings.norm_features.value ? this.norm_steps_data : this.steps_data;
    const last_step_id = this.steps_metadata.value.step_ids.length - 1;

    // buffer geo
    if (this.current_step_id > 0 && !isBufferCall) {
      this.getData(this.steps_metadata.value.step_ids[this.current_step_id - 1], true);
    }
    if (this.current_step_id < last_step_id && !isBufferCall) {
      this.getData(this.steps_metadata.value.step_ids[this.current_step_id + 1], true);
    }
    if (this.current_step_id > 9 && !isBufferCall) {
      delete this_data[this.current_step_id - 10];
    }
    if (this.current_step_id < last_step_id - 10 && !isBufferCall) {
      delete this_data[this.current_step_id + 10];
    }
    
    if (!this_data[id] && id >= 0) {
      const data = await ApiService.getData(this.run, this.tag, id, this.steps_metadata.value.steps[id]);

      if (!data.vertices || !this.steps_metadata.value.steps[id].VERTICES) {
        throw Error(`No vertices available for run ${this.run}, tag ${this.tag}, and step ${id}.`);
      }
      
      const resp: StepData = {
        raw_data: data,
        broken: true
      };
      
      this_data[id] = resp;

      const geo = ThreeFactory.createGeometry(
        this.steps_metadata.value.steps[id].VERTICES?.shape,
        data.vertices,
        this.steps_metadata.value.steps[id].FACES?.shape,
        data.faces,
        this.steps_metadata.value.steps[id].FACE_COLORS?.shape,
        data.face_colors,
        data.vert_colors,
        this.steps_metadata.value.config,
        normalize);
      resp['geometry'] = geo;


      if (!!data.features) {
        const feats = ThreeFactory.createFeatureArrows(
          this.steps_metadata.value.steps[id].VERTICES?.shape,
          data.vertices,
          data.features,
          data.feat_colors,
          this.steps_metadata.value.config,
          normalize);
        resp['features'] = feats?.features;
        resp['max_magnitude'] = feats?.max_magnitude;
      }

      resp.broken = false;
      
      this_data[id] = resp;
    }

    return this_data[id];
  }

  getConfigById(id: number): ThreeConfig {
    return this.steps_metadata[id]?.config;
  }

  getWalltimeById(id: number): number {
    return this.steps_metadata[id].wall_time;
  }

  private _array_equal(arr1: number[], arr2: number[]): boolean {
    if (arr1.length !== arr2.length) {
      return false;
    }

    return arr1.map((val, id) => val === arr2[id])
      .reduce((is_eq, val) => val || is_eq, false);
  }

  private _new_content_types(new_steps: Steps, old_steps: Steps): boolean {
    return !Object.keys(old_steps.steps).reduce((new_content_type, step_id) => 
      new_content_type ||
      (!!new_steps.steps[step_id].VERTICES && !!old_steps.steps[step_id].VERTICES) ||
      (!!new_steps.steps[step_id].VERT_COLORS && !!old_steps.steps[step_id].VERT_COLORS) ||
      (!!new_steps.steps[step_id].FACES && !!old_steps.steps[step_id].FACES) ||
      (!!new_steps.steps[step_id].FACE_COLORS && !!old_steps.steps[step_id].FACE_COLORS) ||
      (!!new_steps.steps[step_id].FEATURES && !!old_steps.steps[step_id].FEATURES) ||
      (!!new_steps.steps[step_id].FEAT_COLORS && !!old_steps.steps[step_id].FEAT_COLORS)
    , false);
  }
}