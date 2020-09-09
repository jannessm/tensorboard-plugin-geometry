import Vue from 'vue'
import Component from 'vue-class-component'

import {ApiService} from '../api';
import WithRender from './plot.html'

import './plot.scss';


interface Tag {
  [run: string]: number // run: #(samples)
}

@WithRender
@Component({
  props: ['tag', 'run']
})
export default class PlotComponent extends Vue {
  tag_regex = '';

  constructor() {
    super();
  }
}