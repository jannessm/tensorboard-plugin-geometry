import torch
from tensorboard.compat.proto.summary_pb2 import Summary
from tensorboard.compat.proto.summary_pb2 import SummaryMetadata
from tensorboard.compat.proto.tensor_pb2 import TensorProto
from tensorboard.compat.proto.tensor_shape_pb2 import TensorShapeProto
import json

from . import metadata
from .plugin_data_pb2 import GeoPluginData

def add_geometry(writer, tag, vertices, faces=None, features=None, config_dict=None, global_step=None, walltime=None):
  '''Add meshes or 3D point clouds to TensorBoard. The visualization is based on Three.js,
    so it allows users to interact with the rendered object. Besides the basic definitions
    such as vertices, faces, users can further provide camera parameter, lighting condition, etc.
    Please check https://threejs.org/docs/index.html#manual/en/introduction/Creating-a-scene for
    advanced usage.
    Args:
        tag (string): Data identifier
        vertices (torch.Tensor): List of the 3D coordinates of vertices.
        faces (torch.Tensor): Indices of vertices within each triangle. (Optional)
        features (torch.Tensor): feature vectors for each vertex
        config_dict: Dictionary with ThreeJS classes names and configuration.
        global_step (int): Global step value to record
        walltime (float): Optional override default walltime (time.time())
          seconds after epoch of event
    Shape:
        vertices: :math:`(B, N, 3)`. (batch, number_of_vertices, channels)
        faces: :math:`(B, N, 3)`. The values should lie in [0, number_of_vertices] for type `uint8`.
        features: :math:`(B, N, 3)`. (batch, number_of_vertices, channels)
  '''
  torch._C._log_api_usage_once("tensorboard.logging.add_geometry")
  writer._get_file_writer().add_summary(_geometry(tag, vertices, faces, features, config_dict), global_step=global_step)



def _geometry(tag, vertices, faces, features, display_name='name', description=None, config_dict=None):
  '''Outputs a merged `Summary` protocol buffer with a mesh/point cloud.
      Args:
        tag: A name for this summary operation.
        vertices: Tensor of shape `[dim_1, ..., dim_n, 3]` representing the 3D
          coordinates of vertices.
        faces: Tensor of shape `[dim_1, ..., dim_n, 3]` containing indices of
          vertices within each triangle.
        features: Tensor of shape `[dim_1, ..., dim_n, 3]` containing 3D features for each
          vertex.
        display_name: If set, will be used as the display name in TensorBoard.
          Defaults to `name`.
        description: A longform readable description of the summary data. Markdown
          is supported.
        config_dict: Dictionary with ThreeJS classes names and configuration.
      Returns:
        Merged summary for mesh/point cloud representation.'''
  json_config = _get_json_config(config_dict)

  summaries = []
  tensors = [
      (vertices, GeoPluginData.VERTICES),
      (faces, GeoPluginData.FACES),
      (features, GeoPluginData.FEATURES)
  ]
  tensors = [tensor for tensor in tensors if tensor[0] is not None]
  components = metadata.get_components_bitmask([
        content_type for (tensor, content_type) in tensors])

  for tensor, content_type in tensors:
      summaries.append(
          _get_tensor_summary(tag, display_name, description, tensor,
                              content_type, components, json_config))

  return Summary(value=summaries)

def _get_tensor_summary(name, display_name, description, tensor, content_type, components, json_config):
    """Creates a tensor summary with summary metadata.
    Args:
      name: Uniquely identifiable name of the summary op. Could be replaced by
        combination of name and type to make it unique even outside of this
        summary.
      display_name: Will be used as the display name in TensorBoard.
        Defaults to `name`.
      description: A longform readable description of the summary data. Markdown
        is supported.
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
        display_name,
        content_type,
        components,
        tensor.shape,
        description,
        json_config=json_config)

    tensor = TensorProto(dtype='DT_FLOAT',
                         float_val=tensor.reshape(-1).tolist(),
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