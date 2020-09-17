import Vue from 'vue'
import Component from 'vue-class-component'

import {ApiService} from '../api';
import WithRender from './main.html'
import SidebarComponent from '../sidebar/sidebar';

import './main.scss';
import DataCardComponent from '../data-card/data-card';
import {Tags} from '../models/tag';

import { loader } from '../loader';

@WithRender
@Component({
  components: {
    sidebar: SidebarComponent,
    "data-card": DataCardComponent
  }
})
export default class MainComponent extends Vue {
  tag_regex = '';
  last_regex = '';
  data = {
    tags: new Array<Tags>()
  }

  mounted() {
    loader.tags.subscribe(tags => {
      tags.unshift({
        name: this.tag_regex,
        runs: [],
        display: !!this.tag_regex,
        isRegex: true,
      });

      this.data.tags = tags;
    });
  }

  

  filterTags() {
    this.data.tags[0].name = this.tag_regex;
    this.data.tags[0].display = !!this.tag_regex;
    this.data.tags[0].runs = this.data.tags.map((val, id) => id > 0 && !!val.name.match(this.tag_regex) ? val.runs : [])
                                           .reduce((concated, val) => concated.concat(val), []);
    this.data.tags[0].tag_names = this.data.tags.map((val, id) => id > 0 && !!val.name.match(this.tag_regex) ? val.name : '');
  }
}