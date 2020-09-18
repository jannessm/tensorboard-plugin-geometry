import { ApiService } from "./api";
import { Observeable } from "./models/observeable";
import { TagsResponse } from "./models/responses";
import { RunSidebar } from "./models/run";
import { RawTags, Tags } from "./models/tag";
import {markdown} from 'markdown';
import { colorScale } from "./color-scale";

export class LoaderClass {
  logdir = new Observeable<string>('./');
  runs = new Observeable<RunSidebar[]>([]);
  tags = new Observeable<Tags[]>([]);

  _tags_data: RawTags = {};

  constructor() {
    this.reload();
  }

  async reload() {
    console.log('reload_data');
    const tags: TagsResponse = await ApiService.getTags();

    if(this._tags_data !== tags.data){
      this._updateRunData(tags.data);
      this._updateTagData(tags.data);
    }

    this.logdir.next((await ApiService.getLogdir()).data.logdir);
  }

  // sidebar.ts
  private async _updateRunData(data: RawTags) {
    this._tags_data = data;
    colorScale.setDomain(Object.keys(data));
    
    const runs: RunSidebar[] = [];
    Object.keys(data).forEach(run => {
      runs.push({
        name: run,
        display: true,
        checked: true,
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
        
        // add new tag if not exists yet
        if (tags.findIndex(val => val.name === tag) < 0) {
          tags.push({
            name: tag,
            runs: [],
            display: true
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