import { ApiService } from "./api";
import { Metadata, ThreeConfig } from "./models/metadata";
import { CONTENT_TYPES } from "./models/content-types";
import { StepData, StepMetadata, Steps } from "./models/step";
import { ThreeFactory } from "./three-factory";
import { Observeable } from "./models/observeable";

export class DataProvider {

  run = '';
  tag = '';
  steps: Steps = {};
  steps_metadata = new Observeable<StepMetadata[]>([]);
  steps_data: (StepData | undefined)[] = [];
  
  constructor() {}

  async init(run: string, tag: string) {
    this.run = run;
    this.tag = tag;
    this._updateMetaData();
  }

  private async _updateMetaData() {
    const res = await ApiService.getMetadata(this.run, this.tag);

    // save rawSteps
    res.data.forEach(step => {
      this.steps.config = this.steps.config || JSON.parse(step.config);
      this.steps.description = this.steps.description || JSON.parse(step.config);
      this.steps.steps[step.step].first_wall_time = Math.min(
        step.wall_time,
        this.steps.steps[step.step].first_wall_time);
      this.steps.steps[step.step][CONTENT_TYPES[step.content_type]].shape = step.data_shape;
      this.steps.steps[step.step][CONTENT_TYPES[step.content_type]].wall_time = step.wall_time;
    });
  }

  private _addStep(): {

  }

  private _initStepMetadata(): StepMetadata {
    return {
      wall_time: 0,
      step: 1,
      description: '',
      config: {},
      VERTICES: this.initMetaData(),
      VERT_COLORS: this.initMetaData(),
      FACES: this.initMetaData(),
      FACE_COLORS: this.initMetaData(),
      FEATURES: this.initMetaData(),
      FEAT_COLORS: this.initMetaData(),
    };
  }

  initMetaData(): Metadata {
    return {
      shape: [],
      wall_time: 0
    }
  }

  async getData(id: number): Promise<StepData | undefined> {
    if (!this.steps_data[id] && id >= 0) {
      const data = await ApiService.getData(this.run, this.tag, this.steps[id], this.steps_metadata[id]);

      this.steps_data[id] = {
        geometry: ThreeFactory.createGeometry(
          this.steps_metadata[id].VERTICES.shape,
          data.vertices,
          this.steps_metadata[id].FACES.shape,
          data.faces,
          this.steps_metadata[id].FACE_COLORS.shape,
          data.face_colors,
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