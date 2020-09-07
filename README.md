# Geometry Plugin

A plugin for TensorBoard to visualize 3D data with 3D feature vectors or meshes with colors for each node.

## Installation

```bash
$ pip install tensorboard-plugin-geometry
```

## Usage

Currently, only pytorch is supported.

### pytorch

```python
from torch.utils.tensorboard import SummaryWriter

from tensorboard_plugin_geometry import add_geometry

# add writer function from this package
SummaryWriter.add_geometry = add_geometry

writer = SummaryWriter(log_dir='/a/path/to/logs')

# write data
writer.add_geometry('a beautiful tag', pos.reshape(1, 100, 3), features=wss.reshape(1, 100, 3), global_step=1)
```