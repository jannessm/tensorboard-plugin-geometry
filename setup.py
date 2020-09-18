import setuptools

__version__ = '0.1.1'

url = 'https://github.com/jannessm/tensorboard-plugin-geometry'

with open("README.md", "r") as fh:
	long_description = fh.read()

def parse_requirements(filename):
	"""Load requirements from a pip requirements file."""
	lineiter = (line.strip() for line in open(filename))
	return [line for line in lineiter if line and not line.startswith("#")]

setuptools.setup(
    name="tensorboard_plugin_geometry",
    version=__version__,
    author='Jannes Magnusson',
    url=url,
    description="Tensorboard plugin to visualize 3D data with 3D features.",
	long_description=long_description,
	long_description_content_type="text/markdown",
	install_requires=parse_requirements("requirements.txt"),
    packages=["tensorboard_plugin_geometry"],
    package_data={
        "tensorboard_plugin_geometry": ["static/bundle/**"],
    },
    entry_points={
        "tensorboard_plugins": [
            "geometry = tensorboard_plugin_geometry.plugin:GeoPlugin",
        ],
    },
    keywords='tensorboard mesh geometries plugin'
)