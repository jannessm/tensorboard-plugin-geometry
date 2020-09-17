import torch
import numpy as np

from .utils import Suite

vertices = 10

def get_rand_vecs(vertices):
  pos = torch.randn((vertices, 3))
  pos = (pos.T / torch.norm(pos, dim=1)).T
  wss = torch.randn((vertices, 3)) * 0.1
  return pos, wss

def tests(writer):
  suite = Suite('parameter tests', writer)
  suite.run_test('negative steps', test_negative_steps)
  suite.run_test('arbitrary and multiple steps', test_arbitrary_steps)
  suite.run_test('description', test_description)
  suite.run_test('vert cmap configs', test_cmap_vertices_config)
  suite.run_test('feat cmap configs', test_cmap_features_config)
  suite.run_test('scene configs', test_threejs_config)
  suite.run_test('normal orthografic camera', test_camera_config)
  suite.run_test('orthografic configs', test_orthografic_config)

  return suite

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

def test_cmap_vertices_config(writer):
  pos, wss = get_rand_vecs(vertices)
  writer.add_geometry(
    'test_cmap_vert',
    pos.reshape(1, vertices, 3),
    features=wss.reshape(1, vertices, 3),
    config_dict={
      "vertices_cmap": 'summer',
    })

def test_cmap_features_config(writer):
  pos, wss = get_rand_vecs(vertices)
  writer.add_geometry(
    'test_cmap_feat',
    pos.reshape(1, vertices, 3),
    features=wss.reshape(1, vertices, 3),
    config_dict={
      "features_cmap": 'cool',
    })

def test_threejs_config(writer):
  pos, wss = get_rand_vecs(vertices)
  writer.add_geometry(
    'test_scene',
    pos.reshape(1, vertices, 3),
    features=wss.reshape(1, vertices, 3),
    config_dict={
      "camera": {
        "position": [0, 0, 0],
        "fov": 90,
        "far": 5,
        "near": 1
      },
      "scene": {
        "background_color": [255, 0, 0]
      }
    },
    global_step=0)

def test_camera_config(writer):
  pos, wss = get_rand_vecs(vertices)
  # use default for orthografic
  writer.add_geometry(
    'test_camera',
    pos.reshape(1, vertices, 3),
    features=wss.reshape(1, vertices, 3),
    config_dict={
      "camera": {
        "type": "orthografic"
      }
    },
    global_step=0)

def test_orthografic_config(writer):
  pos, wss = get_rand_vecs(vertices)
  # use presets for orthografic
  writer.add_geometry(
    'test_orthografic',
    pos.reshape(1, vertices, 3),
    features=wss.reshape(1, vertices, 3),
    config_dict={
      "camera": {
        "type": "orthografic",
        "left": -0.5,
        "right": 10,
        "top": 10,
        "bottom": -0.5,
        "position": [0,0,5],
        "far": 5,
        "near": 1
      }
    },
    global_step=1)
