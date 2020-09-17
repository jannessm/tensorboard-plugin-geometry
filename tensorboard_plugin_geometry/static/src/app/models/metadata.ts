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

export interface Metadata {
  shape: number[];
  wall_time: number;
}

export interface ThreeConfig {
  vertices_cmap?: string;
  features_cmap?: string;
  mesh_color?: number[];
  camera?: PerspectiveCameraConfig | OrthograficCameraConfig;
  scene?: {
    background_color: number[];
  };
}

export enum CAMERA_TYPE {
  PERSPECTIVE = 'perspective',
  ORTHOGRAFIC = 'orthografic'
}

export interface CameraConfig {
  type?: string;
  position?: number[];
  far?: number;
  near?: number;
}

export interface PerspectiveCameraConfig extends CameraConfig {
  fov?: number;
}

export interface OrthograficCameraConfig extends CameraConfig {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}