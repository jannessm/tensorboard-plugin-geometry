class ColorScale {
  palette = [
    'color1', // orange
    'color2', // blue
    'color3', // red
    'color4', // cyan
    'color5', // magenta
    'color6', // teal
    'color7', // grey
  ];

  map: {[run: string]: string} = {};
  map_len = 0;
  
  constructor() {}

  setDomain(runs: string[]) {
    this.map = {};
    this.map_len = 0;
    runs.forEach(val => this.addEntry(val));
  }

  addEntry(run: string) {
    if (!this.map[run]) {
      this.map[run] = this.palette[this.map_len % this.palette.length];
      this.map_len ++;
    }
  }

  getColor(run: string): string {
    return this.map[run];
  }
}

export const colorScale = new ColorScale();