import 'axios';
import Axios from 'axios';

export class ApiService {
  static base_path = '/data/plugin/geometries/';
  
  static async getTags() {
    return await Axios.get('./tags');
  }

  static async getLogdir() {
    return await Axios.get('./logdir');
  }

  static async getMetadata(run: string, tag: string) {
    return await Axios.get(`./geometries?tag=${tag}&run=${run}&sample=0`);
  }
}
