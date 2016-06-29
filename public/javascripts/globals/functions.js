function flash(dom, flashes, duration=150) {
	var bgColor = dom.css('background-color');
	var flashes = flashes * 2;
	var flashed = 0;
	var handle = setInterval(function () {
		dom.css("background-color", function () {
			if(++flashed >= flashes) {
				clearInterval(handle);
			}
			this.switch = !this.switch;
			return this.switch ? "red" : bgColor;
		});
	}, duration)
}