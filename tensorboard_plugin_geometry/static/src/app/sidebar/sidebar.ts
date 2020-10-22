import Vue from 'vue';
import Component from 'vue-class-component';
import { DataManager } from '../data-manager';
import { loader } from '../loader';
import { RunSidebar } from '../models/run';

import { Settings } from '../settings';
import SliderComponent from '../slider/slider';
import { URLParser } from '../url-parser';
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
  apply_regex:any = undefined;
  showSnackbar = false;

  data = {
    point_size: 50,
    formatted_point_size: 5,
    exclusive: false,
    logdir: './',
    regex: '',
    show_vertices: true,
    show_wireframe: true,
    show_features: true,
  }

  mounted() {
    loader.runs.subscribe(runs => {
      this.runs = runs;
    });

    loader.logdir.subscribe(logdir => {
      this.data.logdir = logdir
    });

    loader.regexInput.subscribe(regex => {
      if (this.data.regex !== regex) {
        this.data.regex = regex;
      }
    });

    loader.reloadContainer.isReloading$.subscribe(async (loading) => {
      if (loading) {
        await DataManager.updateProviders();
      }
    });

    this.settings.show_vertices.subscribe(val => {
      if (this.data.show_vertices !== val) {
        this.data.show_vertices = val;
      }
    });
    this.settings.show_features.subscribe(val => {
      if (this.data.show_features !== val) {
        this.data.show_features = val;
      }
    });
    this.settings.show_wireframe.subscribe(val => {
      if (this.data.show_wireframe !== val) {
        this.data.show_wireframe = val;
      }
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
    if (this.apply_regex) {
      clearTimeout(this.apply_regex);
    }
    this.apply_regex = setTimeout(() => {
      this.runs.forEach(val => val.display = !!val.name.match(RegExp(this.data.regex)));
      loader.runs.next(this.runs);
      loader.regexInput.next(this.data.regex);
      URLParser.setUrlParam('regexInput', this.data.regex);
    }, 500);
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
} 