import Vue from 'vue'
import Component from 'vue-class-component'

import WithRender from './data-run.html'

import './data-run.scss';
import SliderComponent from '../slider/slider';
import PlotComponent from '../plot/plot';
import {DataProvider} from '../data-provider';
import { StepData } from '../models/step-data';

@WithRender
@Component({
  props: ['tag', 'run'],
  components: {
    slider: SliderComponent,
    plot: PlotComponent
  }
})
export default class DataRunComponent extends Vue {
  tag_regex = '';
  default_class = '';
  dataProvider: DataProvider = new DataProvider();
  
  data = {
      current_step_id: 0,
      current_step_label: 0,
      current_wall_time: new Date(),
      max_step: () => this.dataProvider?.steps_metadata.length - 1,
      plot_height: () => (this.$children[0]?.$parent.$el as HTMLElement)?.offsetWidth + 'px',
      fullscreen: false,
      plot_data: {
        vertices: [[[0]]],
        faces: [[[0]]],
        features: [[[0]]],
      },
  };

  created() {
    this.dataProvider.init(this.$props.run.name, this.$props.tag)
      .then(() => {
        this.updateStep(this.dataProvider.steps.length - 1);
        this.updatePlotData();
      });
  }

  update(new_value: number) {
    this.updateStep(new_value);
    this.updatePlotData();
  }

  updateStep(new_value: number) {
    // update header
    this.data.current_step_id = new_value;
    this.data.current_step_label = this.dataProvider.steps_metadata[new_value].step;
    this.data.current_wall_time = new Date(this.dataProvider.getWalltimeById(new_value) * 1000);
  }

  async updatePlotData() {
    if (!!this.data.current_step_id) {
      this.data.plot_data = await this.dataProvider.getData(this.data.current_step_id) as StepData;
    }
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
  }

}