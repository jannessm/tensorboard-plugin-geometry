import { Group, Points } from "three";
import { Metadata, ThreeConfig } from "./metadata";

export interface StepMetadata {
  step: number;
  wall_time: number;
  description: string;
  config: ThreeConfig;
  VERTICES: Metadata;
  VERT_COLORS: Metadata;
  FACES: Metadata;
  FACE_COLORS: Metadata;
  FEATURES: Metadata;
  FEAT_COLORS: Metadata;
}

export interface StepData {
  geometry?: Points | Group;
  features?: Group;
}

export interface RawStep {
  wall_time: number;
  step: number;
  content_type: number;
  components: number;
  config: string;
  data_shape: number[];
  description: string;
}

export interface Steps {
  steps: {
    [step_id: number]: {
      first_wall_time: number;
      VERTICES: Metadata;
      VERT_COLORS: Metadata;
      FACES: Metadata;
      FACE_COLORS: Metadata;
      FEATURES: Metadata;
      FEAT_COLORS: Metadata;
    }
  }
  config?: ThreeConfig; // are always the same for all steps
  description?: string; // same here
}