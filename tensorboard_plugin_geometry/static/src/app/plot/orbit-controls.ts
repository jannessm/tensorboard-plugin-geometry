// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one-finger move
//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
//    Pan - right mouse, or left mouse + ctrl/meta/shiftKey, or arrow keys / touch: two-finger move

import {
	Vector3,
	MOUSE,
	TOUCH,
	Quaternion,
	PerspectiveCamera,
	OrthographicCamera,
	Spherical,
	Vector2,
	EventDispatcher
} from "three";

enum STATE {
	NONE = - 1,
	ROTATE = 0,
	DOLLY = 1,
	PAN = 2,
	TOUCH_ROTATE = 3,
	TOUCH_PAN = 4,
	TOUCH_DOLLY_PAN = 5,
	TOUCH_DOLLY_ROTATE = 6
};

export class OrbitControls extends EventDispatcher{
	object: PerspectiveCamera | OrthographicCamera;
	domElement: HTMLElement;
	enabled = true; // Set to false to disable this control
	target = new Vector3(); // "target" sets the location of focus, where the object orbits around
	
	// How far you can dolly in and out ( PerspectiveCamera only )
	minDistance = 0;
	maxDistance = Infinity;

	// How far you can zoom in and out ( OrthographicCamera only )
	minZoom = 0;
	maxZoom = Infinity;

	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	minPolarAngle = 0; // radians
	maxPolarAngle = Math.PI; // radians

	// How far you can orbit horizontally, upper and lower limits.
	// If set, the interval [ min, max ] must be a sub-interval of [ - 2 PI, 2 PI ], with ( max - min < 2 PI )
	minAzimuthAngle = - Infinity; // radians
	maxAzimuthAngle = Infinity; // radians

	// Set to true to enable damping (inertia)
	// If damping is enabled, you must call controls.update() in your animation loop
	enableDamping = false;
	dampingFactor = 0.05;
	
	// This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
	// Set to false to disable zooming
	enableZoom = true;
	zoomSpeed = 1.0;
	
	// Set to false to disable rotating
	enableRotate = true;
	rotateSpeed = 1.0;
	
	// Set to false to disable panning
	enablePan = true;
	panSpeed = 1.0;
	screenSpacePanning = true; // if false, pan orthogonal to world-space direction camera.up
	keyPanSpeed = 7.0;	// pixels moved per arrow key push
	
	// Set to true to automatically rotate around the target
	// If auto-rotate is enabled, you must call controls.update() in your animation loop
	autoRotate = false;
	autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

	// Set to false to disable use of the keys
	enableKeys = true;

	// The four arrow keys
	keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

	// Mouse buttons
	mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN };

	// Touch fingers
	touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN };

	target0;
	position0;
	zoom0;


	//
	// internals
	//
	
	changeEvent = { type: 'change' };
	startEvent = { type: 'start' };
	endEvent = { type: 'end' };
	
	
	state = STATE.NONE;
	
	EPS = 0.000001;
	
		// current position in spherical coordinates
	spherical = new Spherical();
	sphericalDelta = new Spherical();
	
	scale = 1;
	panOffset = new Vector3();
	zoomChanged = false;
	
	rotateStart = new Vector2();
	rotateEnd = new Vector2();
	rotateDelta = new Vector2();
	
	panStart = new Vector2();
	panEnd = new Vector2();
	panDelta = new Vector2();
	
	dollyStart = new Vector2();
	dollyEnd = new Vector2();
	dollyDelta = new Vector2();

	constructor (object: PerspectiveCamera | OrthographicCamera, domElement) {
		super();

		if ( domElement === undefined )
			throw new Error( 'THREE.OrbitControls: The second parameter "domElement" is mandatory.' );

		if ( domElement === document )
			throw new Error( 'THREE.OrbitControls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.' );
	
		this.object = object;
		this.domElement = domElement;

		// for reset
		this.target0 = this.target.clone();
		this.position0 = this.object.position.clone();
		this.zoom0 = this.object.zoom;

		//
		this.domElement.addEventListener( 'contextmenu', this.onContextMenu.bind(this), false );
	
		this.domElement.addEventListener( 'pointerdown', this.onPointerDown.bind(this), false );
		this.domElement.addEventListener( 'wheel', this.onMouseWheel.bind(this), false );
	
		this.domElement.addEventListener( 'touchstart', this.onTouchStart.bind(this), false );
		this.domElement.addEventListener( 'touchend', this.onTouchEnd.bind(this), false );
		this.domElement.addEventListener( 'touchmove', this.onTouchMove.bind(this), false );
	
		this.domElement.addEventListener( 'keydown', this.onKeyDown.bind(this), false );
	
		// make sure element can receive keys.
	
		if ( this.domElement.tabIndex === - 1 ) {
	
			this.domElement.tabIndex = 0;
	
		}
	
		// force an update at start

		this.update();
	}

	//
	// public methods
	//

	getPolarAngle() {

		return this.spherical.phi;

	};

	getAzimuthalAngle() {

		return this.spherical.theta;

	};

	saveState() {

		this.target0.copy( this.target );
		this.position0.copy( this.object.position );
		this.zoom0 = this.object.zoom;

	};
	
	reset() {

		this.target.copy( this.target0 );
		this.object.position.copy( this.position0 );
		this.object.zoom = this.zoom0;

		this.object.updateProjectionMatrix();
		this.dispatchEvent( this.changeEvent );

		this.update();

		this.state = STATE.NONE;

	};
	
	// this method is exposed, but perhaps it would be better if we can make it private...
	update() {

		const offset = new Vector3();

		// so camera.up is the orbit axis
		const quat = new Quaternion().setFromUnitVectors( this.object.up, new Vector3( 0, 1, 0 ) );
		const quatInverse = quat.clone().inverse();

		const lastPosition = new Vector3();
		const lastQuaternion = new Quaternion();

		const twoPI = 2 * Math.PI;

		const position = this.object.position;
		offset.copy( position ).sub( this.target );
		
		// rotate offset to "y-axis-is-up" space
		offset.applyQuaternion( quat );
		// angle from z-axis around y-axis
		this.spherical.setFromVector3( offset );

		if ( this.autoRotate && this.state === STATE.NONE ) {
			this.rotateLeft( this.getAutoRotationAngle() );
		}

		if ( this.enableDamping ) {
			this.spherical.theta += this.sphericalDelta.theta * this.dampingFactor;
			this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor;
		} else {
			this.spherical.theta += this.sphericalDelta.theta;
			this.spherical.phi += this.sphericalDelta.phi;
		}

		// restrict theta to be between desired limits
		let min = this.minAzimuthAngle;
		let max = this.maxAzimuthAngle;

		if ( isFinite( min ) && isFinite( max ) ) {
			if ( min < - Math.PI ) min += twoPI; else if ( min > Math.PI ) min -= twoPI;

			if ( max < - Math.PI ) max += twoPI; else if ( max > Math.PI ) max -= twoPI;

			if ( min < max ) {
				this.spherical.theta = Math.max( min, Math.min( max, this.spherical.theta ) );
			} else {
				this.spherical.theta = ( this.spherical.theta > ( min + max ) / 2 ) ?
					Math.max( min, this.spherical.theta ) :
					Math.min( max, this.spherical.theta );
			}
		}

		// restrict phi to be between desired limits
		this.spherical.phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, this.spherical.phi ) );

		this.spherical.makeSafe();

		this.spherical.radius *= this.scale;

		// restrict radius to be between desired limits
		this.spherical.radius = Math.max( this.minDistance, Math.min( this.maxDistance, this.spherical.radius ) );

		// move target to panned location

		if ( this.enableDamping === true ) {
			this.target.addScaledVector( this.panOffset, this.dampingFactor );
		} else {
			this.target.add( this.panOffset );
		}

		offset.setFromSpherical( this.spherical );

		// rotate offset back to "camera-up-vector-is-up" space
		offset.applyQuaternion( quatInverse );

		position.copy( this.target ).add( offset );

		this.object.lookAt( this.target );

		if ( this.enableDamping === true ) {

			this.sphericalDelta.theta *= ( 1 - this.dampingFactor );
			this.sphericalDelta.phi *= ( 1 - this.dampingFactor );

			this.panOffset.multiplyScalar( 1 - this.dampingFactor );

		} else {
			this.sphericalDelta.set( 0, 0, 0 );
			this.panOffset.set( 0, 0, 0 );
		}

		this.scale = 1;

		// update condition is:
		// min(camera displacement, camera rotation in radians)^2 > EPS
		// using small-angle approximation cos(x/2) = 1 - x^2 / 8

		if ( this.zoomChanged ||
			lastPosition.distanceToSquared( this.object.position ) > this.EPS ||
			8 * ( 1 - lastQuaternion.dot( this.object.quaternion ) ) > this.EPS ) {

			this.dispatchEvent( this.changeEvent );

			lastPosition.copy( this.object.position );
			lastQuaternion.copy( this.object.quaternion );
			this.zoomChanged = false;

			return true;
			
		}

		return false;

	};
	
	dispose() {

		this.domElement.removeEventListener( 'contextmenu', this.onContextMenu.bind(this), false );

		this.domElement.removeEventListener( 'pointerdown', this.onPointerDown.bind(this), false );
		this.domElement.removeEventListener( 'wheel', this.onMouseWheel.bind(this), false );

		this.domElement.removeEventListener( 'touchstart', this.onTouchStart.bind(this), false );
		this.domElement.removeEventListener( 'touchend', this.onTouchEnd.bind(this), false );
		this.domElement.removeEventListener( 'touchmove', this.onTouchMove.bind(this), false );

		this.domElement.ownerDocument.removeEventListener( 'pointermove', this.onPointerMove.bind(this), false );
		this.domElement.ownerDocument.removeEventListener( 'pointerup', this.onPointerUp.bind(this), false );

		this.domElement.removeEventListener( 'keydown', this.onKeyDown.bind(this), false );

	};
	
	
	getAutoRotationAngle() {
		return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
	}
	
	getZoomScale() {
		return Math.pow( 0.95, this.zoomSpeed );
	}
	
	rotateLeft( angle ) {

		this.sphericalDelta.theta -= angle;

	}

	rotateUp( angle ) {

		this.sphericalDelta.phi -= angle;

	}
	
	panLeft( distance, objectMatrix ) {
		const v = new Vector3();

		v.setFromMatrixColumn( objectMatrix, 0 ); // get X column of objectMatrix
		v.multiplyScalar( - distance );

		this.panOffset.add( v );
	};
	
	panUp( distance, objectMatrix ) {

		const v = new Vector3();

		if ( this.screenSpacePanning === true ) {

			v.setFromMatrixColumn( objectMatrix, 1 );

		} else {

			v.setFromMatrixColumn( objectMatrix, 0 );
			v.crossVectors( this.object.up, v );

		}

		v.multiplyScalar( distance );

		this.panOffset.add( v );
	}
	
	// deltaX and deltaY are in pixels; right and down are positive
	pan( deltaX, deltaY ) {
		const offset = new Vector3();
	
		var element = this.domElement;

		if ( this.object instanceof PerspectiveCamera ) {

			// perspective
			var position = this.object.position;
			offset.copy( position ).sub( this.target );
			var targetDistance = offset.length();

			// half of the fov is center to top of screen
			targetDistance *= Math.tan( ( this.object.fov / 2 ) * Math.PI / 180.0 );

			// we use only clientHeight here so aspect ratio does not distort speed
			this.panLeft( 2 * deltaX * targetDistance / element.clientHeight, this.object.matrix );
			this.panUp( 2 * deltaY * targetDistance / element.clientHeight, this.object.matrix );

		} else if ( this.object instanceof OrthographicCamera ) {

			// orthographic
			this.panLeft( deltaX * ( this.object.right - this.object.left ) / this.object.zoom / element.clientWidth, this.object.matrix );
			this.panUp( deltaY * ( this.object.top - this.object.bottom ) / this.object.zoom / element.clientHeight, this.object.matrix );

		} else {

			// camera neither orthographic nor perspective
			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );
			this.enablePan = false;

		}
	}
	
	dollyOut( dollyScale ) {

		if ( this.object instanceof PerspectiveCamera ) {

			this.scale /= dollyScale;

		} else if ( this.object instanceof OrthographicCamera ) {
			this.object.zoom = Math.max( this.minZoom, Math.min( this.maxZoom, this.object.zoom * dollyScale ) );
			this.object.updateProjectionMatrix();
			this.zoomChanged = true;

		} else {

			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			this.enableZoom = false;

		}

	}
	
	dollyIn( dollyScale ) {
		
		if ( this.object instanceof PerspectiveCamera ) {

			this.scale *= dollyScale;

		} else if ( this.object instanceof OrthographicCamera ) {

			this.object.zoom = Math.max( this.minZoom, Math.min( this.maxZoom, this.object.zoom / dollyScale ) );
			this.object.updateProjectionMatrix();
			this.zoomChanged = true;

		} else {

			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			this.enableZoom = false;

		}

	}
	
		//
		// event callbacks - update the object state
		//
	
	handleMouseDownRotate( event ) {

		this.rotateStart.set( event.clientX, event.clientY );

	}

	handleMouseDownDolly( event ) {

		this.dollyStart.set( event.clientX, event.clientY );

	}

	handleMouseDownPan( event ) {

		this.panStart.set( event.clientX, event.clientY );

	}
	
	handleMouseMoveRotate( event ) {
		this.rotateEnd.set( event.clientX, event.clientY );

		this.rotateDelta.subVectors( this.rotateEnd, this.rotateStart ).multiplyScalar( this.rotateSpeed );

		const element = this.domElement;

		this.rotateLeft( 2 * Math.PI * this.rotateDelta.x / element.clientHeight ); // yes, height

		this.rotateUp( 2 * Math.PI * this.rotateDelta.y / element.clientHeight );

		this.rotateStart.copy( this.rotateEnd );

		this.update();

	}

	handleMouseMoveDolly( event ) {

		this.dollyEnd.set( event.clientX, event.clientY );

		this.dollyDelta.subVectors( this.dollyEnd, this.dollyStart );

		if ( this.dollyDelta.y > 0 ) {

			this.dollyOut( this.getZoomScale() );

		} else if ( this.dollyDelta.y < 0 ) {

			this.dollyIn( this.getZoomScale() );

		}

		this.dollyStart.copy( this.dollyEnd );

		this.update();

	}
	
	handleMouseMovePan( event ) {

		this.panEnd.set( event.clientX, event.clientY );

		this.panDelta.subVectors( this.panEnd, this.panStart ).multiplyScalar( this.panSpeed );

		this.pan( this.panDelta.x, this.panDelta.y );

		this.panStart.copy( this.panEnd );

		this.update();

	}

	handleMouseUp( event ) {

		// no-op

	}
	
	handleMouseWheel( event ) {

		if ( event.deltaY < 0 ) {

			this.dollyIn( this.getZoomScale() );

		} else if ( event.deltaY > 0 ) {

			this.dollyOut( this.getZoomScale() );

		}

		this.update();

	}
	
	handleKeyDown( event ) {

		let needsUpdate = false;

		switch ( event.keyCode ) {

			case this.keys.UP:
				this.pan( 0, this.keyPanSpeed );
				needsUpdate = true;
				break;

			case this.keys.BOTTOM:
				this.pan( 0, - this.keyPanSpeed );
				needsUpdate = true;
				break;

			case this.keys.LEFT:
				this.pan( this.keyPanSpeed, 0 );
				needsUpdate = true;
				break;

			case this.keys.RIGHT:
				this.pan( - this.keyPanSpeed, 0 );
				needsUpdate = true;
				break;

		}

		if ( needsUpdate ) {

			// prevent the browser from scrolling on cursor keys
			event.preventDefault();

			this.update();

		}
	}
	
	handleTouchStartRotate( event ) {

		if ( event.touches.length == 1 ) {

			this.rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		} else {

			var x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
			var y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

			this.rotateStart.set( x, y );

		}

	}

	handleTouchStartPan( event ) {

		if ( event.touches.length == 1 ) {

			this.panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		} else {

			var x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
			var y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

			this.panStart.set( x, y );

		}

	}
	
	handleTouchStartDolly( event ) {

		var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

		var distance = Math.sqrt( dx * dx + dy * dy );

		this.dollyStart.set( 0, distance );

	}

	handleTouchStartDollyPan( event ) {

		if ( this.enableZoom ) this.handleTouchStartDolly( event );

		if ( this.enablePan ) this.handleTouchStartPan( event );

	}
	
	handleTouchStartDollyRotate( event ) {

		if ( this.enableZoom ) this.handleTouchStartDolly( event );

		if ( this.enableRotate ) this.handleTouchStartRotate( event );

	}
	
	handleTouchMoveRotate( event ) {

		if ( event.touches.length == 1 ) {

			this.rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		} else {

			var x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
			var y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

			this.rotateEnd.set( x, y );

		}

		this.rotateDelta.subVectors( this.rotateEnd, this.rotateStart ).multiplyScalar( this.rotateSpeed );

		var element = this.domElement;

		this.rotateLeft( 2 * Math.PI * this.rotateDelta.x / element.clientHeight ); // yes, height

		this.rotateUp( 2 * Math.PI * this.rotateDelta.y / element.clientHeight );

		this.rotateStart.copy( this.rotateEnd );

	}
	
	handleTouchMovePan( event ) {

		if ( event.touches.length == 1 ) {

			this.panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		} else {

			var x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
			var y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

			this.panEnd.set( x, y );

		}

		this.panDelta.subVectors( this.panEnd, this.panStart ).multiplyScalar( this.panSpeed );

		this.pan( this.panDelta.x, this.panDelta.y );

		this.panStart.copy( this.panEnd );

	}
	
	handleTouchMoveDolly( event ) {

		var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

		var distance = Math.sqrt( dx * dx + dy * dy );

		this.dollyEnd.set( 0, distance );

		this.dollyDelta.set( 0, Math.pow( this.dollyEnd.y / this.dollyStart.y, this.zoomSpeed ) );

		this.dollyOut( this.dollyDelta.y );

		this.dollyStart.copy( this.dollyEnd );

	}
	
	handleTouchMoveDollyPan( event ) {

		if ( this.enableZoom ) this.handleTouchMoveDolly( event );

		if ( this.enablePan ) this.handleTouchMovePan( event );

	}

	handleTouchMoveDollyRotate( event ) {

		if ( this.enableZoom ) this.handleTouchMoveDolly( event );

		if ( this.enableRotate ) this.handleTouchMoveRotate( event );

	}

	handleTouchEnd( event ) {

		// no-op

	}
	
	//
	// event handlers - FSM: listen for events and reset state
	//

	onPointerDown( event ) {

		if ( this.enabled === false ) return;

		switch ( event.pointerType ) {

			case 'mouse':
				this.onMouseDown( event );
				break;

			// TODO touch

		}

	}

	onPointerMove( event ) {

		if ( this.enabled === false ) return;

		switch ( event.pointerType ) {

			case 'mouse':
				this.onMouseMove( event );
				break;

			// TODO touch

		}

	}
	
	onPointerUp( event ) {

		if ( this.enabled === false ) return;

		switch ( event.pointerType ) {

			case 'mouse':
				this.onMouseUp( event );
				break;

			// TODO touch

		}

	}
	
	onMouseDown( event ) {

		// Prevent the browser from scrolling.
		event.preventDefault();

		// Manually set the focus since calling preventDefault above
		// prevents the browser from setting it automatically.

		this.domElement.focus ? this.domElement.focus() : window.focus();

		var mouseAction;

		switch ( event.button ) {

			case 0:

				mouseAction = this.mouseButtons.LEFT;
				break;

			case 1:

				mouseAction = this.mouseButtons.MIDDLE;
				break;

			case 2:

				mouseAction = this.mouseButtons.RIGHT;
				break;

			default:

				mouseAction = - 1;

		}

		switch ( mouseAction ) {

			case MOUSE.DOLLY:

				if ( this.enableZoom === false ) return;

				this.handleMouseDownDolly( event );

				this.state = STATE.DOLLY;

				break;

			case MOUSE.ROTATE:

				if ( event.ctrlKey || event.metaKey || event.shiftKey ) {

					if ( this.enablePan === false ) return;

					this.handleMouseDownPan( event );

					this.state = STATE.PAN;

				} else {

					if ( this.enableRotate === false ) return;

					this.handleMouseDownRotate( event );

					this.state = STATE.ROTATE;

				}

				break;

			case MOUSE.PAN:

				if ( event.ctrlKey || event.metaKey || event.shiftKey ) {

					if ( this.enableRotate === false ) return;

					this.handleMouseDownRotate( event );

					this.state = STATE.ROTATE;

				} else {

					if ( this.enablePan === false ) return;

					this.handleMouseDownPan( event );

					this.state = STATE.PAN;

				}

				break;

			default:

				this.state = STATE.NONE;

		}

		if ( this.state !== STATE.NONE ) {

			this.domElement.ownerDocument.addEventListener( 'pointermove', this.onPointerMove.bind(this), false );
			this.domElement.ownerDocument.addEventListener( 'pointerup', this.onPointerUp.bind(this), false );

			this.dispatchEvent( this.startEvent );

		}

	}
	
	onMouseMove( event ) {

		if ( this.enabled === false ) return;

		event.preventDefault();

		switch ( this.state ) {

			case STATE.ROTATE:

				if ( this.enableRotate === false ) return;

				this.handleMouseMoveRotate( event );

				break;

			case STATE.DOLLY:

				if ( this.enableZoom === false ) return;

				this.handleMouseMoveDolly( event );

				break;

			case STATE.PAN:

				if ( this.enablePan === false ) return;

				this.handleMouseMovePan( event );

				break;

		}

	}
	
	onMouseUp( event ) {

		if ( this.enabled === false ) return;

		this.handleMouseUp( event );

		this.domElement.ownerDocument.removeEventListener( 'pointermove', this.onPointerMove.bind(this), false );
		this.domElement.ownerDocument.removeEventListener( 'pointerup', this.onPointerUp.bind(this), false );

		this.dispatchEvent( this.endEvent );

		this.state = STATE.NONE;

	}
	
	onMouseWheel( event ) {

		if ( this.enabled === false || this.enableZoom === false || ( this.state !== STATE.NONE && this.state !== STATE.ROTATE ) ) return;

		event.preventDefault();
		event.stopPropagation();

		this.dispatchEvent( this.startEvent );

		this.handleMouseWheel( event );

		this.dispatchEvent( this.endEvent );

	}

	onKeyDown( event ) {

		if ( this.enabled === false || this.enableKeys === false || this.enablePan === false ) return;

		this.handleKeyDown( event );

	}
	
	onTouchStart( event ) {

		if ( this.enabled === false ) return;

		event.preventDefault(); // prevent scrolling

		switch ( event.touches.length ) {

			case 1:

				switch ( this.touches.ONE ) {

					case TOUCH.ROTATE:

						if ( this.enableRotate === false ) return;

						this.handleTouchStartRotate( event );

						this.state = STATE.TOUCH_ROTATE;

						break;

					case TOUCH.PAN:

						if ( this.enablePan === false ) return;

						this.handleTouchStartPan( event );

						this.state = STATE.TOUCH_PAN;

						break;

					default:

						this.state = STATE.NONE;

				}

				break;

			case 2:

				switch ( this.touches.TWO ) {

					case TOUCH.DOLLY_PAN:

						if ( this.enableZoom === false && this.enablePan === false ) return;

						this.handleTouchStartDollyPan( event );

						this.state = STATE.TOUCH_DOLLY_PAN;

						break;

					case TOUCH.DOLLY_ROTATE:

						if ( this.enableZoom === false && this.enableRotate === false ) return;

						this.handleTouchStartDollyRotate( event );

						this.state = STATE.TOUCH_DOLLY_ROTATE;

						break;

					default:

						this.state = STATE.NONE;

				}

				break;

			default:

				this.state = STATE.NONE;

		}

		if ( this.state !== STATE.NONE ) {

			this.dispatchEvent( this.startEvent );

		}

	}
	
	onTouchMove( event ) {

		if ( this.enabled === false ) return;

		event.preventDefault(); // prevent scrolling
		event.stopPropagation();

		switch ( this.state ) {

			case STATE.TOUCH_ROTATE:

				if ( this.enableRotate === false ) return;

				this.handleTouchMoveRotate( event );

				this.update();

				break;

			case STATE.TOUCH_PAN:

				if ( this.enablePan === false ) return;

				this.handleTouchMovePan( event );

				this.update();

				break;

			case STATE.TOUCH_DOLLY_PAN:

				if ( this.enableZoom === false && this.enablePan === false ) return;

				this.handleTouchMoveDollyPan( event );

				this.update();

				break;

			case STATE.TOUCH_DOLLY_ROTATE:

				if ( this.enableZoom === false && this.enableRotate === false ) return;

				this.handleTouchMoveDollyRotate( event );

				this.update();

				break;

			default:

				this.state = STATE.NONE;

		}

	}

	onTouchEnd( event ) {

		if ( this.enabled === false ) return;

		this.handleTouchEnd( event );

		this.dispatchEvent( this.endEvent );

		this.state = STATE.NONE;

	}

	onContextMenu( event ) {

		if ( this.enabled === false ) return;

		event.preventDefault();

	}
}