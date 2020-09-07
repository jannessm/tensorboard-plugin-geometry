import numpy as np
from tensorboard.util import tensor_util

from .plugin_data_pb2 import GeoPluginData

class DataServer():

  def __init__(self, multiplexer, tag_server):
    self._multiplexer = multiplexer
    self._tag_server = tag_server

  def get_data_response(self, request, plugin_name):
    """A route that returns data for particular summary of specified type.
    Data can represent vertices coordinates, vertices indices in faces,
    vertices colors and so on. Each mesh may have different combination of
    abovementioned data and each type/part of mesh summary must be served as
    separate roundtrip to the server.
    Args:
      request: werkzeug.Request containing content_type as a name of enum
        GeoPluginData.ContentType.
      plugin_name: identifier of the plugin
    Returns:
      data response
    """
    step = float(request.args.get("step", 0.0))
    content_type = request.args.get("content_type")
    content_type = GeoPluginData.ContentType.Value(content_type)
    
    tensor_events = self._collect_tensor_events(request, step)
    sample = int(request.args.get("sample", 0))

    response = [
      self._get_tensor_data(tensor, sample)
      for meta, tensor in tensor_events
      if meta.content_type == content_type
    ]

    np_type = {
      GeoPluginData.VERTICES: np.float32,
      GeoPluginData.FACES: np.int32,
      GeoPluginData.FEATURES: np.uint8,
    }[content_type]

    response = np.array(response, dtype=np_type)
    
    # Looks like reshape can take around 160ms, so why not store it reshaped.
    return response.reshape(-1).tobytes()





######### private methods ########
  def _collect_tensor_events(self, request, step):
    """Collects list of tensor events based on request."""
    run = request.args.get("run")
    tag = request.args.get("tag")

    tensor_events = []  # List of tuples (meta, tensor) that contain tag.
    for instance_tag in self._tag_server._instance_tags(run, tag):
      tensors = self._multiplexer.Tensors(run, instance_tag)
      meta = self._tag_server._instance_tag_metadata(run, instance_tag)
      tensor_events += [(meta, tensor) for tensor in tensors]

    if step is not None:
      tensor_events = [
        event for event in tensor_events if event[1].step == step
      ]
    else:
      # Make sure tensors sorted by step in ascending order.
      tensor_events = sorted(
        tensor_events, key=lambda tensor_data: tensor_data[1].step
      )

    return tensor_events

  def _get_tensor_data(self, event, sample):
    """Convert a TensorEvent into a JSON-compatible response."""
    data = tensor_util.make_ndarray(event.tensor_proto)
    return data[sample].tolist()

  # def _get_tensor_metadata(self, event, content_type, components, data_shape, config):
  #   """Converts a TensorEvent into a JSON-compatible response.
  #   Args:
  #     event: TensorEvent object containing data in proto format.
  #     content_type: enum plugin_data_pb2.MeshPluginData.ContentType value,
  #       representing content type in TensorEvent.
  #     components: Bitmask representing all parts (vertices, colors, etc.) that
  #       belong to the summary.
  #     data_shape: list of dimensions sizes of the tensor.
  #     config: rendering scene configuration as dictionary.
  #   Returns:
  #     Dictionary of transformed metadata.
  #   """
  #   return {
  #       "wall_time": event.wall_time,
  #       "step": event.step,
  #       "content_type": content_type,
  #       "components": components,
  #       "config": config,
  #       "data_shape": list(data_shape),
  #   }

  
