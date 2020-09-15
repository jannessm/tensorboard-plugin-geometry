import Vue from 'vue';
import Component from 'vue-class-component';

import {ApiService} from '../api';
import { Settings } from '../settings';
import WithRender from './sidebar.html';

import './sidebar.scss';

@WithRender
@Component({
})
export default class SidebarComponent extends Vue {
  runs: string[] = [];
  colors: string[] = [];
  checked: boolean[] = [];
  display: boolean[] = [];
  settings = Settings;

  data = {
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
  }

  updated() {
    this.settings.filteredRuns = this.runs.filter((val, id) => this.display[id] && this.checked[id]);
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
}