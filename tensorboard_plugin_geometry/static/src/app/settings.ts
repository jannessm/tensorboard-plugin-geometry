import { Observeable } from "./models/observeable";

class SettingsClass {
  point_size = new Observeable<number>(5);
  max_point_size = 10;
  min_point_size = 0;
}

export const Settings = new SettingsClass();