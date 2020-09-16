# Plugin

## compile Prototype

1. get protobuf from [here][https://github.com/protocolbuffers/protobuf] and install it.
2. run `protoc -I=. --python_out=. ./plugin_data.proto`