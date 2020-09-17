import os
from time import sleep

from torch.utils.tensorboard import SummaryWriter

os.sys.path.append('..')
from tensorboard_plugin_geometry.summary import add_geometry

from tests.utils import get_rand_vecs

SummaryWriter.add_geometry = add_geometry

def test(log_dir):
  writer = SummaryWriter(log_dir=log_dir)
  
  for i in range(30):
    print('added %d to %s' % (i, log_dir))
    pos, _ = get_rand_vecs(100)
    writer.add_geometry(
      'test_reload',
      pos.reshape(1, 100, 3),
      global_step=i)
    sleep(10)

  writer.close()

i = 0

for i in range(100):
  test('./logs/test_%d' % i)