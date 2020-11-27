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
    page_size: 3,
    filtered_runs: []
  }

  mounted() {
    this.data.expanded = this.$props.expanded;
    (this.$children[0] as MdCard).MdCard.expand = this.$props.expanded;

    loader.runSelectionChanged.subscribe(() => {
      this.update();
    });

    window.addEventListener('resize', this.updatePageSize);
    this.updatePageSize();
  }

  updatePageSize() {
    const old_page_size = this.data.page_size;
    if (window.innerWidth < 900) {
      this.data.page_size = 1;
    } else if (window.innerWidth < 1200) {
      this.data.page_size = 2;
    } else {
      this.data.page_size = 3;
    }

    if (this.data.page_size !== old_page_size) {
      this.update();
    }
  }

  update() {
    if (this.$props.runs){
      this.data.expanded = (this.$children[0] as MdCard).MdCard.expand;
  
      this.data.filtered_runs = this.$props.runs.filter(name => {
        const run = loader.getRun(name);
  
        // ignore invisible
        return !!run && run.display && run.selected;
      });
  
      this.data.max_page = Math.ceil(this.data.filtered_runs.length / this.data.page_size);

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