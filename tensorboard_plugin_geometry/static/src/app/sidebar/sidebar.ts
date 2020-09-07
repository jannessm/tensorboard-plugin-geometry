import Vue from 'vue';
import Component from 'vue-class-component';

import {ApiService} from '../api';
import WithRender from './sidebar.html';

import './sidebar.scss';

// The @Component decorator indicates the class is a Vue component
@WithRender
@Component({
  // All component options are allowed in here
})
export default class SidebarComponent extends Vue {
  runs: string[] = [];
  colors: string[] = [];
  checked: boolean[] = [];
  display: boolean[] = [];
  exclusive = false;
  api: ApiService;

  regex: string = '';

  last_exclusive: string = '';

  logdir = '';

  constructor() {
    super();
    this.api = new ApiService();
    this.api.getTags().then((res) => {
      Object.keys(res.data).forEach(run => {
        this.runs.push(run);
        this.checked.push(true);
        this.display.push(true);
      });
    });

    this.api.getLogdir().then(res => {
      this.logdir += res.data.logdir;
      console.log(this.logdir);
    });
  }

  filterRuns() {
    this.display = this.runs.map(val => !!val.match(RegExp(this.regex)));
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
    this.exclusive = false;
  }
}