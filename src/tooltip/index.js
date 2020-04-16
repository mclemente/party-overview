class Tooltip extends CanvasLayer {
  constructor() {
    super();
    this.init();
  }

  init() {
    this.container = new PIXI.Container();
    this.maxWidth = 300;
    this.padding = 6;
    this.margin = 15;
    this.linesMargin = 4;
    this.width = 0;
    this.height = 0;
    this.addChild(this.container);
  }

  async draw() {
    super.draw();
  }

  updateTooltip(position, lines) {
    this.container.removeChildren();
    let height = 0;
    let width = 0;
    let texts = [];

    // drawing the text line by line
    for (let i = 0; i < lines.length; i++) {
      let l = lines[i];

      let label = new PIXI.Text(l.label + ": ", {
        fontSize: 14,
        fontFamily: "Arial",
        fontWeight: "normal", //l.bold ? "bold" : "normal",
        fill: "#000000", //l.color,
        wordWrap: false,
        wordWrapWidth: this.maxWidth,
      });
      label.x = this.padding;
      label.y = this.padding + height;
      height += label.height + this.linesMargin;

      let value = new PIXI.Text(l.value, {
        fontSize: 14,
        fontFamily: "Arial",
        fontWeight: "bold", //l.bold ? "bold" : "normal",
        fill: "#000000", //l.color,
        wordWrap: false,
        wordWrapWidth: this.maxWidth,
      });
      value.x = label.x + label.width;
      value.y = label.y;

      if (width < label.width + value.width) width = label.width + value.width;
      texts.push(label);
      texts.push(value);
    }

    height -= this.linesMargin;
    if (height < 0) height = 0;

    this.width = width;
    this.height = height;

    var rect = new PIXI.Graphics();
    // force canvas rendering for rectangle
    rect.cacheAsBitmap = true;
    rect.lineStyle(2, 0x000000, 0.6);
    rect.beginFill(0xffffff, 0.8);
    rect.drawRoundedRect(
      0,
      0,
      width + this.padding * 2,
      height + this.padding * 2,
      6
    );
    width = width + this.padding * 2;
    height = height + this.padding * 2;

    rect.endFill();
    this.container.addChild(rect);

    // triangle
    const triangleWidth = 16,
      triangleHeight = 10;
    var triangle = new PIXI.Graphics();
    // force canvas rendering for rectangle
    triangle.cacheAsBitmap = true;
    triangle.lineStyle(2, 0x000000, 0.6);
    triangle.beginFill(0xffffff, 0.8);

    triangle.moveTo(
      Math.round(width / 2) - Math.floor(triangleWidth / 2),
      height - 1
    );
    triangle.lineTo(Math.round(width / 2), height + triangleHeight);
    triangle.lineTo(
      Math.round(width / 2) + Math.floor(triangleWidth / 2),
      height - 1
    );
    triangle.endFill();

    this.container.addChild(triangle);

    for (var i = 0; i < texts.length; i++) {
      this.container.addChild(texts[i]);
    }

    let x = position.x,
      y = position.y;

    x -= Math.floor(width / 2);
    y -= height + this.margin - 5;

    this.container.setTransform(x, y);
    this.container.visible = true;
  }

  hide() {
    this.container.visible = false;
  }
}

export default Tooltip;
