
import os.path as osp
import json
import numpy as np
import six
from tensorboard.plugins import base_plugin
from tensorboard.util import tensor_util
import werkzeug
from werkzeug import wrappers

from .metadata import PLUGIN_NAME, parse_plugin_metadata
from .tag_server import TagServer
from .data_server import DataServer

class GeoPlugin(base_plugin.TBPlugin):
  plugin_name = PLUGIN_NAME

  def __init__(self, context): # ...
    self._multiplexer = context.multiplexer
    self._tag_server = TagServer(self._multiplexer, self.plugin_name)
    self._data_server = DataServer(self._multiplexer, self._tag_server)
    self._logdir = context.logdir

  def get_plugin_apps(self):
    return {
      "/app": self._serve_js,
      "/app/*": self._serve_js,
      "/assets/*": self._serve_assets,
      "/tags": self._serve_tags,
      "/data": self._serve_data,
      "/logdir": self._serve_logdir
    }

  ### Upon loading TensorBoard in browser
  def is_active(self):
    """Determines whether this plugin is active.
    This plugin is only active if TensorBoard sampled any summaries
    relevant to the geometry plugin.
    Returns:
      Whether this plugin is active.
    """
    all_runs = self._multiplexer.PluginRunToTagToContent(self.plugin_name)

    # The plugin is active if any of the runs has a tag relevant
    # to the plugin.
    return bool(self._multiplexer and any(six.itervalues(all_runs)))

  def frontend_metadata(self):
    return base_plugin.FrontendMetadata(es_module_path = "/app", tab_name = "Geometries")

  ### Route handling
  @wrappers.Request.application
  def _serve_js(self, request):
    base_path = osp.join(osp.dirname(__file__), "static", "bundle")
    req_path = request.path.split('/')
    req_path = req_path[len(req_path) - 1]

    if req_path == 'app':
      filepath = osp.join(base_path, "render.js")
    elif req_path == 'index':
      filepath = osp.join(base_path, 'index.js')
    
    with open(filepath) as infile:
      contents = infile.read()
    return werkzeug.Response(
      contents, content_type="application/javascript"
    )

  @wrappers.Request.application
  def _serve_assets(self, request):
    base_path = osp.join(osp.dirname(__file__), "static", "bundle", "assets")
    req_path = request.path.split('/')
    req_path = req_path[len(req_path) - 1]
    
    filepath = osp.join(base_path, req_path)
    file_size = osp.getsize(filepath)
    
    return werkzeug.Response(
      open(filepath, 'rb'),
      mimetype='application/octet-stream',
      headers=[
        ('Content-Length', str(file_size)),
        ('Content-Disposition', "attachment; filename=\"%s\"" % req_path),
      ],
      direct_passthrough=True)

  @wrappers.Request.application
  def _serve_tags(self, request):
    """A route (HTTP handler) that returns a response with tags.
    Args:
      request: The werkzeug.Request object.
    Returns:
      A response that contains a JSON object. The keys of the object
      are all the runs. Each run is mapped to a (potentially empty)
      list of all tags that are relevant to this plugin.
    """
    return werkzeug.Response(
      json.dumps(self._tag_server.get_tags_response()),
      content_type="application/json"
    )

  @wrappers.Request.application
  def _serve_data(self, request):
    """A route that returns data for particular summary of specified type.
    Data can represent vertices coordinates, vertices indices in faces,
    vertices colors and so on. Each mesh may have different combination of
    abovementioned data and each type/part of mesh summary must be served as
    separate roundtrip to the server.
    Args:
      request: werkzeug.Request containing content_type as a name of enum
        GeoPluginData.ContentType.
    Returns:
      werkzeug.Response either float32 or int32 data in binary format.
    """
    try:
      response = self._data_server.get_data_response(request, self.plugin_name)
    
    except ValueError:
      return werkzeug.Response("Bad content_type", "text/plain", 400)

    return werkzeug.Response(response, "arraybuffer")

  @wrappers.Request.application
  def _serve_logdir(self, request):
    return werkzeug.Response(
      json.dumps({ 'logdir': self._logdir}), content_type="application/javascript"
    )
