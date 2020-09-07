// To make TypeScript understand/import *.vue files, this shim is required
declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}

// TypeScript type module definition required for vue-template-loader
declare module '*.html' {
  import Vue, { ComponentOptions } from 'vue';

  interface WithRender {
    <V extends Vue>(options: ComponentOptions<V>): ComponentOptions<V>
    <V extends typeof Vue>(component: V): V
  }

  const withRender: WithRender
  export = withRender
}