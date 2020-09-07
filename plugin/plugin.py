
import json
import numpy as np
import six
from tensorboard.plugins import base_plugin
from tensorboard.util import tensor_util
import werkzeug
from werkzeug import wrappers

from metadata import PLUGIN_NAME

class GeoPlugin(base_plugin.TBPlugin):
  plugin_name = PLUGIN_NAME

  def __init__(self, context): # ...
    self._multiplexer = context.multiplexer

  def get_plugin_apps(self):
    return {
      "/index.js": self._serve_js,
      "/tags": self._serve_tags,
      "/data": self._serve_data
    }

  ### Upon loading TensorBoard in browser
  def is_active(self):
    return bool(self._multiplexer.PluginRunToTagToContent(self.plugin_name))

  def frontend_metadata(self):
    return base_plugin.FrontendMetadata(es_module_path = "/index.js", tab_name = "Geometries")

  ### Route handling
  @wrappers.Request.application
  def _serve_tags(self, request): # Returns a WSGI application that responds to the request.
    del request  # unused
    
    mapping = self._multiplexer.PluginRunToTagToContent(PLUGIN_NAME)
    result = {run: {} for run in self._multiplexer.Runs()}
    
    for (run, tag_to_content) in six.iteritems(mapping):
      for tag in tag_to_content:
        summary_metadata = self._multiplexer.SummaryMetadata(run, tag)
        result[run][tag] = {
            u"description": summary_metadata.summary_description,
        }
    contents = json.dumps(result, sort_keys=True)
    return werkzeug.Response(contents, content_type="application/json")

  @wrappers.Request.application
  def _serve_data(self, request):
    run = request.args["run"]
    tag = request.args["tag"]
    data = [
        np.asscalar(tensor_util.make_ndarray(event.tensor_proto))
            .decode("utf-8")
        for event in self._multiplexer.Tensors(run, tag)
    ]
    contents = json.dumps(data, sort_keys=True)
    return werkzeug.Response(contents, content_type="application/json")
