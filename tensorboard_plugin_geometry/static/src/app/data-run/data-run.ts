import Vue from 'vue'
import Component from 'vue-class-component'

import WithRender from './data-run.html'

import './data-run.scss';
import SliderComponent from '../slider/slider';
import PlotComponent from '../plot/plot';
import { StepData, Steps } from '../models/step';
import { DataManager } from '../data-manager';
import { loader } from '../loader';
import { Observeable, Subscriber } from '../models/observeable';
import { colorScale } from '../color-scale';
import { Settings } from '../settings';
import { ThreeConfig } from '../models/metadata';

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
  dataManager = DataManager;
  last_tag = '';
  last_run = '';
  steps: Steps = {steps: {}, step_ids: []};
  steps_subscription: Subscriber | undefined;

  plot = new Observeable<{
    data:StepData,
    config: ThreeConfig
  }>({data: {broken: false}, config: {}});

  data = {
    loading: true,
    display: '',
    current_step_id: -1,
    current_step_label: 0,
    current_wall_time: new Date(),
    max_step: 0,
    plot_height: (this.$el as HTMLElement)?.offsetWidth + 'px',
    fullscreen: false,
    color: '',
    show_snackbar: false,
    error: '',
  };

  created() {
    const provider = this.dataManager.getProvider(this.$props.run.name, this.$props.run.tag);
    this.steps_subscription = provider?.steps_metadata.subscribe(this.handleStepsMetadata);

    loader.runs.subscribe(runs => {
      // get display status from sidebar
      const run = runs.find(val => val.name === this.$props.run.name)
      const display = run.display && run.checked;
      this.data.display = display ? '' : 'display: none;';
      this.data.color = colorScale.getColor(this.$props.run.name);
    });

    Settings.norm_features.subscribe(() => {
      this.updatePlotData();
    });
  }

  // vue event
  updated() {
    const provider = this.dataManager.getProvider(this.$props.run.name, this.$props.run.tag);

    // check if tag or run has changed
    if (provider && this.last_run !== this.$props.run || this.last_tag !== this.$props.tag) {
      this.steps_subscription?.unsubscribe();
      this.steps_subscription = provider?.steps_metadata.subscribe(this.handleStepsMetadata);
      this.last_run = this.$props.run;
      this.last_tag = this.$props.tag;
    }
  }

  update(new_value: number) {
    this.data.loading = true;
    this.data.current_step_id = new_value;
    this.updateStep(new_value);
    this.updatePlotData();
  }

  updateStep(new_value: number) {
    this.data.current_step_label = this.steps.step_ids[new_value];
    
    // if current label is in steps (important for step-up)
    if (Object.keys(this.steps.steps)
      .map(val => parseInt(val))
      .includes(this.data.current_step_label)
    ) {
      this.data.current_wall_time = new Date(this.steps.steps[this.data.current_step_label].first_wall_time * 1000);
    }
  }

  async updatePlotData() {
    this.data.loading = true;
    const provider = this.dataManager.getProvider(this.$props.run.name, this.$props.run.tag);
    
    if (this.data.current_step_id >= 0 && !!provider) {
      try {
        this.plot.value.data = await provider.getData(this.data.current_step_label) as StepData;
        this.plot.next(this.plot.value);
      } catch(err) {
        this.plot.value.data.broken = true;
        console.error(this.$props.run.name, this.$props.run.tag, err.message);
        this.data.error = [this.$props.run.name + ' ' + this.$props.run.tag, err.message].join(': ');
        this.data.show_snackbar = true;
      }
      
    }
    this.data.loading = false;
  }

  togglePlotSize() {
    this.data.fullscreen = !this.data.fullscreen;
    
    const this_html_el = this.$el;
    
    if (!this.default_class) {
      this.default_class = (this_html_el.className.match(/md-size-\d+/) as string[])[0];
    }
    
    if (this.data.fullscreen) {
      this_html_el.classList.replace(this.default_class, 'md-size-100');
    } else {
      this_html_el.classList.replace('md-size-100', this.default_class);
    }

    this.data.plot_height = (this.$el.getElementsByClassName('plot')[0] as HTMLElement).offsetWidth + 'px';
  }

  getScreenshot() {
    const plot = this.$children.filter(val => val.$el.className.indexOf('plot') >= 0)[0];
    (plot as PlotComponent).screenshot();
  }

  handleStepsMetadata(steps: Steps) {
    // if current step is last one 
    if (this.data.current_step_id === this.data.max_step){
      this.data.current_step_id = steps.step_ids.length - 1;
    }

    // set boundaries
    this.data.max_step = steps.step_ids.length - 1;
    
    // set meta data
    this.plot.value.config = steps.config || {};
    this.plot.next(this.plot.value);
    
    this.steps = steps;

    this.update(this.data.current_step_id);
  }

}