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
  
  suite = callback(writer)

  writer.close()
  return suite

def accumulate_results(suites):
  succeeded = 0
  failed = 0
  for suite in suites:
    succeeded += suite.succeeded
    failed += suite.failed
  
  return succeeded, failed

print(' ')
s1 = test('./logs/parameters', ParameterTests)
s2 = test('./logs/point_clouds', PointCloudTests)
s3 = test('./logs/meshes', MeshTests)

succeeded, failed = accumulate_results([s1, s2, s3])
print('')
print(s1.divider % '')
print('succeeded: %d     failed: %d' % (succeeded, failed))
