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
  
  mounted() {
    this.data.input = this.$props.value;
    this.data.progress = this.data.input / this.$props.max * 100;
  }

  updated() {
    this.data.input = this.$props.value;
    this.data.progress = this.data.input / this.$props.max * 100;
  }

  updateValue() {
    this.data.progress = this.data.input / this.$props.max * 100;
    this.$emit('value', this.data.input); 
    this.$emit('changed', this.data.input);
  }
}