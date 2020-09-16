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

    response = [
      self._get_tensor_data(tensor)
      for meta, tensor in tensor_events
      if meta.content_type == content_type
    ]

    np_type = {
      GeoPluginData.VERTICES: np.float32,
      GeoPluginData.VERT_COLORS: np.uint8,
      GeoPluginData.FACES: np.uint32,
      GeoPluginData.FEATURES: np.float32,
      GeoPluginData.FEAT_COLORS: np.uint8,
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
      meta, _ = self._tag_server._instance_tag_metadata(run, instance_tag)
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

  def _get_tensor_data(self, event):
    """Convert a TensorEvent into a JSON-compatible response."""
    data = tensor_util.make_ndarray(event.tensor_proto)
    return data.tolist()  
