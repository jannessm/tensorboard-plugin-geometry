import Vue from 'vue'
import Component from 'vue-class-component'

import {ApiService} from '../api';
import WithRender from './plot.html'

import './plot.scss';
import SliderComponent from '../slider/slider';

import {Scene, VectorKeyframeTrack} from 'three';

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
  walltime = Date();
  data = {
    step: 0,
    total_steps: 0
  };

  constructor() {
    super();
    this.getData();
  }

  async getData() {
    await this.$nextTick;
    const res = await ApiService.getMetadata(this.$props.run.name, this.$props.tag);

    this.data.total_steps = res.data.filter(val => val.content_type === 1).reduce((max, val) => max ? val.step < max : val.step , -9999999);
    this.data.step = this.data.total_steps;
  }

  updateStep(new_value: number) {
    this.data.step = new_value;
  }
}