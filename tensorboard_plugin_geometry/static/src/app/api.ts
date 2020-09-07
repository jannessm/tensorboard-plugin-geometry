import 'axios';
import Axios from 'axios';

export class ApiService {
  base_path = '/data/plugin/geometries/';
  
  async getTags() {
    return await Axios.get('./tags');
  }

  async getLogdir() {
    return await Axios.get('./logdir');
  }
}
