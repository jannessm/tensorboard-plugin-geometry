import { DataProvider } from "./data-provider";
import { StepData } from "./models/step";

class DataManagerClass {
  providers: { [run: string]: { [tag: string]: DataProvider } } = {};
  get_data_lock = Promise.resolve();


  // async getData(run: string, tag: string, step: number): Promise<StepData | undefined> {
  //   await this.get_data_lock;
  //   console.log('processing getData')
  //   let res;
  //   this.get_data_lock = new Promise<undefined>((resolve, reject) => {
  //     res = resolve;
  //   });

  //   const provider = DataManager.getProvider(run, tag);

  //   let data, error;
  //   if (!!provider) {
  //     try {
  //       data = provider.getData(step);
  //     } catch (e) {
  //       error = e;
  //     }
  //   }

  //   res();
  //   console.log('done processing');
  //   if (error) {
  //     throw error;
  //   }
  //   return data;
  // }

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