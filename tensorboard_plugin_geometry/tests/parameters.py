import torch
import numpy as np

vertices = 10

def get_rand_vecs(vertices):
  pos = torch.randn((vertices, 3))
  pos = (pos.T / torch.norm(pos, dim=1)).T
  wss = torch.randn((vertices, 3)) * 0.1
  return pos, wss

def tests(writer):
  print('------------------------------')
  
  print('negative steps', end=' ')
  test_negative_steps(writer)
  print('✓')
  
  print('arbitrary and multiple steps', end=' ')
  test_arbitrary_steps(writer)
  print('✓')
  
  print('description', end=' ')
  test_description(writer)
  print('✓')

  # print('background color', end=' ')
  # test_description(writer)
  # print('✓')

  # print('camera position', end=' ')
  # test_description(writer)
  # print('✓')

  # print('camera fov, far, near', end=' ')
  # test_description(writer)
  # print('✓')

  # print('cmaps', end=' ')
  # test_description(writer)
  # print('✓')

######### tests #################
def test_negative_steps(writer):
  pos, _ = get_rand_vecs(vertices)
  
  for i in range(-5, 5):
    writer.add_geometry(
      'test_geo',
      pos.reshape(1, vertices, 3),
      global_step=i)

def test_arbitrary_steps(writer):
  pos, _ = get_rand_vecs(vertices)
  for i in np.random.randint(-5, 3, size=10):
    writer.add_geometry(
      'test_geo_with_features',
      pos.reshape(1, vertices, 3),
      description="no features, no colors",
      global_step=i)

def test_description(writer):
  pos, _ = get_rand_vecs(vertices)
  for i in range(10):
    writer.add_geometry(
      'test_colored_geo',
      pos.reshape(1, vertices, 3),
      description='# this is a markdown description\nwith a lot of `text`',
      global_step=i)
