import argparse

parser = argparse.ArgumentParser(description='standalone GeoBoard to visualize geometrical data')
parser.add_argument('--host', dest='host', help='host', default='localhost')
parser.add_argument('--port', dest='port', type=int, help='port', default=8888)
parser.add_argument('--logdir', dest='logdir', help='logdir of data', default='.')
parser.add_argument('--pkls', dest='pkls', type=bool, help='if torch pkls are provided instead of tensorboard summaries.', default=True)
args = parser.parse_args()

from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs
import os.path as osp
from watchdog.observers import Observer

import torch

from run_manager import RunManager

STANDALONE_DIR = osp.abspath(osp.dirname(__file__))
STATIC_DIR = osp.join(osp.abspath(osp.dirname(__file__)), '..', 'tensorboard_plugin_geometry', 'static', 'bundle')

class GeoBoard(HTTPServer):
    observer = None

    def __init__(self, host, port, logdir):
        self.logdir = logdir
        
        self.observer = Observer()
        self.run_manager = RunManager(logdir)
        self.observer.schedule(self.run_manager, path=logdir, recursive=True)
        self.observer.start()

        HTTPServer.__init__(self, (host, port), GeoBoardRequestHandler)

    def __del__(self):
        if self.observer is not None:
            self.observer.stop()
            self.observer.join()
    
    def get_tags(self):
        return self.run_manager.get_tags()
    
    def get_samples_for_tag(self, run, tag):
        return self.run_manager.runs[run].tags[tag].get_samples_metadata()


class GeoBoardRequestHandler(BaseHTTPRequestHandler):

    def do_GET(self):
        global webServer
        
        #### files #####
        if self.path == '/':
            self.send_response(200)
            self.serve_file('index.html', True)
        elif self.path == '/index.js':
            self.send_response(200)
            self.serve_file('index.js')
        elif 'assets' in self.path:
            self.send_response(200)
            self.serve_file(self.path[1:])
        
        #### tensorboard api ####
        elif self.path == '/tags':
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(webServer.get_tags().encode())
        
        elif self.path == '/logdir':
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(('{"logdir": "%s"}' % webServer.logdir).encode())
        
        elif 'geometries' in self.path:
            args = parse_qs(self.path[len('geometries') + 2:])
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(webServer.get_samples_for_tag(args['run'][0], args['tag'][0]))

        else:
            self.send_response(404)

    def serve_file(self, file_name, standalone=False):
        global STANDALONE_DIR, STATIC_DIR
        if standalone:
            p = osp.join(STANDALONE_DIR, file_name)
        else:
            p = osp.join(STATIC_DIR, file_name)
        print(p)

        #### correct content-type ####
        content_type = 'text/plain'
        if p.endswith('.html'):
            content_type = 'text/html'
        elif p.endswith('.eot') or p.endswith('.ttf') or p.endswith('.woff') or p.endswith('.woff2'):
            content_type = 'application/octet-stream'

        self.send_header("Content-type", content_type)
        self.end_headers()
        
        content = open(p, 'rb').read()
        self.wfile.write(content)

if __name__ == "__main__":
    webServer = GeoBoard(args.host, args.port, args.logdir)
    print("Server started http://%s:%s" % (args.host, args.port))

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
    print("Server stopped.")