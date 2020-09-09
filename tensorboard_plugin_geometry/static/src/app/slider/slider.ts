import Vue from 'vue'
import Component from 'vue-class-component'

import WithRender from './slider.html'

import './slider.scss';

@WithRender
@Component({
  props: {
    value: Number,
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    }
  }
})
export default class SliderComponent extends Vue {
  data = {
    progress: 50,
    input: 50
  };

  constructor() {
    super();
    this.$nextTick(() => {
      this.data.input = this.value;
      this.data.progress = this.data.input / this.max * 100;
    });
  }

  updateValue() {
    this.data.progress = this.data.input / this.max * 100;
    this.$emit('value', this.data.input); 
  }
}