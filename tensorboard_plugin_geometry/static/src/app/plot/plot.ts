import Vue from 'vue'
import Component from 'vue-class-component'

import {ApiService} from '../api';
import WithRender from './plot.html'

import './plot.scss';
import SliderComponent from '../slider/slider';

import {Scene} from 'three';

enum CONTENT_TYPES {
  UNDEFINED = 'undefined',
  VERTICES = 'vertices',
  FACES = 'faces',  // Triangle face.
  FEATURES = 'features'
}

interface Steps {
  [step: number]: {
    wall_time: number;
    config: object;
    vertices: Metadata;
    features: Metadata;
    faces: Metadata;
  }
}

interface Metadata {
  shape: number[];
}

@WithRender
@Component({
  props: ['tag', 'run'],
  components: {
    slider: SliderComponent
  }
})
export default class PlotComponent extends Vue {
  tag_regex = '';
  data = {
    current_step: 0,
    current_wall_time: new Date(),
    steps: {},
    max_step: 0,
    plot_height: '20vw',
    fullscreen: false,
  };

  default_class = '';

  constructor() {
    super();
    this.getData();
    this.$nextTick().then(() => {
      this.data.plot_height = (this.$children[0].$parent.$el as HTMLElement).offsetWidth + 'px';
    });
  }

  async getData() {
    await this.$nextTick;
    const res = await ApiService.getMetadata(this.$props.run.name, this.$props.tag);
    
    res.data.forEach(element => {
      this._addStep(element.step, element.content_type, element.shape, element.wall_time, element.config);
    });
    
    this.data.max_step = Object.values(this.data.steps).length - 1;

    this.updateStep(this.data.max_step);
  }

  updateStep(new_value: number) {
    // update header
    this.data.current_step = new_value;
    this.data.current_wall_time = new Date(this.data.steps[new_value].wall_time * 1000);

    // update plot
    this.updatePlot(new_value, this.data.steps[new_value].wall_time);
  }

  async updatePlot(step: number, wall_time: number) {
    const res = await ApiService.getData(this.$props.run.name, this.$props.tag, step, wall_time);
    console.log(res);
  }

  togglePlotSize() {
    this.data.fullscreen = !this.data.fullscreen;

    const this_html_el = this.$parent.$children[0].$el;

    if (!this.default_class) {
      this.default_class = (this_html_el.className.match(/md-size-\d+/) as string[])[0];
    }

    if (this.data.fullscreen) {
      this_html_el.classList.replace(this.default_class, 'md-size-100');
    } else {
      this_html_el.classList.replace('md-size-100', this.default_class);
    }
  
    this.data.plot_height = (this.$children[0].$parent.$el as HTMLElement).offsetWidth + 'px';
  }

  _addStep(step: number, content_type: CONTENT_TYPES, shape: number[], wall_time: number, config: string) {
    if (!this.data.steps[step]) {
      this.data.steps[step] = {
        wall_time,
        config: JSON.parse(config)
      };
    }

    this.data.steps[step][content_type] = {
      shape
    };
  }
}