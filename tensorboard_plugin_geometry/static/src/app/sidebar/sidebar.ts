import Vue from 'vue';
import Component from 'vue-class-component';

import {ApiService} from '../api';
import { Settings } from '../settings';
import SliderComponent from '../slider/slider';
import WithRender from './sidebar.html';

import './sidebar.scss';

@WithRender
@Component({
  components: {
    slider: SliderComponent
  }
})
export default class SidebarComponent extends Vue {
  runs: string[] = [];
  colors: string[] = [];
  checked: boolean[] = [];
  display: boolean[] = [];
  settings = Settings;
  min_point_size = 0;
  max_point_size = 3;

  data = {
    point_size: 50,
    formatted_point_size: 1.5,
    exclusive: false,
    logdir: './',
    regex: '',
  }

  last_exclusive: string = '';

  mounted() {
    ApiService.getTags().then((res) => {
      Object.keys(res.data).forEach(run => {
        this.runs.push(run);
        this.checked.push(true);
        this.display.push(true);
      });
    });

    ApiService.getLogdir().then(res => {
      this.data.logdir = res.data.logdir;
    });

    this.settings.filteredRuns.next(this.runs.filter((val, id) => this.display[id] && this.checked[id]));
    console.log(this.settings.filteredRuns.value);
  }

  updated() {
    this.settings.filteredRuns.next(this.runs.filter((val, id) => this.display[id] && this.checked[id]));
  }

  updatePointSize(new_value) {
    new_value = this.getPointSize(new_value);
    this.data.formatted_point_size = this.getFormattedSize(new_value);
    this.settings.point_size.next(new_value);
  }

  updatePointSizeInput(new_value) {
    if (new_value > this.max_point_size) {
      new_value = this.max_point_size;
    }
    if (new_value < this.min_point_size) {
      new_value = this.min_point_size;
    }

    this.data.point_size = new_value / (this.max_point_size - this.min_point_size) * 100 - this.min_point_size;
    
    this.data.formatted_point_size = this.getFormattedSize(new_value);

    this.settings.point_size.next(new_value);
  }

  filterRuns() {
    this.display = this.runs.map(val => !!val.match(RegExp(this.data.regex)));
  }

  exclusify(run: string) {
    if (run && this.last_exclusive !== run) {
      this.last_exclusive = run;
      
      this.checked = this.runs.map(r => run == r);
    } 
  }

  toggleAll() {
    const checked = this.checked.reduce((allChecked, val) => val || allChecked, false);
    this.checked = this.runs.map(() => !checked);
    this.data.exclusive = false;
  }

  getPointSize(size: number) {
    return size / 100 * (this.max_point_size - this.min_point_size) + this.min_point_size;
  }

  getFormattedSize(value) {
    return parseFloat(value.toLocaleString('en', {maximumFractionDigits: 4}));
  }
} 