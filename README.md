# Geometry Plugin
![version](https://img.shields.io/pypi/v/tensorboard-plugin-geometry)

Since geometric deep learning is rising, there is the need of a tensorboard plugin to visualize geometric data. In comparison to the Mesh plugin from tensorboard, this plugin is more stable and offers the opportunity to add feature vectors for each vertex.

Main features:
 * method to extend the SummaryWriter
 * visualize point clouds, meshes, and 3D feature vectors for each vertex
 * apply colormaps from [colormap](https://github.com/bpostlethwaite/colormap#readme) to point clouds and 3D feature vectors
 * perspective and orthografic visualization
 * save the visualization as .png

Known issues:
 * large geometries (above 40K vertices) with feature vectors need some time to be loaded and visualized
 * faces cannot be colored separately. Either use point clouds or color the whole mesh (see Usage).

Future features:
  - [ ] Use official tensorboard api, when finally provided.
  - [ ] If you have requests, please create an issue.
  

## Installation

```bash
$ pip install tensorboard-plugin-geometry
```

## Usage

Currently, only pytorch is supported. Since it offeres a great library [geometric pytorch](https://github.com/rusty1s/pytorch_geometric) to apply machine learning to graphs.

### write summaries

To write summaries, load the summary writing method and add this to the SummaryWriter.

```python
from torch.utils.tensorboard import SummaryWriter

from tensorboard_plugin_geometry import add_geometry

# add writer function from this package
SummaryWriter.add_geometry = add_geometry

writer = SummaryWriter(log_dir='/a/path/to/logs')

# write data
writer.add_geometry('a beautiful tag', pos.reshape(1, 100, 3), features=wss.reshape(1, 100, 3), global_step=1)
```

## Docs

### add_geometry()

Add meshes or 3D point clouds to TensorBoard. The visualization is based on Three.js, so it allows users to interact with the rendered object. Besides the basic definitions such as vertices, faces, users can further provide camera parameter, scene background.
    
#### Arguments:
Name | Shape | Type |Description
-----|-------|------|-------
`tag`     |                                  | `string`      | Data identifier
`vertices`| (B, #vertices, 3) | `torch.float` | List of the 3D coordinates of vertices.
`vert_colors`| (B, #vertices, 3)| `torch.uint8` | List of colors from 0 to 255 for each vertex.
`faces`      | (B, #faces, 3)   | `torch.int`   | Indices of vertices within each triangle. (Optional)
`face_color` | (B, 3)   | `torch.uint8` | List of colors for each sample in range [0,255]. (Optional)
`features`   | (B, #vertices, 3)| `torch.float` | feature vectors for each vertex (Optional)
`feat_colors`| (B, #vertices, 3)| `torch.uint8` | List of colors from 0 to 255 for each feature. (Optional)
`config_dict`| | `dict` | Dictionary with ThreeJS configuration. (Optional)
`global_step`| | `int`  |Global step value to record (Optional)
`walltime`| | `float` | Optional override default walltime (time.time()) seconds after epoch of event (Optional)
`description`| | `string` | A longform readable description of the summary data. Markdown is supported. (Optional)

#### ThreeJS Config

The following configs are supported. For all colormaps look [here](https://github.com/bpostlethwaite/colormap#readme). For more information on the camera attributes look [here](https://threejs.org/docs/index.html#api/en/cameras/PerspectiveCamera).

All colors must be given in the range [0, 255].

```python
{
  vertices_cmap: 'jet',
  features_cmap: 'jet',
  mesh_color: [245, 124, 0],
  camera: {
    type: 'perspective', # either 'perspective' or 'orthografic'
    position: [x, y, z], # default is calculated to fit to objects in scene
    far: 1000, # far plane of camera
    near: 0.1, # near plane of camera
    
    # if type is perspective
    fov: 50,
    
    # if type is orthografic
    left: float, # default is calculated to fit to objects in scene
    right: float,
    top: float,
    bottom: float,
  },
  scene: {
    background_color: [240, 240, 240];
  };
}
```
