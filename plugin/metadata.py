from plugin_data_pb2 import GeoPluginData
from tensorboard.compat.proto.summary_pb2 import SummaryMetadata

PLUGIN_NAME = "geometries"

def get_current_version():
  return 0

def get_components_bitmask(content_types):
  """Creates bitmask for all existing components of the summary.
  Args:
    content_type: list of GeoPluginData.ContentType,
      representing all components related to the summary.
  Returns: bitmask based on passed tensors.
  """
  components = 0
  for content_type in content_types:
    if content_type == GeoPluginData.UNDEFINED:
      raise ValueError("Cannot include UNDEFINED content type in mask.")
    components = components | (1 << content_type)
  return components

def create_summary_metadata(name, display_name, content_type, components, shape, description=None, json_config=None):
  """Creates summary metadata which defined at GeoPluginData proto.
    Arguments:
      name: Original merged (summaries of different types) summary name.
      display_name: The display name used in TensorBoard.
      content_type: Value from GeoPluginData enum describing data.
      components: mask representing present parts (vertices, features, etc.) that
        belong to the summary.
      shape: list of dimensions sizes of the tensor.
      description: The description to show in TensorBoard.
      json_config: A string, JSON-serialized dictionary of ThreeJS classes
        configuration.
    Returns:
      A `summary_pb2.SummaryMetadata` protobuf object.
  """
  # Shape should be at least BxNx3 where B represents the batch dimensions
  # and N - the number of points, each with x,y,z coordinates.
  if len(shape) != 3:
    raise ValueError(
      "Tensor shape should be of shape BxNx3, but got %s." % str(shape)
    )
  geo_plugin_data = GeoPluginData(
    version=get_current_version(),
    name=name,
    content_type=content_type,
    components=components,
    shape=shape,
    json_config=json_config,
  )
  content = geo_plugin_data.SerializeToString()
  plugin_data = SummaryMetadata.PluginData(
    plugin_name=PLUGIN_NAME, content=content
  )

  if display_name is None:
    display_name = name

  return SummaryMetadata(
    display_name=name,  # Will not be used in TensorBoard UI.
    summary_description=description,
    plugin_data=plugin_data,
  )

def get_instance_name(tag, content_type):
  return "%s_%s" % (
    tag,
    GeoPluginData.ContentType.Name(content_type)
  )
