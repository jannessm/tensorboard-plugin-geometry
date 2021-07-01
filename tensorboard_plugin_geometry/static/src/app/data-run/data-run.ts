import Vue from 'vue';
import Component from 'vue-class-component';

import WithRender from './data-run.html';

import './data-run.scss';
import SliderComponent from '../slider/slider';
import PlotComponent from '../plot/plot';
import { StepData, Steps } from '../models/step';
import { DataManager } from '../data-manager';
import { loader } from '../loader';
import { Observeable, Subscriber } from '../models/observeable';
import { colorScale } from '../color-scale';
import { Settings } from '../settings';
import { Run } from '../models/run';
import { DataProvider } from '../data-provider';
import { ThreeConfig } from "../models/metadata";
import { BufferGeometry, Group, Mesh, Points } from 'three';
import { Geometry } from '../models/geometry';

@WithRender
@Component({
  props: ['tag', 'run'],
  components: {
    slider: SliderComponent,
    plot: PlotComponent
  }
})
export default class DataRunComponent extends Vue {
  default_class = '';
  last_tag = '';
  last_run = '';
  run_instance: Run = {
    name: '',
    tags: {},
    display: true,
    selected: true,
    color: '',
  };
  steps: Steps = {steps: {}, step_ids: []};
  steps_subscription: Subscriber | undefined;

  plot = new Observeable<StepData>({not_initialized: true});
  provider: DataProvider | undefined;

  data = {
    description: '',
    loading: true,
    current_step_id: -1,
    current_step_label: 0,
    current_wall_time: new Date(),
    max_step: 0,
    plot_height: (this.$el as HTMLElement)?.offsetWidth + 'px',
    fullscreen: false,
    color: '',
    show_snackbar: false,
    error: '',
    plot_config: {} as ThreeConfig,
  };

  mounted() {
    this.provider = DataManager.getProvider(this.$props.run, this.$props.tag);
    this.steps_subscription = this.provider?.steps_metadata.subscribe(this.handleStepsMetadata);

    Settings.norm_features.subscribe(() => {
      this.updatePlotData();
    });
  }

  // vue event
  updated() {
    this.provider = DataManager.getProvider(this.$props.run, this.$props.tag);
    const run = loader.getRun(this.$props.run);

    // check if tag or run has changed
    if (!!this.provider && run && (this.last_run !== this.$props.run || this.last_tag !== this.$props.tag)) {
      this.steps_subscription?.unsubscribe();
      this.steps_subscription = this.provider.steps_metadata.subscribe(this.handleStepsMetadata); // updates step data
      this.last_run = this.$props.run;
      this.last_tag = this.$props.tag;
      this.run_instance = run;
      this.data.color = colorScale.getColor(this.$props.run);
      this.data.description = run.tags[this.$props.tag].description;
    }
  }

  update(new_value: number) {
    if (!this.provider) {
      console.warn('data-run update without provider');
      return;
    }
    
    this.data.loading = true;
    this.provider.current_step_id = new_value;
    this.data.current_step_id = this.provider.current_step_id;
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
    this.provider = DataManager.getProvider(this.$props.run, this.$props.tag);

    if (!!this.provider && this.provider.current_step_id >= 0) {
      try {
        const data = await this.provider.getData() as StepData;
        if (!!data) {
          this.plot.next(data);
        }
      } catch(err) {
        this.plot.next({broken: true});
        console.error(this.$props.run, this.$props.tag, err.message);
        this.data.error = [this.$props.run + ' ' + this.$props.tag, err.message].join(': ');
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
    const plot = this.getPlot();
    const old_fullscreen_state = {
      'width': (plot.$el as HTMLElement).offsetWidth,
      'height': (plot.$el as HTMLElement).offsetHeight
    };
    plot.update(undefined, 2000, 2000);

    const filename = this.data.current_step_label + '.png';
    // const filename = this.data.current_step_label + '_' + this.$props.tag + '_' + this.run_instance.name + '.png';

    const link = plot.screenshot(filename);

    //Firefox requires the link to be in the body
    document.body.appendChild(link);
    
    //simulate click
    link.click();

    //remove the link when done
    document.body.removeChild(link);

    plot.update(undefined, old_fullscreen_state.width, old_fullscreen_state.height);
  }

  getData() {
    const data = this.plot.value;
    const raw_data = data.raw_data;
    let vertices, features, faces;
    
    if (raw_data && raw_data.vertices) {
      vertices = this.bufferToArray(raw_data?.vertices, [raw_data.vertices.length / 3, 3]);
    }
    if (raw_data && raw_data.features) {
      features = this.bufferToArray(raw_data?.vertices, [raw_data.features.length / 3, 3]);
    }
    if (raw_data && raw_data.faces) {
      faces = this.bufferToArray(raw_data?.vertices, [raw_data.faces.length / 3, 3]);
    }

    const json = {
      vertices,
      features,
      faces,
    };

    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "data.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  resetCamera() {
    this.getPlot().reset();
  }

  rotateUpwards() {
    this.getPlot().rotateUpwards();
  }

  rotateSideways() {
    this.getPlot().rotateSideways();
  }

  private bufferToArray(array, shape) {
    const final_array: Array<Array<number>> = [];

    for (let i = 0; i < shape[0]; i++) {
      const item: Array<number> = [];
      for (let j = 0; j < shape[1]; j++) {
        item.push(array[i * shape[1] + j]);
      }
      final_array.push(item);
    }

    return final_array;
  }

  private getPlot(): PlotComponent {
    return this.$children.filter(val => val.$el.className !== undefined && val.$el.className.indexOf('plot') >= 0)[0] as PlotComponent;
  }

  private handleStepsMetadata(steps: Steps) {
    if (!!this.provider) {
      // if current step is last one move to newset (latest)
      if (this.provider.current_step_id === this.data.max_step){
        this.provider.current_step_id = steps.step_ids.length - 1;
      }
  
      this.steps = steps;
      // set boundaries
      this.data.max_step = steps.step_ids.length - 1;
      
      // set meta data
      this.data.plot_config = steps.config || {};
      
      this.update(this.provider.current_step_id);
    }
  }

}