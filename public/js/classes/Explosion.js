// js/explosion.js

class Explosion {
  constructor(
    x,
    y,
    spritePath,
    frameWidth,
    frameHeight,
    totalFrames,
    frameRate = 10
  ) {
    this.x = x
    this.y = y
    this.sprite = new Image()
    this.sprite.src = spritePath
    this.frameWidth = frameWidth
    this.frameHeight = frameHeight
    this.totalFrames = totalFrames
    this.currentFrame = 0
    this.elapsedTime = 0
    this.frameInterval = 1000 / frameRate // Time per frame in ms
    this.isFinished = false
  }

  update(deltaTime) {
    if (this.isFinished) return

    this.elapsedTime += deltaTime
    if (this.elapsedTime >= this.frameInterval) {
      this.currentFrame++
      this.elapsedTime = 0
      if (this.currentFrame >= this.totalFrames) {
        this.isFinished = true
      }
    }
  }

  draw(ctx) {
    if (this.isFinished) return

    ctx.drawImage(
      this.sprite,
      this.currentFrame * this.frameWidth,
      0,
      this.frameWidth,
      this.frameHeight,
      this.x - this.frameWidth / 2, // Centering the explosion
      this.y - this.frameHeight / 2,
      this.frameWidth,
      this.frameHeight
    )
  }
}

// To make the Explosion class available to other scripts
export default Explosion
