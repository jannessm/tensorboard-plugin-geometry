import { ApiService } from "./api";
import { Observeable } from "./models/observeable";
import { TagsResponse } from "./models/responses";
import { RawRuns, Run } from "./models/run";
import { TagCard } from "./models/tag";
import { URLParser } from "./url-parser";
import { RunCollection } from "./models/run-collection";

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
  private _runCollection = new RunCollection();
  tags = new Observeable<TagCard[]>([]);
  
  private _runSelectionState = {};
  runSelectionChanged = new Observeable<undefined>(undefined);
  
  reloadContainer: ReloadContainer;

  regexInput = new Observeable<string>('');
  tagFilter = new Observeable<string>('');

  // raw data buffer to check if there are changes
  _tags_data: RawRuns = {};

  get runs() {
    return this._runCollection.runs;
  }

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

  getRun(name: string): Run | undefined {
    return this._runCollection.getRun(name);
  }

  reloadFilters() {
    const params = ['regexInput', 'tagFilter'];

    params.forEach(param => {
      const regex = URLParser.getUrlParam(param);

      if (regex && regex !== this[param].value) {
        this[param].next(regex);
      }
    });
  }

  reloadRunStates() {
    const regex = URLParser.getUrlParam('runSelectionState');

    if (regex) {
      const obj = JSON.parse(atob(regex));
      this._runSelectionState = obj;
      let runs = this.runs.value;

      runs.forEach(run => {
        if (obj[run.name] !== undefined) {
          this._runCollection.setVisibilityForRun(run.name, obj[run.name]);
        }
      });

      this.runSelectionChanged.next(undefined);
      this.runs.next(runs);
    }
  }

  setVisibilityForRun(name: string, visible: boolean) {
    this._runCollection.setVisibilityForRun(name, visible);
    this._runSelectionState[name] = visible;
  }

  updateRunStates() {
    this.runSelectionChanged.next(undefined);
    URLParser.setUrlParam('runSelectionState', btoa(JSON.stringify(this._runSelectionState)));
  }

  async reload() {
    const tags: TagsResponse = await ApiService.getTags();

    if(this._tags_data !== tags.data){
      this._tags_data = tags.data;
      this._runCollection.updateRuns(this._tags_data);

      this.tags.next(this._runCollection.tags);
    }

    const new_logdir = (await ApiService.getLogdir()).data.logdir;
    if (this.logdir.value !== new_logdir) {
      this.logdir.next(new_logdir);
    }
  }
}

export const loader = new LoaderClass();