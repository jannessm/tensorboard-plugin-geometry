import torch

def get_rand_vecs(vertices):
  pos = torch.randn((vertices, 3))
  pos = (pos.T / torch.norm(pos, dim=1)).T
  wss = torch.randn((vertices, 3)) * 0.1
  return pos, wss

def tests(writer):
  print('------------------------------')
  print('simple point cloud', end=' ')
  test_point_cloud(writer)
  print('✓')
  print('point cloud with features', end=' ')
  test_point_cloud_with_features(writer)
  print('✓')
  print('colored point cloud', end=' ')
  test_colored_point_cloud(writer)
  print('✓')
  print('multiple point clouds', end=' ')
  test_multiple_point_clouds(writer)
  print('✓')

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

  pos = torch.stack([pos, pos + 2, pos - 2], dim=0)
  colors = torch.stack([colors, colors, colors], dim=0)

  for i in range(10):
    writer.add_geometry(
      'test_batches',
      pos.reshape(3, 100, 3),
      vert_colors=colors.reshape(3, 100, 3),
      global_step=i)
