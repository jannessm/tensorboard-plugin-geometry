export class PendingPromise<T> {
  isPending = true;
  isRejected = false;
  internalPromise: Promise<T>;

  constructor(callback) {
    this.internalPromise = new Promise<T>(callback).then(val => {
      this.isPending = false;
      return val;
    }, (err) => {
      this.isRejected = true;
      this.isPending = false
      return err;
    });
  }

  state() {
    return this.isPending ? "pending" : this.isRejected ? "rejected" : "resolved";
  }

  then(func) {
    return this.internalPromise.then(func);
  }
}