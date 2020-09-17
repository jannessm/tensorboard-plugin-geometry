import { Run } from "./run";

export interface RawTags {
  [run: string]: {
    [tag: string]: {
      samples: number;
      description: string;
    }
  }
}

export interface Tags {
  name: string;
  runs: Run[];
  tag_names?: string[];
  display: boolean;
  isRegex?: boolean;
}