paper.install(window);

window.onload = function() {
	paper.setup('whiteboard');
}

let tool = new Tool();

var defaultValues = {
	mode: 'draw',
	color: '#000000',
	width: 6
}

var mode = defaultValues.mode;
var color = defaultValues.color;
var width = defaultValues.width;

var paths = [];
var selectedPath;

var pathId = 0;
var path;

var clickPoint;

var isBusy = false;

function clearWhiteboard() {
	for (var i = 0; i < paths.length; i++) {
		paths[i].remove();
	}
	paths = [];
}

function readValues() {
	mode = document.getElementById('mode').value;
	color = document.getElementById('color').value;
	width = document.getElementById('width').value;

	if (!mode) {
		mode = defaultValues.mode;
	}

	try {
		width = Number(width);
		if (width < 1 || isNaN(width)) {
			width = defaultValues.width;
		}
	} catch (error) {
		width = defaultValues.width;
	}
}

function setUi() {
	chooseButton(mode);
}

function deletePathFromArray(name) {
	for (var i = 0; i < paths.length; i++) {
		if (paths[i].name == name) {
			paths.splice(i, 1);
		}
	}
}

function loadPaths(text) {
	clearWhiteboard();
	
	try {
		var loadedPaths = JSON.parse(text);
		while (loadedPaths.length > 0) {
			paths.push(new Path(loadedPaths.shift()[1]));
		}
	} catch (error) {
		alert('Text can\'t be parsed.');
	}
}

function drawSelectRectangle(firstPoint, secondPoint) {
	var rectangle = new Rectangle(firstPoint, secondPoint);
	var rectanglePath = new Path.Rectangle(rectangle);
	rectanglePath.fillColor = '#eff9ff40';
	rectanglePath.selected = true;
	rectanglePath.removeOnDrag().removeOnUp();
	return rectanglePath;
}

function selectBox(event) {
	var rect = drawSelectRectangle(clickPoint, event.point);

	for (var i = 0; i < paths.length; i++) {
		var p = paths[i];
		var intersections = rect.getIntersections(p);
		p.selected = (intersections.length > 0);
		if (rect.bounds.contains(p.interiorPoint)) {
			p.selected = true;
		}
	}
}

tool.onMouseDown = function(event) {
	readValues();
	
	project.activeLayer.selected = false;
	clickPoint = event.point;
	
	if (Key.isDown('shift') || Key.isDown('q') || Key.isDown('w')) {
		// Nothing
	} else {
		isBusy = true;
		if (mode == 'draw') {
			var pathName = '#' + pathId++;
			path = new Path({
				segments: [event.point],
				strokeColor: color,
				strokeWidth: Number(width),
				strokeCap: 'round',
				name: pathName
				// fullySelected: true
			});
			path.add(event.point);
		} else if (mode == 'del') {
			project.activeLayer.selected = false;
		}
	}
}

tool.onMouseDrag = function(event) {
	if (!isBusy && Key.isDown('shift')) {
		selectBox(event);
	} else if (!isBusy && mode == 'draw') {
		if (Key.isDown('q')) {
			var rect = new Rectangle(clickPoint, event.point);
			// 6 being the smoothing amount
			path = new Path.Rectangle(rect, 6);
		} else if (Key.isDown('w')) {
			if (Key.isDown('e')) {
				path = new Path.Circle(
					new Point(
						clickPoint.x - ((clickPoint.x - event.point.x) / 2),
						clickPoint.y - ((clickPoint.y - event.point.y) / 2)
					),
					new Point(
						(clickPoint.x - event.point.x) / 2,
						(clickPoint.y - event.point.y) / 2
					)
				);
			} else {
				var r = (clickPoint.subtract(event.point)).length;
				path = new Path.Circle({
					center: clickPoint,
					radius: r,
				});
			}
		}

		if (Key.isDown('q') || Key.isDown('w')) {
			path.strokeColor = color;
			path.strokeWidth = Number(width);
			path.removeOnDrag();
		}
	} else if (isBusy) {
		if(mode == 'draw') {
			path.add(event.point);
		} else if (mode == 'del') {
			if (event.item) {
				deletePathFromArray(event.item.name);
				event.item.remove();
			}
		} else if (mode == 'move') {
			if (Key.isDown('s')) {
				if (selectedPath) {
					selectedPath.position = selectedPath.position.add(event.delta);
				}
			} else {
				// Find distance between current point and that point
				view.center = view.center.add(clickPoint.subtract(event.point));
			}
		}
	}
}

tool.onMouseMove = function(event) {
	if (mode == 'move' && Key.isDown('s')) {
		selectedPath = null;
		project.activeLayer.selected = false;
		if (event.item) {
			selectedPath = event.item;
			event.item.selected = true;
		}
	}
}

tool.onMouseUp = function(event) {
	if (!isBusy && Key.isDown('shift')) {
		// Nothing
	} else if (!isBusy && mode == 'draw') {
		if (Key.isDown('q') || Key.isDown('w')) {
			if (path) paths.push(path);
		}
	} else if (isBusy) {
		if (mode == 'draw') {
			if(path) {
				if (path.segments.length > 5) {
					path.simplify(10);
				}
				paths.push(path);
			}
		}
	}

	path = null;
	isBusy = false;
	clickPoint = null;

	document.getElementById('save-textarea').value = JSON.stringify(paths);
}

var isSpecialKeyEnabled = false;

tool.onKeyDown = function(event) {
	readValues();
	if (event.key == 'space' || (event.keyCode == 19 || event.keyCode == 91)) {
		isSpecialKeyEnabled = true;
	}
	
	if (isSpecialKeyEnabled) {
		var keyMapper = {
			'1': 'move',
			'2': 'draw',
			'3': 'del'
		};
		if (event.key == '1' || event.key == '2' || event.key == '3') {
			mode = keyMapper[event.key];
		}
		setUi();
	}

	if (event.key == 'backspace' || event.key == 'delete') {
		var removedPathNames = [];
		var i;
		for (i = 0; i < paths.length; i++) {
			if (paths[i].selected) {
				removedPathNames.push(paths[i].name);
				paths[i].remove();
			}
		}
		for (i = 0; i < removedPathNames.length; i++) {
			deletePathFromArray(removedPathNames[i]);
		}
		document.getElementById('save-textarea').value = JSON.stringify(paths);
        // Prevent the key event from bubbling
        return false;
    }
}

tool.onKeyUp = function(event) {
	if (event.key == 's' && (mode == 'move' || selectedPath)) {
		selectedPath = null;
		project.activeLayer.selected = false;
	}
	if (event.key == 'space' || (event.keyCode == 19 || event.keyCode == 91)) {
		isSpecialKeyEnabled = false;
	}
}

var doneButton = document.getElementById('save-load-done');
doneButton.addEventListener('click', function(e) {
	if (document.getElementById('save-textarea').classList.contains('d-none')) {
		var loadText = document.getElementById('load-textarea').value.trim();
		if (loadText != '') {
			loadPaths(loadText);
		}
		document.getElementById('load-textarea').value = '';
	}
});

/* 
todo: have array of selected => http://paperjs.org/reference/project/#selecteditems
todo: add constructor functions

?	  replaced "deselectAll()" with "project.activeLayer.selected = false"
?	  maybe we can create TODO.md and CHANGELOG.md files (?)
?	  right handed and left handed mode (?)
*/
