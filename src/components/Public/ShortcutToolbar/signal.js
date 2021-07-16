import signals from 'signals';

const cache = new Map();
class Signal {
  action = new signals.Signal()
  valueChanged = new signals.Signal()
}

const shortcutToolbarSignal = {
  getByControlID: (id) => {
    let signal;
    if (!cache.has(id)) {
      signal = new Signal();
      cache.set(id, signal);
    } else {
      signal = cache.get(id);
    }
    return signal;
  },
};

export { shortcutToolbarSignal };
