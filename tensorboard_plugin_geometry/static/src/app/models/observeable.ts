export interface Subscriber {
  unsubscribe: Function;
}

export class Observeable<T> {
  private _subscriptions: Function[] = [];
  value: T;

  constructor(init_value: T) {
    this.value = init_value;
  }

  next(value: T) {
    this.value = value;
    this._subscriptions.forEach(func => func(value));
  }

  subscribe(callback): Subscriber {
    this._subscriptions.push(callback);
    callback(this.value);
    return {
      unsubscribe: this.unsubscribe(callback)
    };
  }

  unsubscribe(callback: Function): Function {
    return () => {
      this._subscriptions = this._subscriptions.filter(val => val !== callback);
    }
  }
}