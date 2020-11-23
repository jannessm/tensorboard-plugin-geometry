export interface RawTagCollection {
  [tag: string]: RawTag;
}

export interface RawTag {
  samples: number;
  description: string;
}

export interface TagCollection {
  [tag: string]: Tag;
}

export interface Tag {
  name: string;
  description: string;
  samples: number;
}

export interface TagCard {
  name: string;
  isRegex: boolean;
  display: boolean;
  expanded: boolean;
  runs: string[];
}