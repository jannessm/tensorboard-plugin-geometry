export interface Tag {
  name: string;
  samples: number;
}

export interface Tags {
  name: string;
  runs: Tag[];
  display: boolean;
  isRegex?: boolean;
}