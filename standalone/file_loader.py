import torch
from threading import Thread
from queue import Queue

class FileLoader:

    def __init__(self):
        self.tasks = Queue()
        self.worker = Thread(target=_load, args=(self.tasks,))
        self.worker.start()
    
    def register(self, file_path, callback):
        self.tasks.put_nowait((file_path, callback))
    
def _load(queue):
    while True:
        file_path, callback = queue.get()
        callback(torch.load(file_path, map_location=torch.device('cpu')))
        queue.task_done()

loader = FileLoader()