import Vue from 'vue'
import Component from 'vue-class-component'

import WithRender from './main.html'

// The @Component decorator indicates the class is a Vue component
@WithRender
@Component({
  // All component options are allowed in here
})
export default class MainComponent extends Vue {}