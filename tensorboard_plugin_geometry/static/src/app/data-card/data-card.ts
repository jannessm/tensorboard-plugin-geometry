import Vue from 'vue'
import Component from 'vue-class-component'

import {ApiService} from '../api';
import WithRender from './data-card.html'

import './data-card.scss';


interface Tag {
  [run: string]: number // run: #(samples)
}

@WithRender
@Component({
  props: ['name', 'tag']
})
export default class DataCardComponent extends Vue {
  tag_regex = '';

  constructor() {
    super();
  }
}