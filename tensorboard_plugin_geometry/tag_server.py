import six

from .metadata import parse_plugin_metadata

class TagServer():

  def __init__(self, multiplexer, plugin_name):
    self.plugin_name = plugin_name
    self._multiplexer = multiplexer

  def get_tags_response(self):
    """A route (HTTP handler) that returns a response with tags.
    Args:
      request: The werkzeug.Request object.
    Returns:
      A response that contains a JSON object. The keys of the object
      are all the runs. Each run is mapped to a (potentially empty)
      list of all tags that are relevant to this plugin.
    """

    all_runs = self._multiplexer.PluginRunToTagToContent(self.plugin_name)

    response = dict()
    for run, tag_to_content in six.iteritems(all_runs):
      response[run] = dict()

      for instance_tag, _ in six.iteritems(tag_to_content):
        
        # Make sure we only operate on user-defined tags here.
        tag = self._tag(run, instance_tag)
        meta, _ = self._instance_tag_metadata(run, instance_tag)
        
        # Batch size must be defined, otherwise we don't know how many
        # samples were there.
        response[run][tag] = {"samples": meta.shape[0]}
    
    return response


  def collect_tensor_events(self, request, step=None):
    """Collects list of tensor events based on request."""
    run = request.args.get("run")
    tag = request.args.get("tag")

    tensor_events = []  # List of tuples (meta, tensor) that contain tag.
    for instance_tag in self._instance_tags(run, tag):
        tensors = self._multiplexer.Tensors(run, instance_tag)
        meta, description = self._instance_tag_metadata(run, instance_tag)
        tensor_events += [(meta, tensor, description) for tensor in tensors]

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




########### private methods #############
  def _instance_tag_metadata(self, run, instance_tag):
    """Gets the `GeoPluginData` proto for an instance tag."""
    summary_metadata = self._multiplexer.SummaryMetadata(run, instance_tag)
    content = summary_metadata.plugin_data.content
    metadata = parse_plugin_metadata(content)

    return metadata, summary_metadata.summary_description

  def _tag(self, run, instance_tag):
    """Gets the user-facing tag name for an instance tag."""
    meta, _ = self._instance_tag_metadata(run, instance_tag)
    return meta.name

  def _instance_tags(self, run, tag):
    """Gets the instance tag names for a user-facing tag."""
    index = self._multiplexer.GetAccumulator(run).PluginTagToContent(self.plugin_name)
    
    return [
      instance_tag
      for (instance_tag, content) in six.iteritems(index)
      if tag == parse_plugin_metadata(content).name
    ]
