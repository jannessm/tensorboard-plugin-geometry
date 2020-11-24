import Vue from 'vue';
import Component from 'vue-class-component';
import {MdCard} from 'vue-material/dist/components';

import DataRunComponent from '../data-run/data-run';
import { loader } from '../loader';
import WithRender from './data-card.html';

import './data-card.scss';

@WithRender
@Component({
  props: ['name', 'runs', 'isRegex', 'expanded'],
  components: {
    'data-run': DataRunComponent
  }
})
export default class DataCardComponent extends Vue {
  tag_regex = '';
  _reload_timeout: NodeJS.Timeout | undefined = undefined;

  data = {
    expanded: false,
    current_page_id: 0,
    max_page: 1,
    filtered_runs: []
  }

  mounted() {
    this.data.expanded = this.$props.expanded;
    (this.$children[0] as MdCard).MdCard.expand = this.$props.expanded;

    loader.runSelectionChanged.subscribe(() => {
      this.update();
    });
  }

  update() {
    if (this.$props.runs){
      this.data.expanded = (this.$children[0] as MdCard).MdCard.expand;
  
      this.data.filtered_runs = this.$props.runs.filter(name => {
        const run = loader.getRun(name);
  
        // ignore invisible
        return !!run && run.display && run.selected;
      });
      console.log(this.data.filtered_runs);
  
      this.data.max_page = Math.ceil(this.data.filtered_runs.length / 3);

      if (this.data.max_page < this.data.current_page_id + 1) {
        this.data.current_page_id = this.data.max_page - 1;
      }
    }
  }

  nextPage() {
    if (this.data.current_page_id + 1 < this.data.max_page) {
      this.data.current_page_id++;
    }
  }

  prevPage() {
    if (this.data.current_page_id > 0) {
      this.data.current_page_id--;
    }
  }
}