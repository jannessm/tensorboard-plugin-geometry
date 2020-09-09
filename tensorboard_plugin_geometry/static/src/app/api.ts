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
    return await Axios.get(`./geometries?tag=${tag}&run=${run}`);
  }

  static async getData(run: string, tag: string, step: number, wall_time: number) {
    return {
      vertices: await ApiService.getVertices(run, tag, step, wall_time),
      features: await ApiService.getFeatures(run, tag, step, wall_time),
      faces: await ApiService.getFaces(run, tag, step, wall_time)
    };
  }
  
  static async getVertices(run: string, tag: string, step: number, wall_time: number) {
    const buffer = await Axios.get(`./data?tag=${tag}&run=${run}&step=${step}&content_type=VERTICES&timestamp=${wall_time}`, {
      responseType: 'arraybuffer'
    });

    return new Float32Array(buffer.data as ArrayBuffer);
  }

  static async getFeatures(run: string, tag: string, step: number, wall_time: number) {
    const buffer = await Axios.get(`./data?tag=${tag}&run=${run}&step=${step}&content_type=FEATURES&timestamp=${wall_time}`, {
      responseType: 'arraybuffer'
    });

    return new Float32Array(buffer.data as ArrayBuffer);
  }

  static async getFaces(run: string, tag: string, step: number, wall_time: number) {
    const buffer = await Axios.get(`./data?tag=${tag}&run=${run}&step=${step}&content_type=FACES&timestamp=${wall_time}`, {
      responseType: 'arraybuffer'
    });

    return new Uint32Array(buffer.data as ArrayBuffer);
  }
}
