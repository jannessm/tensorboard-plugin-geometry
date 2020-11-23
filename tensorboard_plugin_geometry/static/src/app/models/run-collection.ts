import { colorScale } from "../color-scale";
import { loader } from "../loader";
import { Observeable } from "./observeable";
import { RawRuns, Run } from "./run";
import { RawTagCollection, Tag, TagCard, TagCollection } from "./tag";
import {markdown} from 'markdown';

export class RunCollection {
  private _runs = new Observeable<Run[]>([]);

  get runs() {
    return this._runs;
  }

  get tags(): TagCard[] {
    const tags: {[key:string]: TagCard} = {};
    const runs = this._runs.value;

    runs.forEach(run => {
      Object.keys(run.tags).forEach(tag_name => {
        if (!tags[tag_name]) {
          tags[tag_name] = {
            name: tag_name,
            isRegex: false,
            display: !!tag_name.match(loader.tagFilter.value),
            expanded: false,
            runs: [run.name]
          }
        } else {
          tags[tag_name].runs.push(run.name);
        }
      });
    });

    
    const sortedTags = Object.values(tags)
      .sort((a: TagCard, b: TagCard) => a.name.localeCompare(b.name));
    
    sortedTags.forEach(tagCard => {
      tagCard.runs = tagCard.runs.sort(this._sortRuns);
    });

    return sortedTags;
  }
  
  updateRuns(data: RawRuns) {
    const run_names = Object.keys(data).sort(this._sortRuns);
    colorScale.setDomain(run_names);
    
    const runs: Run[] = [];
    run_names.forEach(run => {
      const old_run = this.runs.value.find(val => val.name === run);

      runs.push({
        name: run,
        display: old_run ? old_run.display : true,
        selected: old_run ? old_run.selected : true,
        color: colorScale.getColor(run),
        tags: this._getTagCollection(data[run]),
      });
    });

    this._runs.next(runs);
  }

  setVisibilityForRun(name: string, visible: boolean) {
    this._runs[name].display = visible;
  }

  private _getTagCollection(tags: RawTagCollection): TagCollection {
    const tagCollection: TagCollection = {};

    Object.keys(tags).forEach(tag => {
      const newTag: Tag = {
        name: tag,
        description: this._parseMarkdown(tags[tag].description),
        samples: tags[tag].samples,
      };

      tagCollection[newTag.name] = newTag;
    });

    return tagCollection;
  }


  private _parseMarkdown(str): string {
    return markdown.toHTML(str.replace(/<\/?[^>]+(>|$)/g, ""));
  }
  
  private _sortRuns(a: string, b: string): number {
    const run_a = a.replace(RegExp('.*/'), '');
    const run_b = b.replace(RegExp('.*/'), '');
    return run_a.localeCompare(run_b);
  }
}