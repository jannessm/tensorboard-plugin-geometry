import { DataProvider } from "./data-provider";
import { StepData } from "./models/step";

class DataManagerClass {
  providers: { [run: string]: { [tag: string]: DataProvider } } = {};
  get_data_lock = Promise.resolve();

  getProvider(run: string, tag: string) {
    if (typeof(run) !== 'string' || typeof(tag) !== 'string') {
      return;
    }
    
    if (!this.providers[run]) {
      Object.assign(this.providers, { [run]: {}});
    }
    
    if (!this.providers[run][tag]) {
      const provider = new DataProvider();
      provider.init(run, tag);
      Object.assign(this.providers[run], {[tag]: provider});
    }

    return this.providers[run][tag];
  }

  async updateProviders() {
    Object.keys(this.providers).forEach(run => {
      Object.values(this.providers[run]).forEach(provider => {
        provider.updateMetaData();
      })
    });
  }
}

export const DataManager = new DataManagerClass();