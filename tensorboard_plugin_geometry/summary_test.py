import os

from torch.utils.tensorboard import SummaryWriter
from tensorboard.backend.event_processing.event_accumulator import EventAccumulator
import torch
import numpy as np

os.sys.path.append('..')
from tensorboard_plugin_geometry.summary import add_geometry


for logs in ['./logs/test_plugin', './logs/another_test', './logs/a_good_one']:
  log_dir = logs

  SummaryWriter.add_geometry = add_geometry
  writer = SummaryWriter(log_dir=log_dir)

  vertices = 10

  lin = torch.linspace(0, 2*np.pi, steps=vertices)
  sin = torch.sin(lin)
  cos = torch.cos(lin)

  pos = torch.stack([sin*sin, sin*cos, cos], dim=1)
  wss = torch.rand((vertices, 3)) * 0.1
  print(pos.shape)

  for i in range(10):
    writer.add_geometry('test_geo', pos.reshape(1, vertices, 3), features=i*wss.reshape(1, vertices, 3), global_step=i)
    writer.add_geometry('test_geo_2', i*pos.reshape(1, vertices, 3), features=wss.reshape(1, vertices, 3), global_step=i)

  for i in range(10):
    writer.add_scalar('scalar_test', lin[i], global_step=i)

  ea = EventAccumulator(log_dir)

  ea.Reload()

  print(ea.Tags())
  writer.close()