import Vue from 'vue';
import Component from 'vue-class-component';
import {MdCard} from 'vue-material/dist/components';

import PlotComponent from '../plot/plot';
import WithRender from './data-card.html';

import './data-card.scss';


interface Tag {
  [run: string]: number // run: #(samples)
}

@WithRender
@Component({
  props: ['name', 'tag', 'isRegex'],
  components: {
    plot: PlotComponent
  }
})
export default class DataCardComponent extends Vue {
  tag_regex = '';
  data = {
    expanded: true
  }

  constructor() {
    super();
    this.$nextTick(() => (<MdCard>this.$children[0]).MdCard.expand = this.data.expanded);
  }
}