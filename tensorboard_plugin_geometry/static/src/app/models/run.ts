import { RawTagCollection, TagCollection } from "./tag";

export interface RawRuns {
  [run: string]: RawTagCollection;
}

export interface Run {
  name: string;
  tags: TagCollection;
  display: boolean;
  selected: boolean;
  color: string;
}