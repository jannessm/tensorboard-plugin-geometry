from torch.utils.tensorboard import SummaryWriter
from tensorboard.backend.event_processing.event_accumulator import EventAccumulator
import torch

from summary import add_geometry

log_dir = './logs/test_plugin'

SummaryWriter.add_geometry = add_geometry
writer = SummaryWriter(log_dir=log_dir)

lin = torch.linspace(-1, 1, steps=100)
sin = torch.sin(lin)
cos = torch.sin(lin)

pos = torch.stack([sin*sin, sin*cos, cos], dim=1)
wss = torch.rand((100, 3)) * 0.1

for i in range(10):
  writer.add_geometry('test_geo', pos.reshape(1, 100, 3), features=wss.reshape(1, 100, 3), global_step=i)

ea = EventAccumulator(log_dir)

ea.Reload()

print(ea.Tags())