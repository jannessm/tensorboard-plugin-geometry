import Vue from 'vue'
import Component from 'vue-class-component'

import {ApiService} from '../api';
import WithRender from './main.html'
import SidebarComponent from '../sidebar/sidebar';

import './main.scss';
import DataCardComponent from '../data-card/data-card';

interface Tag {
  name: string;
  samples: number;
}

interface Tags {
  name: string;
  runs: Tag[];
}

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
      
      // iter over all runs
      Object.keys(res.data).forEach(run => {
        
        // iter over all tags in run
        Object.keys(res.data[run]).forEach(tag => {
          if (this.data.tags.filter(val => val.name === tag).length === 0) {
            this.data.tags.push({
              name: tag,
              runs: []
            });
          }

          this.data.tags[this.data.tags.length - 1].runs.push({
            name: run,
            samples: res.data[run][tag]
          });
        });
      });
    });
  }

  filterTags() {
    // remove last regex
    if (!!this.last_regex) {
      this.data.tags.shift();
    }

    // add new regex if regex is not empty
    if (!!this.tag_regex) {
      this.data.tags.unshift(<Tags>{
        name: this.tag_regex,
        runs: []
      });
    } 
    
    this.last_regex = this.tag_regex;
  }
}