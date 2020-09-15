import Vue from 'vue';
import Component from 'vue-class-component';
import {MdCard} from 'vue-material/dist/components';

import DataRunComponent from '../data-run/data-run';
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

  data = {
    expanded: false
  }

  mounted() {
    this.data.expanded = this.$props.expanded;
    (this.$children[0] as MdCard).MdCard.expand = this.$props.expanded;
  }

  update() {
    this.data.expanded = (this.$children[0] as MdCard).MdCard.expand;
  }
}