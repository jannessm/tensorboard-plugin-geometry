export interface StepMetadata {
  step: number;
  wall_time: number;
  description: string;
  config: ThreeConfig;
  VERTICES: Metadata;
  VERT_COLORS: Metadata;
  FACES: Metadata;
  FEATURES: Metadata;
  FEAT_COLORS: Metadata;
}

interface Metadata {
  shape: number[];
}

export interface ThreeConfig {
  camera?: PerspectiveCameraConfig | OrthograficCameraConfig;
}

export interface PerspectiveCameraConfig {
  fov?: number;
  aspect?: number;
  near?: number;
  far?: number;
}

export interface OrthograficCameraConfig {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  near?: number;
  far?: number;
}