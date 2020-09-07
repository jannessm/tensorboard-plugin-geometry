import Vue from 'vue'
import Component from 'vue-class-component'

import {ApiService} from '../api';
import WithRender from './main.html'
import SidebarComponent from '../sidebar/sidebar';

// The @Component decorator indicates the class is a Vue component
@WithRender
@Component({
  components: {
    sidebar: SidebarComponent
  }
})
export default class MainComponent extends Vue {

}