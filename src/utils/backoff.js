class Backoff {
  constructor(noDelay = 0, minDelay = 100, maxDelay = 2000, factor = 2) {
    this.noDelay = this.current = noDelay;
    this.minDelay = minDelay;
    this.maxDelay = maxDelay;
    this.factor = factor;
  }

  success() {
    return (this.current = this.noDelay);
  }

  fail() {
    return (this.current = Math.min(
      Math.max(this.minDelay, this.current * this.factor),
      this.maxDelay
    ));
  }
}

module.exports = Backoff;
