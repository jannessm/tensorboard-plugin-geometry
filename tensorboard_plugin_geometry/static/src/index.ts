import Vue from 'vue';
import 'vue-material/dist/vue-material.min.css';
import 'vue-material/dist/theme/default.css';

import MainComponent from './app/main/main';
import './typings';

export async function render() {
  const body = document.createElement('div');
  body.id = 'geo_body';
  document.body.appendChild(body);
  const mainEl = document.createElement('main');
  body.appendChild(mainEl);


  const main = new MainComponent();
  main.$mount('#geo_body');
}

render()
