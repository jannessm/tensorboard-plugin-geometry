import Vue from 'vue';
import Component from 'vue-class-component';
import {MdCard} from 'vue-material/dist/components';

import DataRunComponent from '../data-run/data-run';
import { Run } from '../models/tag';
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

  data = {
    expanded: false,
    current_page: 1,
    max_pages: 1
  }

  mounted() {
    this.data.expanded = this.$props.expanded;
    (this.$children[0] as MdCard).MdCard.expand = this.$props.expanded;

    this.pages = this.$props.tag.reduce((reduced, item, id) => {
      if (id % 3 === 0) {
        reduced.push([item]);
      } else {
        reduced[Math.floor(id / 3.0)].push(item);
      }
      return reduced;
    }, []);

    this.data.max_pages = this.pages.length;
  }

  update() {
    this.data.expanded = (this.$children[0] as MdCard).MdCard.expand;

    this.pages = this.$props.tag.reduce((reduced, item, id) => {
      if (id % 3 === 0) {
        reduced.push([item]);
      } else {
        reduced[Math.floor(id / 3.0)].push(item);
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