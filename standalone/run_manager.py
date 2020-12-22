import re
import os
osp = os.path

from watchdog.events import PatternMatchingEventHandler

from run_collection import RunCollection, Run, Tag, Sample

class RunManager(PatternMatchingEventHandler):
    patterns = ["events*", "*.pkl"]
    runs = RunCollection()
    logdir = '.'

    def __init__(self, logdir):
        PatternMatchingEventHandler.__init__(self, patterns=self.patterns, ignore_directories=True, case_sensitive=True)

        self.logdir = logdir
        if osp.exists(logdir):
            # get runs
            for run in os.listdir(logdir):
                if osp.isdir(osp.join(logdir, run)):
                    new_run = Run(run)
                    
                    for tag in os.listdir(osp.join(logdir, run)):
                        if osp.isdir(osp.join(logdir, run, tag)):
                            new_tag = Tag(tag)
                            new_run.add_tag(new_tag)
                            
                            for sample in os.listdir(osp.join(logdir, run, tag)):
                                if sample.endswith('.pkl'):
                                    step = int(re.match('.*(\d+)_.*\.pkl', sample)[1])
                                    new_sample = Sample(osp.join(logdir, run, tag, sample))
                                    new_sample.step = step
                                    new_tag.add_sample(step, new_sample)
                    
                    self.runs[run] = new_run
        print(self.runs)

    def get_tags(self):
        return self.runs.__str__()
    
    def read_dir(self, dir_path):
        for f in os.listdir(dir_path):
            if osp.isdir(osp.join(dir_path, f)):
                self.read_dir(osp.join(dir_path, f))
            else:
                pkl = torch.load(osp.join(dir_path, f))
            break

    def process(self, event):
        """
        event.event_type 
            'modified' | 'created'
        event.is_directory
            True | False
        event.src_path
            path/to/observed/file
        """
        print(event.src_path)

    def on_modified(self, event):
        self.process(event)

    def on_created(self, event):
        self.process(event)

    # def on_moved(self, event):
    #     self.process_moved(event)
    
    # def on_delete(self, event):
    #     self.process_delete(event)