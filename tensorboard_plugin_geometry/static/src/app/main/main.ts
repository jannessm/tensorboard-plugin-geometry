import Vue from 'vue'
import Component from 'vue-class-component'

import WithRender from './main.html'
import SidebarComponent from '../sidebar/sidebar';

import './main.scss';
import DataCardComponent from '../data-card/data-card';
import {Tag, TagCard} from '../models/tag';

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
    tags: new Array<TagCard>(),
  }
  apply_regex: any = undefined;

  mounted() {
    loader.tags.subscribe(tags => {
      tags.unshift({
        name: this.tag_regex,
        display: !!this.tag_regex,
        isRegex: true,
        expanded: true,
        runs: []
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
      this.data.tags.forEach(tag => tag.display = !!tag.name.match(RegExp(this.tag_regex)));
      
      this.data.tags[0].runs = this.data.tags.map(tag => tag.display ? tag.runs : [])
        .reduce((all, runs) => all.concat(runs), []);
      

      loader.tagFilter.next(this.tag_regex);
      URLParser.setUrlParam('tagFilter', this.tag_regex);
    }, 500);
  }
}