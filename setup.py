import setuptools


setuptools.setup(
    name="tensorboard_plugin_geo",
    version="0.1.0",
    description="Tensorboard plugin to visualize 3D data with 3D features.",
    packages=["tensorboard_plugin_example"],
    package_data={
        "tensorboard_plugin_example": ["static/**"],
    },
    entry_points={
        "tensorboard_plugins": [
            "example = src.plugin:ExamplePlugin",
        ],
    },
)