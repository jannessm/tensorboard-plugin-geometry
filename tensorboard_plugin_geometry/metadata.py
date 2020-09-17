from tensorboard.compat.proto.summary_pb2 import SummaryMetadata

from .plugin_data_pb2 import GeoPluginData

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

def create_summary_metadata(name, description, content_type, components, shape, json_config):
  """Creates summary metadata which defined at GeoPluginData proto.
    Arguments:
      name: Original merged (summaries of different types) summary name.
      description: Description displayed by TensorboardUI
      content_type: Value from GeoPluginData enum describing data.
      components: mask representing present parts (vertices, features, etc.) that
        belong to the summary.
      shape: list of dimensions sizes of the tensor.
      json_config: A string, JSON-serialized dictionary of ThreeJS classes
        configuration.
    Returns:
      A `summary_pb2.SummaryMetadata` protobuf object.
  """
  
  # Shape should be at least BxNx3 where B represents the batch dimensions
  # and N - the number of points, each with x,y,z coordinates.
  if len(shape) != 3 and content_type != GeoPluginData.FACE_COLORS:
    raise ValueError(
      "Tensor shape should be of shape BxNx3, but got %s." % str(shape)
    )

  if len(shape) != 2 and content_type == GeoPluginData.FACE_COLORS:
    raise ValueError("Face color tensor must be of shape Bx3, but got %s." % str(shape))
  
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


  return SummaryMetadata(
    display_name=name,  # Will not be used in TensorBoard UI.
    summary_description=description,
    plugin_data=plugin_data,
  )

def parse_plugin_metadata(content):
  """Parse summary metadata to a Python object.
  Arguments:
    content: The `content` field of a `SummaryMetadata` proto
      corresponding to the mesh plugin.
  Returns:
    A `GeoPluginData` protobuf object.
  Raises: Error if the version of the plugin is not supported.
  """
  if not isinstance(content, bytes):
    raise TypeError("Content type must be bytes.")
  result = GeoPluginData.FromString(content)
  
  if not 0 <= result.version <= get_current_version():
    raise ValueError(
        "Unknown metadata version: %s. The latest version known to "
        "this build of TensorBoard is %s; perhaps a newer build is "
        "available?" % (result.version, get_current_version())
    )
  
  return result

def get_instance_name(tag, content_type):
  return "%s_%s" % (
    tag,
    GeoPluginData.ContentType.Name(content_type)
  )
