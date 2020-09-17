import sys

class Suite:

  divider = '------------------%s------------------'
  failed = 0
  succeeded = 0

  def __init__(self, title, writer):
    print(self.divider % ' %s ' % title)
    self.writer = writer
  
  def run_test(self, title, callback):
    print(title, flush=True, end=' ')
    try:
      callback(self.writer)
      self.succeeded += 1
      print('✓')
    except Exception as err:
      self.failed += 1
      print('❌')
      raise err

