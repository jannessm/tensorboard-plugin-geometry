export interface Tag {
  name: string;
  samples: number;
}

export interface Tags {
  name: string;
  runs: Tag[];
  tag_names?: string[];
  display: boolean;
  isRegex?: boolean;
}