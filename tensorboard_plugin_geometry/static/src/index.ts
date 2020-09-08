import Vue from 'vue';
import 'vue-material/dist/vue-material.min.css';
import 'vue-material/dist/theme/default.css';
import 'material-design-icons-iconfont/dist/material-design-icons.css';
import {
  MdButton,
  MdCheckbox,
  MdField,
  MdIcon,
  MdRadio,
} from 'vue-material/dist/components';

Vue.use(MdButton);
Vue.use(MdCheckbox);
Vue.use(MdField);
Vue.use(MdIcon);
Vue.use(MdRadio);

import MainComponent from './app/main/main';
import './typings';
import './app/styles.scss';

const body = document.createElement('div');
body.id = 'geo_body';
document.body.appendChild(body);

const main = new MainComponent();
main.$mount('#geo_body');

