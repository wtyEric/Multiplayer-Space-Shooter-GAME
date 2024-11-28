class Landmine {
  constructor(x, y, imageSrc) {
    this.x = x
    this.y = y
    this.image = new Image()
    this.image.src = '.../img/landmine.png'
    this.isActive = true
  }

  draw(ctx) {
    if (this.isActive) {
      ctx.drawImage(this.image, this.x, this.y)
    }
  }

  explode() {
    this.isActive = false
    // Add explosion logic here
  }
}

export default Landmine
