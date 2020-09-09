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
    let updated = false;
    const inter = setInterval(() => {
      if (updated) {
        clearInterval(inter);
      }
      
      this.$nextTick(() => {
        this.data.input = this.$props.value;
        this.data.progress = this.data.input / this.$props.max * 100;
        updated = true;
      });
    }, 200);
  }

  updateValue() {
    this.data.progress = this.data.input / this.$props.max * 100;
    this.$emit('value', this.data.input); 
  }
}