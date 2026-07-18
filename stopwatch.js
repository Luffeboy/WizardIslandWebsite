class Stopwatch { // src: https://mr-sudiptoroy.medium.com/mastering-the-javascript-stopwatch-implementation-design-patterns-72d8607a0d42
  constructor() {
    this.startTime = 0;
    this.endTime = 0;
    this.running = false;
  }

  start() {
    if (this.running) {
      console.warn("Stopwatch is already running.");
      return;
    }
    this.running = true;
    this.startTime = Date.now();
  }

  stop() {
    if (!this.running) {
      console.warn("Stopwatch is not running.");
      return;
    }
    this.endTime = Date.now();
    this.running = false;
    const duration = (this.endTime - this.startTime) / 1000; // in seconds
    console.log(`Stopwatch stopped. Duration: ${duration.toFixed(2)} seconds.`);
    return duration;
  }
}