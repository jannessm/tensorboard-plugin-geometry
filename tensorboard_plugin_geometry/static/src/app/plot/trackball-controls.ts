import {
	EventDispatcher,
	MOUSE,
	OrthographicCamera,
	PerspectiveCamera,
	Quaternion,
	Vector2,
	Vector3
} from "three";

enum STATE {
	NONE = - 1,
	ROTATE = 0,
	DOLLY = 1,
	PAN = 2,
	TOUCH_ROTATE = 3,
	TOUCH_ZOOM_PAN = 4
}

// events
const changeEvent = { type: 'change' };
const startEvent = { type: 'start' };
const endEvent = { type: 'end' };

export class TrackballControls extends EventDispatcher {
	object;
	domElement;

	// API
	enabled = true;

	screen = { left: 0, top: 0, width: 0, height: 0 };

	rotateSpeed = 1.0;
	zoomSpeed = 1.2;
	panSpeed = 0.3;

	noRotate = false;
	noZoom = false;
	noPan = false;

	staticMoving = true;
	dynamicDampingFactor = 0.2;

	minDistance = 0;
	maxDistance = Infinity;

	keys = [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];

	mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN };

	// internals
	target = new Vector3();

	EPS = 0.000001;

	lastPosition = new Vector3();
	lastZoom = 1;

	_state = STATE.NONE;
	_keyState = STATE.NONE;

	_eye = new Vector3();

	_movePrev = new Vector2();
	_moveCurr = new Vector2();

	_lastAxis = new Vector3();
	_lastAngle = 0;

	_zoomStart = new Vector2();
	_zoomEnd = new Vector2();

	_touchZoomDistanceStart = 0;
	_touchZoomDistanceEnd = 0;

	_panStart = new Vector2();
	_panEnd = new Vector2();

	// for reset
	target0;
	position0;
	up0;
	zoom0;

	constructor(object: PerspectiveCamera | OrthographicCamera, domElement) {
		super();

		if ( domElement === undefined ) console.warn( 'THREE.TrackballControls: The second parameter "domElement" is now mandatory.' );
		if ( domElement === document ) console.error( 'THREE.TrackballControls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.' );

		this.object = object;
		this.domElement = domElement;

		// for reset
		this.target0 = this.target.clone();
		this.position0 = this.object.position.clone();
		this.up0 = this.object.up.clone();
    this.zoom0 = this.object.zoom;
    
    this.domElement.addEventListener( 'contextmenu', this.contextmenu.bind(this), false );

    this.domElement.addEventListener( 'pointerdown', this.onPointerDown.bind(this), false );
    this.domElement.addEventListener( 'wheel', this.mousewheel.bind(this), false );

    this.domElement.addEventListener( 'touchstart', this.touchstart.bind(this), false );
    this.domElement.addEventListener( 'touchend', this.touchend.bind(this), false );
    this.domElement.addEventListener( 'touchmove', this.touchmove.bind(this), false );

    this.domElement.ownerDocument.addEventListener( 'pointermove', this.onPointerMove.bind(this), false );
    this.domElement.ownerDocument.addEventListener( 'pointerup', this.onPointerUp.bind(this), false );

    window.addEventListener( 'keydown', this.keydown.bind(this), false );
    window.addEventListener( 'keyup', this.keyup.bind(this), false );

    this.handleResize();

    // force an update at start
    this.update();
	}

	handleResize() {
		const box = this.domElement.getBoundingClientRect();
		// adjustments come from similar code in the jquery offset() function
		const d = this.domElement.ownerDocument.documentElement;
		this.screen.left = box.left + window.pageXOffset - d.clientLeft;
		this.screen.top = box.top + window.pageYOffset - d.clientTop;
		this.screen.width = box.width;
		this.screen.height = box.height;
	}

	getMouseOnScreen(pageX, pageY) {
		const vector = new Vector2();

    vector.set(
      ( pageX - this.screen.left ) / this.screen.width,
      ( pageY - this.screen.top ) / this.screen.height
    );

    return vector;
  }
  
  getMouseOnCircle(pageX, pageY) {
    const vector = new Vector2();

    vector.set(
      ( ( pageX - this.screen.width * 0.5 - this.screen.left ) / ( this.screen.width * 0.5 ) ),
      ( ( this.screen.height + 2 * ( this.screen.top - pageY ) ) / this.screen.width ) // screen.width intentional
    );

    return vector;
  }

  rotateCamera() {
    let axis = new Vector3(),
			quaternion = new Quaternion(),
			eyeDirection = new Vector3(),
			objectUpDirection = new Vector3(),
			objectSidewaysDirection = new Vector3(),
			moveDirection = new Vector3(),
      angle = 0;
    
    moveDirection.set( this._moveCurr.x - this._movePrev.x, this._moveCurr.y - this._movePrev.y, 0 );
    angle = moveDirection.length();

    if ( angle ) {

      this._eye.copy( this.object.position ).sub( this.target );

      eyeDirection.copy( this._eye ).normalize();
      objectUpDirection.copy( this.object.up ).normalize();
      objectSidewaysDirection.crossVectors( objectUpDirection, eyeDirection ).normalize();

      objectUpDirection.setLength( this._moveCurr.y - this._movePrev.y );
      objectSidewaysDirection.setLength( this._moveCurr.x - this._movePrev.x );

      moveDirection.copy( objectUpDirection.add( objectSidewaysDirection ) );

      axis.crossVectors( moveDirection, this._eye ).normalize();

      angle *= this.rotateSpeed;
      quaternion.setFromAxisAngle( axis, angle );

      this._eye.applyQuaternion( quaternion );
      this.object.up.applyQuaternion( quaternion );

      this._lastAxis.copy( axis );
      this._lastAngle = angle;

    } else if ( ! this.staticMoving && this._lastAngle ) {

      this._lastAngle *= Math.sqrt( 1.0 - this.dynamicDampingFactor );
      this._eye.copy( this.object.position ).sub( this.target );
      quaternion.setFromAxisAngle( this._lastAxis, this._lastAngle );
      this._eye.applyQuaternion( quaternion );
      this.object.up.applyQuaternion( quaternion );

    }

    this._movePrev.copy( this._moveCurr );
  }

  zoomCamera() {
    let factor;

		if ( this._state === STATE.TOUCH_ZOOM_PAN ) {

			factor = this._touchZoomDistanceStart / this._touchZoomDistanceEnd;
			this._touchZoomDistanceStart = this._touchZoomDistanceEnd;

			if ( this.object.isPerspectiveCamera ) {

				this._eye.multiplyScalar( factor );

			} else if ( this.object.isOrthographicCamera ) {

				this.object.zoom *= factor;
				this.object.updateProjectionMatrix();

			} else {

				console.warn( 'THREE.TrackballControls: Unsupported camera type' );

			}

		} else {

			factor = 1.0 + ( this._zoomEnd.y - this._zoomStart.y ) * this.zoomSpeed;

			if ( factor !== 1.0 && factor > 0.0 ) {

				if ( this.object.isPerspectiveCamera ) {

					this._eye.multiplyScalar( factor );

				} else if ( this.object.isOrthographicCamera ) {

					this.object.zoom /= factor;
					this.object.updateProjectionMatrix();

				} else {

					console.warn( 'THREE.TrackballControls: Unsupported camera type' );

				}

			}

			if ( this.staticMoving ) {

				this._zoomStart.copy( this._zoomEnd );

			} else {

				this._zoomStart.y += ( this._zoomEnd.y - this._zoomStart.y ) * this.dynamicDampingFactor;

			}

		}
  }

  panCamera() {
    const mouseChange = new Vector2(),
			objectUp = new Vector3(),
      pan = new Vector3();
      
    mouseChange.copy( this._panEnd ).sub( this._panStart );

    if ( mouseChange.lengthSq() ) {

      if ( this.object.isOrthographicCamera ) {

        var scale_x = ( this.object.right - this.object.left ) / this.object.zoom / this.domElement.clientWidth;
        var scale_y = ( this.object.top - this.object.bottom ) / this.object.zoom / this.domElement.clientWidth;

        mouseChange.x *= scale_x;
        mouseChange.y *= scale_y;

      }

      mouseChange.multiplyScalar( this._eye.length() * this.panSpeed );

      pan.copy( this._eye ).cross( this.object.up ).setLength( mouseChange.x );
      pan.add( objectUp.copy( this.object.up ).setLength( mouseChange.y ) );

      this.object.position.add( pan );
      this.target.add( pan );

      if ( this.staticMoving ) {

        this._panStart.copy( this._panEnd );

      } else {

        this._panStart.add( mouseChange.subVectors( this._panEnd, this._panStart ).multiplyScalar( this.dynamicDampingFactor ) );

      }

    }
  }

  checkDistances() {
    if ( ! this.noZoom || ! this.noPan ) {

			if ( this._eye.lengthSq() > this.maxDistance * this.maxDistance ) {

				this.object.position.addVectors( this.target, this._eye.setLength( this.maxDistance ) );
				this._zoomStart.copy( this._zoomEnd );

			}

			if ( this._eye.lengthSq() < this.minDistance * this.minDistance ) {

				this.object.position.addVectors( this.target, this._eye.setLength( this.minDistance ) );
				this._zoomStart.copy( this._zoomEnd );

			}

		}
  }

  update() {
    this._eye.subVectors( this.object.position, this.target );

		if ( ! this.noRotate ) {

			this.rotateCamera();

		}

		if ( ! this.noZoom ) {

			this.zoomCamera();

		}

		if ( ! this.noPan ) {

			this.panCamera();

		}

		this.object.position.addVectors( this.target, this._eye );

		if ( this.object.isPerspectiveCamera ) {

			this.checkDistances();

			this.object.lookAt( this.target );

			if ( this.lastPosition.distanceToSquared( this.object.position ) > this.EPS ) {

				this.dispatchEvent( changeEvent );

				this.lastPosition.copy( this.object.position );

			}

		} else if ( this.object.isOrthographicCamera ) {

			this.object.lookAt( this.target );

			if ( this.lastPosition.distanceToSquared( this.object.position ) > this.EPS || this.lastZoom !== this.object.zoom ) {

				this.dispatchEvent( changeEvent );

				this.lastPosition.copy( this.object.position );
				this.lastZoom = this.object.zoom;

			}

		} else {

			console.warn( 'THREE.TrackballControls: Unsupported camera type' );

		}
  }

  reset() {
    this._state = STATE.NONE;
		this._keyState = STATE.NONE;

		this.target.copy( this.target0 );
		this.object.position.copy( this.position0 );
		this.object.up.copy( this.up0 );
		this.object.zoom = this.zoom0;

		this.object.updateProjectionMatrix();

		this._eye.subVectors( this.object.position, this.target );

		this.object.lookAt( this.target );

		this.dispatchEvent( changeEvent );

		this.lastPosition.copy( this.object.position );
		this.lastZoom = this.object.zoom;
  }

  onPointerDown(event) {
    if ( this.enabled === false ) return;

		switch ( event.pointerType ) {

			case 'mouse':
			case 'pen':
				this.onMouseDown( event );
				break;

			// TODO touch

		}
  }

  onPointerMove( event ) {

		if ( this.enabled === false ) return;

		switch ( event.pointerType ) {

			case 'mouse':
			case 'pen':
				this.onMouseMove( event );
				break;

			// TODO touch

		}

  }
  
  onPointerUp( event ) {

		if ( this.enabled === false ) return;

		switch ( event.pointerType ) {

			case 'mouse':
			case 'pen':
				this.onMouseUp( event );
				break;

			// TODO touch

		}

  }
  
  keydown( event ) {

		if ( this.enabled === false ) return;

		window.removeEventListener( 'keydown', this.keydown.bind(this) );

		if ( this._keyState !== STATE.NONE ) {

			return;

		} else if ( event.keyCode === this.keys[ STATE.ROTATE ] && ! this.noRotate ) {

			this._keyState = STATE.ROTATE;

		} else if ( event.keyCode === this.keys[ STATE.DOLLY ] && ! this.noZoom ) {

			this._keyState = STATE.DOLLY;

		} else if ( event.keyCode === this.keys[ STATE.PAN ] && ! this.noPan ) {

			this._keyState = STATE.PAN;

		}

  }
  
  keyup() {

		if ( this.enabled === false ) return;

		this._keyState = STATE.NONE;

		window.addEventListener( 'keydown', this.keydown.bind(this), false );

  }
  
  onMouseDown( event ) {

		event.preventDefault();
		event.stopPropagation();

		if ( this._state === STATE.NONE ) {

			switch ( event.button ) {

				case this.mouseButtons.LEFT:
					this._state = STATE.ROTATE;
					break;

				case this.mouseButtons.MIDDLE:
					this._state = STATE.DOLLY;
					break;

				case this.mouseButtons.RIGHT:
					this._state = STATE.PAN;
					break;

				default:
					this._state = STATE.NONE;

			}

		}

		var state = ( this._keyState !== STATE.NONE ) ? this._keyState : this._state;

		if ( state === STATE.ROTATE && ! this.noRotate ) {

			this._moveCurr.copy( this.getMouseOnCircle( event.pageX, event.pageY ) );
			this._movePrev.copy( this._moveCurr );

		} else if ( state === STATE.DOLLY && ! this.noZoom ) {

			this._zoomStart.copy( this.getMouseOnScreen( event.pageX, event.pageY ) );
			this._zoomEnd.copy( this._zoomStart );

		} else if ( state === STATE.PAN && ! this.noPan ) {

      this._panStart.copy( this.getMouseOnScreen( event.pageX, event.pageY ) );
			this._panEnd.copy( this._panStart );

		}

		this.domElement.ownerDocument.addEventListener( 'pointermove', this.onPointerMove.bind(this), false );
		this.domElement.ownerDocument.addEventListener( 'pointerup', this.onPointerUp.bind(this), false );

		this.dispatchEvent( startEvent );

  }
  
  onMouseMove( event ) {

		if ( this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		var state = ( this._keyState !== STATE.NONE ) ? this._keyState : this._state;

		if ( state === STATE.ROTATE && ! this.noRotate ) {

			this._moveCurr.copy( this.getMouseOnCircle( event.pageX, event.pageY ) );

		} else if ( state === STATE.DOLLY && ! this.noZoom ) {

      this._zoomEnd.copy( this.getMouseOnScreen( event.pageX, event.pageY ) );

		} else if ( state === STATE.PAN && ! this.noPan ) {

			this._panEnd.copy( this.getMouseOnScreen( event.pageX, event.pageY ) );

		}

  }
  
  onMouseUp( event ) {

		if ( this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		this._state = STATE.NONE;

		this.domElement.ownerDocument.removeEventListener( 'pointermove', this.onPointerMove.bind(this) );
		this.domElement.ownerDocument.removeEventListener( 'pointerup', this.onPointerUp.bind(this) );

		this.dispatchEvent( endEvent );

  }
  
  mousewheel( event ) {

		if ( this.enabled === false ) return;

		if ( this.noZoom === true ) return;

		event.preventDefault();
		event.stopPropagation();

		switch ( event.deltaMode ) {

			case 2:
				// Zoom in pages
				this._zoomStart.y -= event.deltaY * 0.025;
				break;

			case 1:
				// Zoom in lines
				this._zoomStart.y -= event.deltaY * 0.01;
				break;

			default:
				// undefined, 0, assume pixels
				this._zoomStart.y -= event.deltaY * 0.00025;
				break;

		}

		this.dispatchEvent( startEvent );
		this.dispatchEvent( endEvent );

  }
  
  touchstart( event ) {

		if ( this.enabled === false ) return;

		event.preventDefault();

		switch ( event.touches.length ) {

			case 1:
				this._state = STATE.TOUCH_ROTATE;
				this._moveCurr.copy( this.getMouseOnCircle( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
				this._movePrev.copy( this._moveCurr );
				break;

			default: // 2 or more
			  this._state = STATE.TOUCH_ZOOM_PAN;
				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				this._touchZoomDistanceEnd = this._touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy );

				var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
				var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
				this._panStart.copy( this.getMouseOnScreen( x, y ) );
				this._panEnd.copy( this._panStart );
				break;

		}

		this.dispatchEvent( startEvent );

  }
  
  touchmove( event ) {

		if ( this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		switch ( event.touches.length ) {

			case 1:
				this._movePrev.copy( this._moveCurr );
				this._moveCurr.copy( this.getMouseOnCircle( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
				break;

			default: // 2 or more
				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				this._touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy );

				var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
				var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
				this._panEnd.copy( this.getMouseOnScreen( x, y ) );
				break;

		}

  }
  
  touchend( event ) {

		if ( this.enabled === false ) return;

		switch ( event.touches.length ) {

			case 0:
				this._state = STATE.NONE;
				break;

			case 1:
				this._state = STATE.TOUCH_ROTATE;
				this._moveCurr.copy( this.getMouseOnCircle( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
				this._movePrev.copy( this._moveCurr );
				break;

		}

		this.dispatchEvent( endEvent );

  }
  
  contextmenu( event ) {

		if ( this.enabled === false ) return;

		event.preventDefault();

  }
  
  dispose() {
    this.domElement.removeEventListener( 'contextmenu', this.contextmenu.bind(this), false );

		this.domElement.removeEventListener( 'pointerdown', this.onPointerDown.bind(this), false );
		this.domElement.removeEventListener( 'wheel', this.mousewheel.bind(this), false );

		this.domElement.removeEventListener( 'touchstart', this.touchstart.bind(this), false );
		this.domElement.removeEventListener( 'touchend', this.touchend.bind(this), false );
		this.domElement.removeEventListener( 'touchmove', this.touchmove.bind(this), false );

		this.domElement.ownerDocument.removeEventListener( 'pointermove', this.onPointerMove.bind(this), false );
		this.domElement.ownerDocument.removeEventListener( 'pointerup', this.onPointerUp.bind(this), false );

		window.removeEventListener( 'keydown', this.keydown.bind(this), false );
		window.removeEventListener( 'keyup', this.keyup.bind(this), false );
  }
}