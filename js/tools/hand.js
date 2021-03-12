function hand() {
    return (
        !whiteboard.isBusyHotKey &&
        whiteboard.mode == 'move'
    );
}

events.onMouseDown.push(function(event) { if (hand()) {
    whiteboard.isBusy = true;
}});

events.onMouseDrag.push(function(event) { if (hand()) {
    if (whiteboard.isBusy) {
        if (Key.isDown('s')) {
            let selected = whiteboard.path.selected;
            if (selected)
               selected.position = selected.position.add(event.delta);
        } else {
            if (Key.isDown('w')) {
                view.center = view.center.add(
                    new Point(0, whiteboard.click.point.y - event.point.y));
            } else if (Key.isDown('q')) {
                view.center = view.center.add(
                    new Point(whiteboard.click.point.x - event.point.x, 0));
            } else {
                view.center = view.center.add(
                    whiteboard.click.point.subtract(event.point));
            }
        }
    }
}});

events.onMouseMove.push(function(event) { if (hand()) {
    if (Key.isDown('s')) {
        whiteboard.path.selected = null;
        project.activeLayer.selected = false;
        if (event.item) {
            whiteboard.path.selected = event.item;
            event.item.selected = true;
        }
    }
}});

events.onMouseUp.push(function(event) { if (hand()) {
    resetStats();
}});

events.onKeyUp.push(function(event) {
    if (event.key == 's' &&
        (whiteboard.mode == 'move' || whiteboard.path.selected)) {
		whiteboard.path.selected = null;
		project.activeLayer.selected = false;
	}
});
