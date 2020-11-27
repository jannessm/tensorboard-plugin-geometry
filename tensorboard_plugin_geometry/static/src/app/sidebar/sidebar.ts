import Vue from 'vue';
import Component from 'vue-class-component';
import { DataManager } from '../data-manager';
import { loader } from '../loader';
import { Run } from '../models/run';

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
  runs: Run[] = [];
  colors: string[] = [];
  apply_regex:any = undefined;
  showSnackbar = false;
  settings = Settings;

  data = {
    point_size: 50,
    formatted_point_size: 5,
    exclusive: false,
    logdir: './',
    regex: '',
    show_vertices: true,
    show_wireframe: true,
    show_features: true,
    norm_features: true,
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

    Settings.show_vertices.subscribe(val => {
      if (this.data.show_vertices !== val) {
        this.data.show_vertices = val;
      }
    });
    Settings.show_features.subscribe(val => {
      if (this.data.show_features !== val) {
        this.data.show_features = val;
      }
    });
    Settings.show_wireframe.subscribe(val => {
      if (this.data.show_wireframe !== val) {
        this.data.show_wireframe = val;
      }
    });
  }

  updatePointSize(new_value) {
    new_value = this.getPointSize(new_value);
    this.data.formatted_point_size = this.getFormattedSize(new_value);
    Settings.point_size.next(new_value);
  }

  updatePointSizeInput(new_value) {
    if (new_value > Settings.max_point_size) {
      new_value = Settings.max_point_size;
    }
    if (new_value < Settings.min_point_size) {
      new_value = Settings.min_point_size;
    }

    this.data.point_size = new_value / (Settings.max_point_size - Settings.min_point_size) * 100 - Settings.min_point_size;
    
    this.data.formatted_point_size = this.getFormattedSize(new_value);

    Settings.point_size.next(new_value);
  }

  filterRuns() {
    if (this.apply_regex) {
      clearTimeout(this.apply_regex);
    }
    this.apply_regex = setTimeout(() => {
      this.runs.forEach(r => r.display = !!r.name.match(RegExp(this.data.regex)));
      loader.runs.next(this.runs);
      loader.regexInput.next(this.data.regex);
      URLParser.setUrlParam('regexInput', this.data.regex);
    }, 500);
  }

  checkboxChange(run: Run) {
    this.data.exclusive = false;
    loader.setVisibilityForRun(run.name, run.selected);
    loader.updateRunStates();
  }

  exclusify(run: Run) {
    this.runs.forEach(r => {
      loader.setVisibilityForRun(r.name, r.name === run.name);
    });
    loader.updateRunStates();
  }

  toggleAll() {
    const oneIsSelected = this.runs.reduce((oneIsSelected, r) => r.selected || oneIsSelected, false);
    this.runs.forEach(r => loader.setVisibilityForRun(r.name, !oneIsSelected));
    this.data.exclusive = false;
    loader.updateRunStates();
  }

  getPointSize(size: number) {
    return size / 100 * (Settings.max_point_size - Settings.min_point_size) + Settings.min_point_size;
  }

  getFormattedSize(value) {
    return parseFloat(value.toLocaleString('en', {maximumFractionDigits: 4}));
  }
} 