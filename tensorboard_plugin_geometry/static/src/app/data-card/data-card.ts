import Vue from 'vue';
import Component from 'vue-class-component';
import {MdCard} from 'vue-material/dist/components';

import DataRunComponent from '../data-run/data-run';
import WithRender from './data-card.html';

import './data-card.scss';

@WithRender
@Component({
  props: ['name', 'tag', 'isRegex'],
  components: {
    'data-run': DataRunComponent
  }
})
export default class DataCardComponent extends Vue {
  tag_regex = '';
  data = {
    expanded: true,
    plot_size: 100
  }

  constructor() {
    super();
    this.$nextTick(() => {
      (<MdCard>this.$children[0]).MdCard.expand = this.data.expanded;
      this.data.plot_size = Math.floor(Math.max( 1 / this.$props.tag.length, 0.33) * 100);
      console.log(this.data.plot_size);
    });
  }

  max(a: number, b: number) {
    return a > b ? a : b;
  }
}