import { ApiService } from "./api";
import { Observeable } from "./models/observeable";
import { TagsResponse } from "./models/responses";
import { RunSidebar } from "./models/run";
import { RawTags, Tags } from "./models/tag";
import {markdown} from 'markdown';
import { colorScale } from "./color-scale";
import { URLParser } from "./url-parser";

interface ReloadContainer {
  isReloading$: {
    subscribe: Function;
  }
}

/**
 * handle all data that needs to be loaded asyncly
 * 
 * tags, runs, logdir, regexfilter
 */
export class LoaderClass {
  logdir = new Observeable<string>('./');
  runs = new Observeable<RunSidebar[]>([]);
  tags = new Observeable<Tags[]>([]);
  reloadContainer: ReloadContainer;

  regexInput = new Observeable<string>('');
  tagFilter = new Observeable<string>('');

  _tags_data: RawTags = {};

  constructor() {
    this.reload();
    
    this.reloadContainer = (window.parent.document.getElementsByClassName('reload-button')[0] as any)
      .__ngContext__
      .find(val => !!val && !!val.isReloading$);

    this.reloadContainer.isReloading$.subscribe(() => {
      this.reload();
    });

    window.parent.addEventListener('popstate', () => {
      this.reloadRunStates();
      this.reloadFilters();
    });
    this.reloadFilters();
    this.reloadRunStates();
  }

  reloadFilters() {
    const params = ['regexInput', 'tagFilter'];

    params.forEach(param => {
      const regex = URLParser.getUrlParam(param);

      if (regex && regex !== this[param].value) {
        console.log('reload_filter');
        this[param].next(regex);
      }
    });
  }

  reloadRunStates() {
    const regex = URLParser.getUrlParam('runSelectionState');

    if (regex) {
      const obj = JSON.parse(atob(regex));
      const runs = this.runs.value;

      runs.forEach(run => {
        if (obj[run.name] !== undefined) {
          run.checked = obj[run.name];
        }
      });

      this.runs.next(runs);
    }
  }

  async reload() {
    const tags: TagsResponse = await ApiService.getTags();

    if(this._tags_data !== tags.data){
      this._tags_data = tags.data;
      this._updateRunData(tags.data);
      this._updateTagData(tags.data);
    }

    const new_logdir = (await ApiService.getLogdir()).data.logdir;
    if (this.logdir.value !== new_logdir) {
      this.logdir.next(new_logdir);
    }
  }

  // sidebar.ts
  private async _updateRunData(data: RawTags) {
    colorScale.setDomain(Object.keys(data));
    
    const runs: RunSidebar[] = [];
    Object.keys(data).forEach(run => {
      const old_run = this.runs.value.find(val => val.name === run);
      runs.push({
        name: run,
        display: old_run ? old_run.display : true,
        checked: old_run ? old_run.checked : true,
        color: colorScale.getColor(run)
      });
    });
    this.runs.next(runs);
  }

  // main.ts
  private async _updateTagData(data: RawTags) {
    const tags: Tags[] = [];
      
    // iter over all runs
    Object.keys(data).forEach(run => {
      
      // iter over all tags in run
      Object.keys(data[run]).forEach(tag => {
        const old_tag = this.tags.value.find(val => val.name === tag);
        
        // add new tag if not exists yet
        if (tags.findIndex(val => val.name === tag) < 0) {
          tags.push({
            name: tag,
            runs: [],
            display: old_tag ? old_tag.display : true
          });
        }

        const tag_index = tags.findIndex((val) => val.name === tag);

        tags[tag_index].runs.push({
          name: run,
          tag,
          samples: data[run][tag].samples,
          description: this._parseMarkdown(data[run][tag].description)
        });
      });
    });

    this.tags.next(tags);
  }

  private _parseMarkdown(str): string {
    return markdown.toHTML(str.replace(/<\/?[^>]+(>|$)/g, ""));
  }
}

export const loader = new LoaderClass();