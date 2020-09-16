import os

from torch.utils.tensorboard import SummaryWriter

from tests.point_clouds import tests as PointCloudTests
from tests.meshes import tests as MeshTests
from tests.parameters import tests as ParameterTests

os.sys.path.append('..')
from tensorboard_plugin_geometry.summary import add_geometry

SummaryWriter.add_geometry = add_geometry

def test(log_name, callback):
  log_dir = log_name
  writer = SummaryWriter(log_dir=log_dir)
  
  callback(writer)

  writer.close()


test('./logs/point_clouds', PointCloudTests)
test('./logs/meshes', MeshTests)
test('./logs/parameters', ParameterTests)
