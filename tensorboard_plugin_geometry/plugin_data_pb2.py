# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: plugin_data.proto
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from google.protobuf import reflection as _reflection
from google.protobuf import symbol_database as _symbol_database
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()




DESCRIPTOR = _descriptor.FileDescriptor(
  name='plugin_data.proto',
  package='tensorboard_plugin_geo',
  syntax='proto3',
  serialized_options=None,
  create_key=_descriptor._internal_create_key,
  serialized_pb=b'\n\x11plugin_data.proto\x12\x16tensorboard_plugin_geo\"\xa7\x02\n\rGeoPluginData\x12\x0f\n\x07version\x18\x01 \x01(\x05\x12\x0c\n\x04name\x18\x02 \x01(\t\x12G\n\x0c\x63ontent_type\x18\x03 \x01(\x0e\x32\x31.tensorboard_plugin_geo.GeoPluginData.ContentType\x12\x13\n\x0bjson_config\x18\x05 \x01(\t\x12\r\n\x05shape\x18\x06 \x03(\x05\x12\x12\n\ncomponents\x18\x07 \x01(\r\"v\n\x0b\x43ontentType\x12\r\n\tUNDEFINED\x10\x00\x12\x0c\n\x08VERTICES\x10\x01\x12\t\n\x05\x46\x41\x43\x45S\x10\x02\x12\x0c\n\x08\x46\x45\x41TURES\x10\x03\x12\x0f\n\x0bVERT_COLORS\x10\x04\x12\x0f\n\x0b\x46\x41\x43\x45_COLORS\x10\x05\x12\x0f\n\x0b\x46\x45\x41T_COLORS\x10\x06\x62\x06proto3'
)



_GEOPLUGINDATA_CONTENTTYPE = _descriptor.EnumDescriptor(
  name='ContentType',
  full_name='tensorboard_plugin_geo.GeoPluginData.ContentType',
  filename=None,
  file=DESCRIPTOR,
  create_key=_descriptor._internal_create_key,
  values=[
    _descriptor.EnumValueDescriptor(
      name='UNDEFINED', index=0, number=0,
      serialized_options=None,
      type=None,
      create_key=_descriptor._internal_create_key),
    _descriptor.EnumValueDescriptor(
      name='VERTICES', index=1, number=1,
      serialized_options=None,
      type=None,
      create_key=_descriptor._internal_create_key),
    _descriptor.EnumValueDescriptor(
      name='FACES', index=2, number=2,
      serialized_options=None,
      type=None,
      create_key=_descriptor._internal_create_key),
    _descriptor.EnumValueDescriptor(
      name='FEATURES', index=3, number=3,
      serialized_options=None,
      type=None,
      create_key=_descriptor._internal_create_key),
    _descriptor.EnumValueDescriptor(
      name='VERT_COLORS', index=4, number=4,
      serialized_options=None,
      type=None,
      create_key=_descriptor._internal_create_key),
    _descriptor.EnumValueDescriptor(
      name='FACE_COLORS', index=5, number=5,
      serialized_options=None,
      type=None,
      create_key=_descriptor._internal_create_key),
    _descriptor.EnumValueDescriptor(
      name='FEAT_COLORS', index=6, number=6,
      serialized_options=None,
      type=None,
      create_key=_descriptor._internal_create_key),
  ],
  containing_type=None,
  serialized_options=None,
  serialized_start=223,
  serialized_end=341,
)
_sym_db.RegisterEnumDescriptor(_GEOPLUGINDATA_CONTENTTYPE)


_GEOPLUGINDATA = _descriptor.Descriptor(
  name='GeoPluginData',
  full_name='tensorboard_plugin_geo.GeoPluginData',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  create_key=_descriptor._internal_create_key,
  fields=[
    _descriptor.FieldDescriptor(
      name='version', full_name='tensorboard_plugin_geo.GeoPluginData.version', index=0,
      number=1, type=5, cpp_type=1, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR,  create_key=_descriptor._internal_create_key),
    _descriptor.FieldDescriptor(
      name='name', full_name='tensorboard_plugin_geo.GeoPluginData.name', index=1,
      number=2, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=b"".decode('utf-8'),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR,  create_key=_descriptor._internal_create_key),
    _descriptor.FieldDescriptor(
      name='content_type', full_name='tensorboard_plugin_geo.GeoPluginData.content_type', index=2,
      number=3, type=14, cpp_type=8, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR,  create_key=_descriptor._internal_create_key),
    _descriptor.FieldDescriptor(
      name='json_config', full_name='tensorboard_plugin_geo.GeoPluginData.json_config', index=3,
      number=5, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=b"".decode('utf-8'),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR,  create_key=_descriptor._internal_create_key),
    _descriptor.FieldDescriptor(
      name='shape', full_name='tensorboard_plugin_geo.GeoPluginData.shape', index=4,
      number=6, type=5, cpp_type=1, label=3,
      has_default_value=False, default_value=[],
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR,  create_key=_descriptor._internal_create_key),
    _descriptor.FieldDescriptor(
      name='components', full_name='tensorboard_plugin_geo.GeoPluginData.components', index=5,
      number=7, type=13, cpp_type=3, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR,  create_key=_descriptor._internal_create_key),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
    _GEOPLUGINDATA_CONTENTTYPE,
  ],
  serialized_options=None,
  is_extendable=False,
  syntax='proto3',
  extension_ranges=[],
  oneofs=[
  ],
  serialized_start=46,
  serialized_end=341,
)

_GEOPLUGINDATA.fields_by_name['content_type'].enum_type = _GEOPLUGINDATA_CONTENTTYPE
_GEOPLUGINDATA_CONTENTTYPE.containing_type = _GEOPLUGINDATA
DESCRIPTOR.message_types_by_name['GeoPluginData'] = _GEOPLUGINDATA
_sym_db.RegisterFileDescriptor(DESCRIPTOR)

GeoPluginData = _reflection.GeneratedProtocolMessageType('GeoPluginData', (_message.Message,), {
  'DESCRIPTOR' : _GEOPLUGINDATA,
  '__module__' : 'plugin_data_pb2'
  # @@protoc_insertion_point(class_scope:tensorboard_plugin_geo.GeoPluginData)
  })
_sym_db.RegisterMessage(GeoPluginData)


# @@protoc_insertion_point(module_scope)
