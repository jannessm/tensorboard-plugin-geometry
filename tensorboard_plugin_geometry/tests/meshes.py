import torch
import openmesh
import os

from .utils import Suite

def read_ply(path):
  mesh = openmesh.read_trimesh(path)
  pos = torch.from_numpy(mesh.points()).to(torch.float)
  face = torch.from_numpy(mesh.face_vertex_indices())
  face = face.t().to(torch.long).contiguous()
  return pos, face


pos_bunny, face_bunny = read_ply(os.path.join(os.path.dirname(__file__),'bunny.ply'))
face_bunny = face_bunny.T
bunny_nvert = pos_bunny.shape[0]
bunny_nface = face_bunny.shape[0]
wss_bunny = torch.randn((pos_bunny.shape[0], 3)) * 0.1

def tests(writer):
  suite = Suite('meshes tests', writer)
  suite.run_test('simple mesh', test_mesh)
  suite.run_test('colored mesh', test_colored_mesh)
  suite.run_test('mesh with features', test_mesh_with_features)
  suite.run_test('mesh with colored features', test_mesh_with_colored_features)
  suite.run_test('multiple meshes', test_multiple_meshes)
  return suite

######### tests #################
def test_mesh(writer):
  for i in range(10):
    writer.add_geometry(
      'test_geo',
      i * pos_bunny.reshape(1, bunny_nvert, 3),
      faces=face_bunny.reshape(1, bunny_nface, 3),
      global_step=i)

def test_mesh_with_features(writer):
  for i in range(10):
    writer.add_geometry(
      'test_geo_with_features',
      pos_bunny.reshape(1, bunny_nvert, 3),
      faces=face_bunny.reshape(1, bunny_nface, 3),
      features=wss_bunny.reshape(1, bunny_nvert, 3),
      global_step=i)

def test_colored_mesh(writer):
  face = torch.stack([face_bunny, face_bunny], dim=0)
  pos = torch.stack([pos_bunny, pos_bunny + 2], dim=0)
  
  writer.add_geometry(
    'test_colored_geo',
    pos.reshape(2, bunny_nvert, 3),
    faces=face.reshape(2, bunny_nface, 3),
    face_colors=torch.tensor([[0,255,0], [0, 0, 255]]),
    global_step=0)
  writer.add_geometry(
    'test_colored_geo',
    pos.reshape(2, bunny_nvert, 3),
    faces=face.reshape(2, bunny_nface, 3),
    face_colors=torch.tensor([[0, 0, 255], [0,255,0]]),
    global_step=1)

def test_mesh_with_colored_features(writer):
  colors = torch.linspace(0, 255, steps=bunny_nvert)
  colors = torch.stack([colors, colors, colors], dim=1)
  
  for i in range(10):
    writer.add_geometry(
      'test_colored_geo',
      pos_bunny.reshape(1, bunny_nvert, 3),
      faces=face_bunny.reshape(1, bunny_nface, 3),
      features=wss_bunny.reshape(1, bunny_nvert, 3),
      feat_colors=colors.reshape(1, bunny_nvert, 3),
      global_step=i)

def test_multiple_meshes(writer):
  face = torch.stack([face_bunny, face_bunny, face_bunny], dim=0)
  pos = torch.stack([pos_bunny, pos_bunny + 2, pos_bunny - 2], dim=0)

  for i in range(10):
    writer.add_geometry(
      'test_batches',
      pos.reshape(3, bunny_nvert, 3),
      faces=face.reshape(3, bunny_nface, 3),
      global_step=i)
