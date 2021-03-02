import {
	Color
} from 'three';

export class Lut {
	lut: Color[] = [];
	map = [];
	n = 256;
	width = 1000;
	height = 1000;
	minV = 0;
	maxV = 1;

	constructor(colormap = 'rainbow', numberOfColors = 32) {
		this.setColorMap( colormap, numberOfColors );
	}

	set(value: Lut): Lut {
		this.copy( value );
		return this;
	}

	setMin( min: number ): Lut {
		this.minV = min;
		return this;
	}

	setMax( max: number ): Lut {
		this.maxV = max;
		return this;
	}

	setColorMap( colormap: string, numberOfColors: number ): Lut {

		this.map = ColorMapKeywords[ colormap ] || ColorMapKeywords.rainbow;
		this.n = numberOfColors || 32;

		const step = 1.0 / this.n;

		this.lut.length = 0;
		for ( let i = 0; i <= 1; i += step ) {

			for ( let j = 0; j < this.map.length - 1; j ++ ) {

				if ( i >= this.map[ j ][ 0 ] && i < this.map[ j + 1 ][ 0 ] ) {

					const min = this.map[ j ][ 0 ];
					const max = this.map[ j + 1 ][ 0 ];

					const minColor = new Color( this.map[ j ][ 1 ] );
					const maxColor = new Color( this.map[ j + 1 ][ 1 ] );

					const color = minColor.lerp( maxColor, ( i - min ) / ( max - min ) );

					this.lut.push( color );
				}
			}
		}

		return this;
	}

	copy( lut: Lut ): Lut {
		this.lut = lut.lut;
		this.map = lut.map;
		this.n = lut.n;
		this.minV = lut.minV;
		this.maxV = lut.maxV;

		return this;
	}

	getColor( alpha: number ) {

		if ( alpha <= this.minV ) {

			alpha = this.minV;

		} else if ( alpha >= this.maxV ) {

			alpha = this.maxV;

		}

		alpha = ( alpha - this.minV ) / ( this.maxV - this.minV );

		let colorPosition = Math.round( alpha * this.n );
		colorPosition == this.n ? colorPosition -= 1 : colorPosition;

		return this.lut[ colorPosition ];
	}

	addColorMap( colormapName, arrayOfColors ) {
		ColorMapKeywords[ colormapName ] = arrayOfColors;
	};

	createCanvas() {
		var canvas = document.createElement( 'canvas' );
		canvas.width = this.width;
		canvas.height = this.height;

		this.updateCanvas( canvas );

		return canvas;
	}

	updateCanvas( canvas ) {

		var ctx = canvas.getContext( '2d' , {alpha: false});

		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		this.map.forEach((val, id) => {
			ctx.fillStyle = toColor(val[1]);
			ctx.fillRect(this.width - 32, (this.n - id - 1) / this.n * this.height, 32, this.height / this.n + 10);
		});

		
		fillText(this.minV.toPrecision(2), this.width - 44, this.height - 10, ctx);
		fillText(this.maxV.toPrecision(2), this.width - 44, 10, ctx, true);

		return canvas;
	}
}

function fillText(val, x, y, ctx, max=false) {
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(-Math.PI/2);
	
	ctx.fillStyle = '#000000';
	ctx.font = "50px Arial";
	ctx.textAlign = max ? 'right' : 'left';
	ctx.fillText(val + '', 0,0);
	ctx.restore();
}

function toColor(num) {
    num >>>= 0;
    var b = num & 0xFF,
        g = (num & 0xFF00) >>> 8,
        r = (num & 0xFF0000) >>> 16,
        a = 255 ;
    return "rgba(" + [r, g, b, a].join(",") + ")";
}

export const ColorMapKeywords = {

	'rainbow': [[ 0.0, 0x0000FF ], [ 0.2, 0x00FFFF ], [ 0.5, 0x00FF00 ], [ 0.8, 0xFFFF00 ], [ 1.0, 0xFF0000 ]],
	'cooltowarm': [[ 0.0, 0x3C4EC2 ], [ 0.2, 0x9BBCFF ], [ 0.5, 0xDCDCDC ], [ 0.8, 0xF6A385 ], [ 1.0, 0xB40426 ]],
	'blackbody': [[ 0.0, 0x000000 ], [ 0.2, 0x780000 ], [ 0.5, 0xE63200 ], [ 0.8, 0xFFFF00 ], [ 1.0, 0xFFFFFF ]],
	'grayscale': [[ 0.0, 0x000000 ], [ 0.2, 0x404040 ], [ 0.5, 0x7F7F80 ], [ 0.8, 0xBFBFBF ], [ 1.0, 0xFFFFFF ]]

};
