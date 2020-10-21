import Vue from 'vue'
import Component from 'vue-class-component'

import WithRender from './main.html'
import SidebarComponent from '../sidebar/sidebar';

import './main.scss';
import DataCardComponent from '../data-card/data-card';
import {Tags} from '../models/tag';

import { loader } from '../loader';
import { URLParser } from '../url-parser';

@WithRender
@Component({
  components: {
    sidebar: SidebarComponent,
    "data-card": DataCardComponent
  }
})
export default class MainComponent extends Vue {
  tag_regex = '';
  loading = true;
  data = {
    tags: new Array<Tags>()
  }
  apply_regex: any = undefined;

  mounted() {
    loader.tags.subscribe(tags => {
      tags.unshift({
        name: this.tag_regex,
        runs: [],
        display: !!this.tag_regex,
        isRegex: true,
      });

      this.data.tags = tags;
      this.loading = false;
    });

    loader.tagFilter.subscribe(regex => {
      if (this.tag_regex !== regex) {
        this.tag_regex = regex;
      }
    });
  }

  

  filterTags() {
    if (this.apply_regex) {
      clearTimeout(this.apply_regex);
    }
    this.apply_regex = setTimeout(() => {
      this.data.tags[0].name = this.tag_regex;
      this.data.tags[0].display = !!this.tag_regex;
      this.data.tags[0].runs = this.data.tags.map((val, id) => id > 0 && !!val.name.match(this.tag_regex) ? val.runs : [])
                                             .reduce((concated, val) => concated.concat(val), []);
      this.data.tags[0].tag_names = this.data.tags.map((val, id) => id > 0 && !!val.name.match(this.tag_regex) ? val.name : '');

      loader.tagFilter.next(this.tag_regex);
      URLParser.setUrlParam('tagFilter', this.tag_regex);
    }, 500);
  }
}