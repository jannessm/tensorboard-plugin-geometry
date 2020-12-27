import torch
import os.path as osp
import json
import numpy as np
from file_loader import loader
import io

class Sample:
    file_path = ''
    tensors = {}
    wall_time = 0
    step = 0

    @property
    def metadata(self):
        metadata = []
        for i, tensor in self.tensors.items():
            metadata.append({
                'wall_time': self.wall_time,
                'step': self.step,
                'content_type': tensor['content_type'],
                'components': 10,
                'config': '{ }',
                'data_shape': tensor['data_shape'],
                'description': ''
            })
        return metadata

    def __init__(self, file_path):
        self.file_path = file_path
        self.wall_time = osp.getmtime(file_path)
        
        loader.register(file_path, self.handle_tensor)

    def handle_tensor(self, tensor):
        self.tensors['VERTICES'] = {
            'content_type': 1,
            'components': 10,
            'data_shape': tensor['pos'].shape,
            'data': tensor['pos'].numpy().astype(np.float32)
        }
        self.tensors['FEATURES'] = {
            'content_type': 3,
            'components': 10,
            'data_shape': tensor['wss'].shape,
            'data': tensor['wss'].numpy().astype(np.float32)
        }
        self.step = tensor['step']
    
    def get_data(self, content_type):
        tensor = self.tensors[content_type]['data']
        return tensor.reshape(-1).tobytes()

class Tag:
    samples = {}
    description = ' '

    def __init__(self, name):
        self.name = name

    def __str__(self):
        return json.dumps(self.__json__())
    
    def __json__(self):
        return {
            "samples": len(self.samples),
            "description": self.description
        }
    
    def add_sample(self, step, sample):
        self.samples[step] = sample
    
    def get_samples_metadata(self):
        obj = []
        for i, s in self.samples.items():
            obj += s.metadata
        obj.sort(key=lambda x: x['step'])
        return json.dumps(obj).encode()

class Run:
    tags = {}

    def __init__(self, name):
        self.name = name

    def __str__(self, intend=0):
        return json.dumps(self.__json__())
    
    def __json__(self):
        objs = {}
        for tag, obj in self.tags.items():
            objs[tag] = obj.__json__()
        return objs
    
    def add_tag(self, tag):
        self.tags[tag.name] = tag

class RunCollection:
    
    _runs = {}

    def __str__(self):
        return json.dumps(self.__json__())
    
    def __json__(self):
        objs = {}
        for run, obj in self._runs.items():
            objs[run] = obj.__json__()
        return objs
    
    def __getitem__(self, id):
        return self._runs[id]
    
    def __setitem__(self, id, value):
        self._runs[id] = value