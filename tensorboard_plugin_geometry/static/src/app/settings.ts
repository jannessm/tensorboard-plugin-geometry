import { Observeable } from "./models/observeable";

class SettingsClass {
  point_size = new Observeable<number>(1.5);
  filteredRuns = new Observeable<string[]>([]);

  display(run: string): boolean {
    return this.filteredRuns.value.filter((val) => run === val).length > 0;
  }
}

export const Settings = new SettingsClass();