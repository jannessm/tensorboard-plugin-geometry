import Vue from 'vue';
import Component from 'vue-class-component';
import { loader } from '../loader';
import { RunSidebar } from '../models/run';

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
  runs: RunSidebar[] = [];
  colors: string[] = [];
  settings = Settings;

  data = {
    auto_load: false,
    loading: false,
    point_size: 50,
    formatted_point_size: 5,
    exclusive: false,
    logdir: './',
    regex: '',
  }

  mounted() {
    loader.runs.subscribe(runs => {
      this.runs = runs;
    });

    loader.logdir.subscribe(logdir => {
      this.data.logdir = logdir
    });
  }

  updated() {
    loader.runs.next(this.runs);
  }

  updatePointSize(new_value) {
    new_value = this.getPointSize(new_value);
    this.data.formatted_point_size = this.getFormattedSize(new_value);
    this.settings.point_size.next(new_value);
  }

  updatePointSizeInput(new_value) {
    if (new_value > this.settings.max_point_size) {
      new_value = this.settings.max_point_size;
    }
    if (new_value < this.settings.min_point_size) {
      new_value = this.settings.min_point_size;
    }

    this.data.point_size = new_value / (this.settings.max_point_size - this.settings.min_point_size) * 100 - this.settings.min_point_size;
    
    this.data.formatted_point_size = this.getFormattedSize(new_value);

    this.settings.point_size.next(new_value);
  }

  filterRuns() {
    this.runs.forEach(val => val.display = !!val.name.match(RegExp(this.data.regex)));
    loader.runs.next(this.runs);
  }

  exclusify(run: RunSidebar) {
    this.runs.forEach(r => {
      r.checked = (run.name == r.name);
    });
    loader.runs.next(this.runs);
  }

  toggleAll() {
    const checked = this.runs.reduce((allChecked, val) => val.checked || allChecked, false);
    this.runs.forEach(val => val.checked = !checked);
    this.data.exclusive = false;
    loader.runs.next(this.runs);
  }

  getPointSize(size: number) {
    return size / 100 * (this.settings.max_point_size - this.settings.min_point_size) + this.settings.min_point_size;
  }

  getFormattedSize(value) {
    return parseFloat(value.toLocaleString('en', {maximumFractionDigits: 4}));
  }

  async updateData() {
    this.data.loading = true;
    await loader.reload();
    this.data.loading = false;
  }
} 