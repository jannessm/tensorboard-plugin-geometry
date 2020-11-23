import { RawRuns } from "./run";
import { RawStep } from "./step";

export interface TagsResponse {
  data: RawRuns
}

export interface MetadataResponse {
  data: RawStep[];
}

export interface DataResponse {
  vertices?: Float32Array;
  vert_colors?: Uint8Array;
  features?: Float32Array;
  feat_colors?: Uint8Array;
  faces?: Uint32Array;
  face_colors?: Uint8Array;
}

