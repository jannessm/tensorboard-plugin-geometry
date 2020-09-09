import Vue from 'vue'
import Component from 'vue-class-component'

import {ApiService} from '../api';
import WithRender from './plot.html'

import './plot.scss';
import SliderComponent from '../slider/slider';

import {Scene} from 'three';

interface Tag {
  [run: string]: number // run: #(samples)
}

@WithRender
@Component({
  props: ['tag', 'run'],
  components: {
    slider: SliderComponent
  }
})
export default class PlotComponent extends Vue {
  tag_regex = '';
  data = {
    step: 0,
    total_steps: 0,
    wall_time: new Date(),
    wall_times: [],
  };

  constructor() {
    super();
    this.getData();
  }

  async getData() {
    await this.$nextTick;
    const res = await ApiService.getMetadata(this.$props.run.name, this.$props.tag);

    const vertices = res.data.filter(val => val.content_type === 1);
    this.data.total_steps = vertices.reduce((max, val) => max ? val.step < max : val.step , -9999999);
    this.data.wall_times = vertices.map(val => val.wall_time);
    
    this.updateStep(this.data.total_steps);
  }

  updateStep(new_value: number) {
    // update header
    this.data.step = new_value;
    this.data.wall_time = new Date(this.data.wall_times[new_value] * 1000);

    // update plot
    this.updatePlot(new_value, this.data.wall_times[new_value]);
  }

  async updatePlot(step: number, wall_time: number) {
    const res = await ApiService.getData(this.$props.run.name, this.$props.tag, step, wall_time);
    console.log(res);
  }
}