import { RawStep } from "./step";
import { RawTags } from "./tag";

export interface TagsResponse {
  data: RawTags
}

export interface MetadataResponse {
  data: RawStep[];
}

