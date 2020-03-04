class Tooltip {
  constructor() {
    // tooltip
    this.html = $('<div class="vtta-party-tooltip"></div>');
    $("body.game").append(this.html);

    document.addEventListener("mousemove", this.moveTooltip.bind(this));
    document.addEventListener("mouseenter", this.moveTooltip.bind(this));
  }

  moveTooltip(event) {
    this.html.css("left", event.pageX + 10 + "px");
    this.html.css("top", event.pageY + 10 + "px");
  }

  hide() {
    console.log("Hiding tooltip");
    console.log(this.html);
    this.html.removeClass("visible");
  }
  show() {
    console.log("Showing tooltip");
    this.html.addClass("visible");
  }

  setContent(innerHtml) {
    this.html.html(innerHtml);
  }
}

export default Tooltip;
