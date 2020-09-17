import torch

from .utils import Suite

def get_rand_vecs(vertices):
  pos = torch.randn((vertices, 3))
  pos = (pos.T / torch.norm(pos, dim=1)).T
  wss = torch.randn((vertices, 3)) * 0.1
  return pos, wss

def tests(writer):
  suite = Suite('point cloud tests', writer)
  suite.run_test('simple point cloud', test_point_cloud)
  suite.run_test('point cloud with features', test_point_cloud_with_features)
  suite.run_test('colored point cloud', test_colored_point_cloud)
  suite.run_test('multiple point clouds', test_multiple_point_clouds)
  return suite

######### tests #################
def test_point_cloud(writer):
  pos, _ = get_rand_vecs(100)
  for i in range(10):
    writer.add_geometry(
      'test_geo',
      pos.reshape(1, 100, 3),
      global_step=i)

def test_point_cloud_with_features(writer):
  pos, wss = get_rand_vecs(20)
  for i in range(10):
    writer.add_geometry(
      'test_geo_with_features',
      pos.reshape(1, 20, 3),
      features=i*wss.reshape(1, 20, 3),
      global_step=i)

def test_colored_point_cloud(writer):
  pos, _ = get_rand_vecs(10)
  colors = torch.linspace(0, 255, steps=10)
  colors = torch.stack([colors, colors, colors], dim=1)
  for i in range(10):
    writer.add_geometry(
      'test_colored_geo',
      pos.reshape(1, 10, 3),
      vert_colors=colors.reshape(1, 10, 3),
      global_step=i)

def test_multiple_point_clouds(writer):
  pos, _ = get_rand_vecs(100)
  colors = torch.linspace(0, 255, steps=100)
  colors = torch.stack([colors, colors, colors], dim=1)

  pos = torch.stack([pos, pos.add(5), pos.add(-5)], dim=0)
  colors = torch.stack([colors, colors, colors], dim=0)

  for i in range(10):
    writer.add_geometry(
      'test_batches',
      pos.reshape(3, 100, 3),
      vert_colors=colors.reshape(3, 100, 3),
      global_step=i)
