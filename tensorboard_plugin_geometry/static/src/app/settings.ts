export interface Subscriber {
  unsubscribe: Function;
}


class SettingsClass {
  _filteredRuns: string[] = [];
  _subscriptions: Function[] = [];

  display(run: string): boolean {
    return this._filteredRuns.filter((val) => run === val).length > 0;
  }

  set filteredRuns(filteredRuns: string[]) {
    this._filteredRuns = filteredRuns;
    this._subscriptions.forEach(func => func(filteredRuns));
  }

  subscribe(callback): Subscriber {
    this._subscriptions.push(callback);
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

export const Settings = new SettingsClass();