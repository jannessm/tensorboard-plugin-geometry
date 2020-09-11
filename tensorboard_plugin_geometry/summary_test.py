import os

from torch.utils.tensorboard import SummaryWriter
import torch
import numpy as np
import openmesh # requires an additional package

os.sys.path.append('..')
from tensorboard_plugin_geometry.summary import add_geometry

def read_ply(path):

  mesh = openmesh.read_trimesh(path)
  pos = torch.from_numpy(mesh.points()).to(torch.float)
  face = torch.from_numpy(mesh.face_vertex_indices())
  face = face.t().to(torch.long).contiguous()
  return pos, face


pos_bunny, face_bunny = read_ply(os.path.join(os.path.dirname(__file__),'..','bunny.ply'))
face_bunny = face_bunny.T
bunny_nvert = pos_bunny.shape[0]
bunny_nface = face_bunny.shape[0]
wss_bunny = torch.randn((pos_bunny.shape[0], 3)) * 0.1

for logs in ['./logs/test_plugin', './logs/another_test', './logs/a_good_one']:
  log_dir = logs

  SummaryWriter.add_geometry = add_geometry
  writer = SummaryWriter(log_dir=log_dir)

  vertices = 10

  pos = torch.randn((vertices, 3))
  pos = (pos.T / torch.norm(pos, dim=1)).T
  wss = torch.randn((vertices, 3)) * 0.1

  # test negative and positive steps
  # test geometry with features
  for i in range(-5, 5):
    writer.add_geometry(
      'test_geo',
      pos.reshape(1, vertices, 3),
      features=i*wss.reshape(1, vertices, 3),
      global_step=i)
    
  for i in range(10):
    # test geo with face and features
    writer.add_geometry(
      'bunny',
      i*pos_bunny.reshape(1, bunny_nvert, 3),
      faces=face_bunny.reshape(1, bunny_nface, 3),
      features=wss_bunny.reshape(1, bunny_nvert, 3),
      global_step=i)
    
  # test arbitary and multiple steps
  for i in np.random.randint(-5, 3, size=10):
    # test geo without features
    writer.add_geometry(
      'bunny_no_feat',
      i*pos_bunny.reshape(1, bunny_nvert, 3),
      faces=face_bunny.reshape(1, bunny_nface, 3),
      global_step=i)


  pos2 = torch.randn((vertices, 3))
  pos2 = (pos2.T / torch.norm(pos, dim=1)).T
  wss2 = torch.randn((vertices, 3)) * 0.1

  pos = torch.stack([pos, pos2])
  # test arbitary and multiple steps
  for i in np.random.randint(-5, 3, size=10):
    # test geo without features
    writer.add_geometry(
      'test_multiple_samples',
      i*pos.reshape(2, vertices, 3),
      global_step=i)

  # add normal scalar for layout comparison
  for i in range(10):
    writer.add_scalar('scalar_test', pos[i][0], global_step=i)

  writer.close()