import Vue from 'vue'
import Component from 'vue-class-component'

import WithRender from './data-run.html'

import './data-run.scss';
import SliderComponent from '../slider/slider';
import PlotComponent from '../plot/plot';
import { StepData } from '../models/step-data';
import { DataManager } from '../data-manager';
import { Settings } from '../settings';
import { Subscriber } from '../models/observeable';
import { loader } from '../loader';

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
  settingsSubscription: Subscriber | undefined;
  
  data = {
    loading: true,
    display: '',
    current_step_id: -1,
    current_step_label: 0,
    current_wall_time: new Date(),
    max_step: () => {
      const provider = this.dataManager.getProvider(this.$props.run.name, this.$props.run.tag);
      if (provider?.initialized.state() === 'resolved') {
        return provider?.steps_metadata.length - 1
      }

      return 0;
    },
    plot_height: (this.$el as HTMLElement)?.offsetWidth + 'px',
    fullscreen: false,
    plot_data: {},
    plot_config: () => {
      const provider = this.dataManager.getProvider(this.$props.run.name, this.$props.run.tag);
      if (provider) {
        return provider.getConfigById(this.data.current_step_id)
      }
      return {};
    }
  };

  created() {
    const provider = this.dataManager.getProvider(this.$props.run.name, this.$props.run.tag);
    provider?.initialized?.then(() => {
        this.update(provider.steps.length - 1);
      });

    loader.runs.subscribe(runs => {
      const display = runs.find(val => val.name === this.$props.run.name).display;
      this.data.display = display ? '' : 'display: none;';
      this.data.plot_height = (this.$el?.getElementsByClassName('plot')[0] as HTMLElement)?.offsetWidth + 'px';
    });
  }

  updated() {
    const provider = this.dataManager.getProvider(this.$props.run.name, this.$props.run.tag);
    if (provider && this.last_run !== this.$props.run || this.last_tag !== this.$props.tag) {
      provider?.initialized?.then(() => {
        this.update(provider.steps.length - 1);
      });
      this.last_run = this.$props.run;
      this.last_tag = this.$props.tag;
    }
    this.data.plot_height = (this.$el.getElementsByClassName('plot')[0] as HTMLElement).offsetWidth + 'px';
  }

  destroyed() {
    this.settingsSubscription?.unsubscribe();
  }

  update(new_value: number) {
    this.data.loading = true;
    this.data.current_step_id = new_value;
    this.updateStep(new_value);
    this.updatePlotData();
  }

  updateStep(new_value: number) {
    const provider = this.dataManager.getProvider(this.$props.run.name, this.$props.run.tag);
    
    // update header
    if (!!provider) {
      provider.initialized.then(() => {
        this.data.current_step_label = provider.steps_metadata[new_value].step;
        this.data.current_wall_time = new Date(provider.getWalltimeById(new_value) * 1000);
      });
    }
  }

  async updatePlotData() {
    const provider = this.dataManager.getProvider(this.$props.run.name, this.$props.run.tag);
    if (this.data.current_step_id >= 0 && !!provider) {
      try {
        this.data.plot_data = await provider.getData(this.data.current_step_id) as StepData;
      } catch(err) {
        console.log(err);
      }
      this.data.loading = false;
    }
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

}