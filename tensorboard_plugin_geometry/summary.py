import torch
from tensorboard.compat.proto.summary_pb2 import Summary
from tensorboard.compat.proto.summary_pb2 import SummaryMetadata
from tensorboard.compat.proto.tensor_pb2 import TensorProto
from tensorboard.compat.proto.tensor_shape_pb2 import TensorShapeProto
import json

from . import metadata
from .plugin_data_pb2 import GeoPluginData

tag_history = {}

def add_geometry(
  writer,
  tag,
  vertices,
  vert_colors=None,
  faces=None,
  face_colors=None,
  features=None,
  feat_colors=None,
  config_dict=None,
  global_step=None,
  walltime=None,
  description=None):
  '''Add meshes or 3D point clouds to TensorBoard. The visualization is based on Three.js,
    so it allows users to interact with the rendered object. Besides the basic definitions
    such as vertices, faces, users can further provide camera parameter, lighting condition, etc.
    Please check https://threejs.org/docs/index.html#manual/en/introduction/Creating-a-scene for
    advanced usage.
    
    Args:
        tag (string): Data identifier
        vertices (torch.Tensor): List of the 3D coordinates of vertices.
        vert_colors (torch.Tensor): List of colors from 0 to 255 for each vertex.
        faces (torch.Tensor): Indices of vertices within each triangle. (Optional)
        face_color (torch.Tensor): List of colors for each sample in range [0,255]. (Optional)
        features (torch.Tensor): feature vectors for each vertex (Optional)
        feat_colors (torch.Tensor): List of colors from 0 to 255 for each feature. (Optional)
        config_dict: Dictionary with ThreeJS configuration. (Optional)
        global_step (int): Global step value to record (Optional)
        walltime (float): Optional override default walltime (time.time())
          seconds after epoch of event (Optional)
        description (string): A longform readable description of the summary data. Markdown is
          supported. (Optional)
    Shape:
        vertices: :math:`(B, N, 3)`. (batch, number_of_vertices, channels)
        vert_colors: :math:`(B, N, 3)`. (batch, number_of_vertices, 3) with type `uint8`
        faces: :math:`(B, N, 3)`. The values should lie in [0, number_of_vertices] for type `uint32`.
        face_colors: :math:`(B, 3)`. The values should lie in [0, 255] for type `uint8`.
        features: :math:`(B, N, 3)`. (batch, number_of_features, channels)
        feat_colors: :math:`(B, N, 3)`. (batch, number_of_features, 3) with type `uint8`
  '''
  torch._C._log_api_usage_once("tensorboard.logging.add_geometry")

  n_vert = vertices.shape[1]

  # check vertices
  if vertices.shape[2] != 3:
    raise ValueError("Vertices must be of shape [B, N, 3], but got %s" % str(vertices.shape))

  # check vert_colors
  if vert_colors is not None and vert_colors.shape[2] != 3:
    raise ValueError("Colors for vertices must be of shape [B, N, 3], but got %s" % str(vert_colors.shape))
  if vert_colors is not None and vert_colors.shape[1] != n_vert:
    raise ValueError("Number of vertices and colors for vertices must match, but got %s and %s" % (str(vertices.shape), str(vert_colors.shape)))

  # check faces
  if faces is not None and faces.shape[2] != 3:
    raise ValueError("Faces must be of shape [B, N, 3] but got %s" % str(faces.shape))

  # check face colors
  if face_colors is not None and vertices.shape[0] != face_colors.shape[0]:
    raise ValueError("Numbers of samples and colors for each sample must match, but got %s and %s" % (str(vertices.shape), str(face_colors)))

  # check features
  if features is not None and features.shape[2] != 3:
    raise ValueError("Features for vertices must be of shape [B, N, 3], but got %s" % str(features.shape))
  if features is not None and features.shape[1] != n_vert:
    raise ValueError("Number of vertices and features for vertices must match, but got %s and %s" % (str(vertices.shape), str(features.shape)))

  # check feat_colors
  if feat_colors is not None and feat_colors.shape[2] != 3:
    raise ValueError("Features for vertices must be of shape [B, N, 3], but got %s" % str(feat_colors.shape))
  if feat_colors is not None and feat_colors.shape[1] != n_vert:
    raise ValueError("Number of features and colors for features must match, but got %s and %s" % (str(features.shape), str(feat_colors.shape)))

  writer._get_file_writer()  \
        .add_summary(
          _geometry(
            tag,
            vertices,
            vert_colors,
            faces,
            face_colors,
            features,
            feat_colors,
            description,
            config_dict
          ),
          global_step=global_step
        )



def _geometry(
  tag,
  vertices,
  vert_colors=None,
  faces=None,
  face_colors=None,
  features=None,
  feat_colors=None,
  description=None,
  config_dict=None):
  '''Outputs a merged `Summary` protocol buffer with meshes/point clouds.
    Args:
      tag: A name for this summary operation.
      vertices: Tensor of shape `[B, number_of_vertices, 3]` representing the 3D
        coordinates of vertices.
      vert_colors: Tensor of shape `[B, number_of_vertices, 3]` representing colors for each
        vertex. Must be in range [0, 255] for type `uint8`.
      faces: Tensor of shape `[B, number_of_faces, 3]` containing indices of
        vertices within each triangle.
      feat_colors: Tensor of shape `[B, 3]` representing colors for each
        sample. Must be in range [0, 255] for type `uint8`.
      features: Tensor of shape `[B, number_of_vertices, 3]` containing 3D features for each
        vertex.
      feat_colors: Tensor of shape `[B, number_of_vertices, 3]` representing colors for each
        feature vector. Must be in range [0, 255] for type `uint8`.
      description: A longform readable description of the summary data. Markdown is
        supported.
      config_dict: Dictionary with ThreeJS classes names and configuration.
    Returns:
      Merged summary for mesh/point cloud representation.'''
  json_config = _get_json_config(config_dict)

  tensors = [
      (vertices, GeoPluginData.VERTICES),
      (vert_colors, GeoPluginData.VERT_COLORS),
      (faces, GeoPluginData.FACES),
      (face_colors, GeoPluginData.FACE_COLORS),
      (features, GeoPluginData.FEATURES),
      (feat_colors, GeoPluginData.FEAT_COLORS)
  ]
  tensors = [tensor for tensor in tensors if tensor[0] is not None]
  
  components = metadata.get_components_bitmask(
      [content_type for (tensor, content_type) in tensors]
    )

  summaries = []
  for tensor, content_type in tensors:
    summaries.append(
      _get_tensor_summary(
        tag,
        description,
        tensor,
        content_type,
        components,
        json_config
      )
    )

  return Summary(value=summaries)

def _get_tensor_summary(name, description, tensor, content_type, components, json_config):
  """Creates a tensor summary with summary metadata.
  Args:
    name: Uniquely identifiable name of the summary op. Could be replaced by
      combination of name and type to make it unique even outside of this
      summary.
    description: A longform readable description of the summary data. Markdown is
      supported.
    tensor: Tensor to display in summary.
    content_type: Type of content inside the Tensor.
    components: Bitmask representing present parts (vertices, colors, etc.) that
      belong to the summary.
    json_config: A string, JSON-serialized dictionary of ThreeJS classes
      configuration.
  Returns:
    Tensor summary with metadata.
  """

  tensor = torch.as_tensor(tensor)

  tensor_metadata = metadata.create_summary_metadata(
      name,
      description,
      content_type,
      components,
      tensor.shape,
      json_config)

  if (
    content_type == GeoPluginData.VERTICES or
    content_type == GeoPluginData.FEATURES  
  ):
    tensor = TensorProto(dtype='DT_FLOAT',
                          float_val=tensor.reshape(-1).float().tolist(),
                          tensor_shape=TensorShapeProto(dim=[
                              TensorShapeProto.Dim(size=tensor.shape[0]),
                              TensorShapeProto.Dim(size=tensor.shape[1]),
                              TensorShapeProto.Dim(size=tensor.shape[2]),
                          ]))
  elif (
    content_type == GeoPluginData.VERT_COLORS or
    content_type == GeoPluginData.FEAT_COLORS
  ):
    tensor = TensorProto(dtype='DT_UINT8',
                          int_val=tensor.reshape(-1).type(torch.uint8).tolist(),
                          tensor_shape=TensorShapeProto(dim=[
                              TensorShapeProto.Dim(size=tensor.shape[0]),
                              TensorShapeProto.Dim(size=tensor.shape[1]),
                              TensorShapeProto.Dim(size=tensor.shape[2]),
                          ]))
  elif content_type == GeoPluginData.FACE_COLORS:
    tensor = TensorProto(dtype='DT_UINT8',
                          int_val=tensor.reshape(-1).type(torch.uint8).tolist(),
                          tensor_shape=TensorShapeProto(dim=[
                              TensorShapeProto.Dim(size=tensor.shape[0]),
                              TensorShapeProto.Dim(size=tensor.shape[1])
                          ]))
  elif content_type == GeoPluginData.FACES:
    tensor = TensorProto(dtype='DT_INT32',
                          int_val=tensor.reshape(-1).int().tolist(),
                          tensor_shape=TensorShapeProto(dim=[
                              TensorShapeProto.Dim(size=tensor.shape[0]),
                              TensorShapeProto.Dim(size=tensor.shape[1]),
                              TensorShapeProto.Dim(size=tensor.shape[2]),
                          ]))

  tensor_summary = Summary.Value(
      tag=metadata.get_instance_name(name, content_type),
      tensor=tensor,
      metadata=tensor_metadata,
  )

  return tensor_summary


def _get_json_config(config_dict):
    """Parses and returns JSON string from python dictionary."""
    json_config = '{}'
    if config_dict is not None:
        json_config = json.dumps(config_dict, sort_keys=True)
    return json_config