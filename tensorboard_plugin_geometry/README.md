# Plugin

## compile Prototype

1. get protobuf from [here][https://github.com/protocolbuffers/protobuf] and install it.
2. run `protoc -I=. --python_out=. ./plugin_data.proto`

## publish package

1. bump2version (patch/minor/major)
2. python setup.py sdist bdist_wheel
3. twine check dist/*
4. twine upload dist/*