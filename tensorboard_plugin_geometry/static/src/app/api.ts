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
}
