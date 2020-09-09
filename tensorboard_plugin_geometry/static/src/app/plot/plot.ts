import Vue from 'vue'
import Component from 'vue-class-component'

import {ApiService} from '../api';
import WithRender from './plot.html'

import './plot.scss';
import SliderComponent from '../slider/slider';


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
  step = 1;
  walltime = Date();

  constructor() {
    super();
  }

  updateStep(new_value: number) {
    this.step = new_value;
  }
}