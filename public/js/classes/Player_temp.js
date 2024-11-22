class Player {
  constructor({ x, y, radius, color, username }) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.username = username
    this.Alive = true
    this.isRespawning = false
    this.isPlayingExplosion = false // New flag to track explosion animation
    this.launch = new Audio('../music/explosion.mp3')
    // Regular ship image
    this.image = new Image()
    this.loaded1 = false

    this.image.onload = () => {
      console.log('Player image loaded successfully')
      this.loaded1 = true
    }

    // Spritesheet for explosion
    this.explosionImage = new Image()
    this.explosionImage.src = '/img/spritesheets/explosion.png'
    this.explosionFrame = 0
    this.explosionFrameWidth = 16
    this.explosionFrameHeight = 16
    this.explosionTotalFrames = 5
    this.frameCounter = 0

    this.image.onerror = (err) => {
      console.error('Error loading player image:', err)
    }

    this.image.src = '/img/ship.png'

    this.width = radius * 5
    this.height = radius * 5
  }

  draw() {
    c.save()

    if (this.loaded1) {
      if (this.isRespawning === true) {
        if (!this.isPlayingExplosion) {
          // Start explosion animation
          this.isPlayingExplosion = true
          this.explosionFrame = 0
          this.frameCounter = 0
        }

        if (this.explosionFrame < this.explosionTotalFrames) {
          this.launch.play()
          c.drawImage(
            this.explosionImage,
            this.explosionFrame * this.explosionFrameWidth,
            0,
            this.explosionFrameWidth,
            this.explosionFrameHeight,
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height
          )

          // Update animation frame
          this.frameCounter++
          if (this.frameCounter >= 5) {
            this.frameCounter = 0
            this.explosionFrame++
          }
        }
        // Don't draw anything after animation is complete
      } else {
        // Reset explosion animation
        this.isPlayingExplosion = false
        // Draw normal ship
        c.drawImage(
          this.image,
          this.x - this.width / 2,
          this.y - this.height / 2,
          this.width,
          this.height
        )
        // Always show username (or you can hide it during respawn if you want)
        c.font = '12px sans-serif'
        c.fillStyle = 'white'
        c.textAlign = 'center'
        c.fillText(this.username, this.x, this.y + this.height / 2 + 10)
      }
    } else {
      // Fallback circle
      c.beginPath()
      c.arc(this.x, this.y, this.radius, 0, Math.PI * 6, false)
      c.fillStyle = this.color
      c.fill()

      // Always show username (or you can hide it during respawn if you want)
      c.font = '12px sans-serif'
      c.fillStyle = 'white'
      c.textAlign = 'center'
      c.fillText(this.username, this.x, this.y + this.height / 2 + 10)
    }

    // Always show username (or you can hide it during respawn if you want)
    /*     c.font = '12px sans-serif'
    c.fillStyle = 'white'
    c.textAlign = 'center'
    c.fillText(this.username, this.x, this.y + this.height / 2 + 10)
 */
    c.restore()
  }
}
