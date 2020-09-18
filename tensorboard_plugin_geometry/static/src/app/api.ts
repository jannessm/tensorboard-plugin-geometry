import 'axios';
import Axios from 'axios';
import { StepMetadata } from './models/step';
import { DataResponse, MetadataResponse, TagsResponse } from './models/responses';

export class ApiService {
  static base_path = '/data/plugin/geometries/';
  
  static async getTags(): Promise<TagsResponse> {
    return await Axios.get('./tags') as TagsResponse;
  }

  static async getLogdir() {
    return await Axios.get('./logdir');
  }

  static async getMetadata(run: string, tag: string): Promise<MetadataResponse> {
    return await Axios.get(`./geometries?tag=${tag}&run=${run}`);
  }

  static async getData(run: string, tag: string, step: number, meta_data: StepMetadata): Promise<DataResponse> {
    const resp: DataResponse = {};
    if (meta_data.VERTICES) {
      resp['vertices'] = await ApiService.getVertices(run, tag, step, meta_data.VERTICES.wall_time);
    }
    if (meta_data.VERT_COLORS) {
      resp['vert_colors'] = await ApiService.getVertColors(run, tag, step, meta_data.VERT_COLORS.wall_time);
    }
    if (meta_data.FEATURES) {
      resp['features'] = await ApiService.getFeatures(run, tag, step, meta_data.FEATURES.wall_time);
    }
    if (meta_data.FEAT_COLORS) {
      resp['feat_colors'] = await ApiService.getFeatColors(run, tag, step, meta_data.FEAT_COLORS.wall_time);
    }
    if (meta_data.FACES) {
      resp['faces'] = await ApiService.getFaces(run, tag, step, meta_data.FACES.wall_time);
    }
    if (meta_data.FACE_COLORS) {
      resp['face_colors'] = await ApiService.getFaceColors(run, tag, step, meta_data.FACE_COLORS.wall_time);
    }
    return resp;
  }
  
  static async getVertices(run: string, tag: string, step: number, wall_time: number) {
    const buffer = await Axios.get(`./data?tag=${tag}&run=${run}&step=${step}&content_type=VERTICES&timestamp=${wall_time}`, {
      responseType: 'arraybuffer'
    });

    return new Float32Array(buffer.data as ArrayBuffer);
  }

  static async getVertColors(run: string, tag: string, step: number, wall_time: number) {
    const buffer = await Axios.get(`./data?tag=${tag}&run=${run}&step=${step}&content_type=VERT_COLORS&timestamp=${wall_time}`, {
      responseType: 'arraybuffer'
    });

    return new Uint8Array(buffer.data as ArrayBuffer);
  }

  static async getFeatures(run: string, tag: string, step: number, wall_time: number) {
    const buffer = await Axios.get(`./data?tag=${tag}&run=${run}&step=${step}&content_type=FEATURES&timestamp=${wall_time}`, {
      responseType: 'arraybuffer'
    });

    return new Float32Array(buffer.data as ArrayBuffer);
  }

  static async getFeatColors(run: string, tag: string, step: number, wall_time: number) {
    const buffer = await Axios.get(`./data?tag=${tag}&run=${run}&step=${step}&content_type=FEAT_COLORS&timestamp=${wall_time}`, {
      responseType: 'arraybuffer'
    });

    return new Uint8Array(buffer.data as ArrayBuffer);
  }

  static async getFaces(run: string, tag: string, step: number, wall_time: number) {
    const buffer = await Axios.get(`./data?tag=${tag}&run=${run}&step=${step}&content_type=FACES&timestamp=${wall_time}`, {
      responseType: 'arraybuffer'
    });

    return new Uint32Array(buffer.data as ArrayBuffer);
  }

  static async getFaceColors(run: string, tag: string, step: number, wall_time: number) {
    const buffer = await Axios.get(`./data?tag=${tag}&run=${run}&step=${step}&content_type=FACE_COLORS&timestamp=${wall_time}`, {
      responseType: 'arraybuffer'
    });

    return new Uint8Array(buffer.data as ArrayBuffer);
  }
}
