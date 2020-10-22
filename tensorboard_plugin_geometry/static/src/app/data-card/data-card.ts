import Vue from 'vue';
import Component from 'vue-class-component';
import {MdCard} from 'vue-material/dist/components';

import DataRunComponent from '../data-run/data-run';
import { loader } from '../loader';
import { Run, RunSidebar } from '../models/run';
import WithRender from './data-card.html';

import './data-card.scss';

@WithRender
@Component({
  props: ['name', 'tag', 'isRegex', 'expanded'],
  components: {
    'data-run': DataRunComponent
  }
})
export default class DataCardComponent extends Vue {
  tag_regex = '';
  pages: Run[][] = [];
  runs: RunSidebar[] = [];

  data = {
    expanded: false,
    current_page: 1,
    max_pages: 1
  }

  mounted() {
    this.data.expanded = this.$props.expanded;
    (this.$children[0] as MdCard).MdCard.expand = this.$props.expanded;

    loader.runs.subscribe(runs => {this.runs = runs; this.update();});
    loader.tags.subscribe(() => this.update());
  }

  update() {
    this.data.expanded = (this.$children[0] as MdCard).MdCard.expand;

    let skipped = 0;
    this.pages = this.$props.tag.reduce((reduced, item, id) => {
      const run = this.runs.find(val => val.name === item.name);

      // ignore invisible
      if (!!run && !run.display) {
        skipped += 1;
        return reduced;
      }

      if ((id - skipped) % 3 === 0) {
        reduced.push([item]);
      } else {
        reduced[Math.floor((id - skipped) / 3.0)].push(item);
      }
      return reduced;
    }, []);

    this.data.max_pages = this.pages.length;
  }

  getPage() {
    return this.pages[this.data.current_page - 1];
  }

  nextPage() {
    if (this.data.current_page < this.data.max_pages) {
      this.data.current_page++;
    }
  }

  prevPage() {
    if (this.data.current_page > 1) {
      this.data.current_page--;
    }
  }
}