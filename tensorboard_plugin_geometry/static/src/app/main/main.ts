import Vue from 'vue'
import Component from 'vue-class-component'

import {ApiService} from '../api';
import WithRender from './main.html'
import SidebarComponent from '../sidebar/sidebar';

import './main.scss';
import DataCardComponent from '../data-card/data-card';
import {Tags} from '../models/tag';

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
    tags: new Array<Tags>() // {tag: string, runs: Tag[]}[]
  }

  constructor() {
    super();
    ApiService.getTags().then((res) => {
      this.$set(this.data, 'tags', []);
      
      this.data.tags.push({
        name: this.tag_regex,
        runs: [],
        display: !!this.tag_regex,
        isRegex: true,
      });
      
      // iter over all runs
      Object.keys(res.data).forEach(run => {
        
        // iter over all tags in run
        Object.keys(res.data[run]).forEach(tag => {
          
          // add new tag if not exists yet
          if (this.data.tags.filter(val => val.name === tag).length === 0) {
            this.data.tags.push({
              name: tag,
              runs: [],
              display: true
            });
          }

          const tag_index = this.data.tags.findIndex((val) => val.name === tag);

          this.data.tags[tag_index].runs.push({
            name: run,
            samples: res.data[run][tag].samples
          });
        });
      });
    });
  }

  filterTags() {
    // add new regex if regex is not empty
    this.data.tags[0].name = this.tag_regex;
    this.data.tags[0].display = !!this.tag_regex;
  }
}