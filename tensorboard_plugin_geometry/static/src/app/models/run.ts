export interface Run {
  name: string;
  tag: string;
  samples: number;
  description: string;
}

export interface RunSidebar {
  name: string;
  display: boolean;
  checked: boolean;
  color: string;
}