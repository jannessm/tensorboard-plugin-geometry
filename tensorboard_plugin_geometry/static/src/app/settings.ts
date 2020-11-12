import { Observeable } from "./models/observeable";

class SettingsClass {
  point_size = new Observeable<number>(5);
  max_point_size = 10;
  min_point_size = 0;

  show_features = new Observeable<boolean>(true);
  show_vertices = new Observeable<boolean>(true);
  show_wireframe = new Observeable<boolean>(false);
  norm_features = new Observeable<boolean>(true);
}

export const Settings = new SettingsClass();