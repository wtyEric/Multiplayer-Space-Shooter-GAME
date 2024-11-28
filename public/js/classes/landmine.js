class Landmine {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.width = 30 // Adjust this value to make the landmine smaller
    this.height = 30 // Adjust this value to make the landmine smaller
    this.image = new Image()
    this.image.src = '/img/landmine.png'
    this.isActive = true
  }

  draw(ctx) {
    if (this.isActive) {
      ctx.drawImage(
        this.image,
        this.x - this.width / 2, // Center the image on x coordinate
        this.y - this.height / 2, // Center the image on y coordinate
        this.width,
        this.height
      )
    }
  }

  explode() {
    this.isActive = false
    // Add explosion logic here
  }
}
