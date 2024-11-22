const { GAME } = require('../config/constants')

class GameService {
  constructor() {
    this.players = {}
    this.projectiles = {}
    this.projectileId = 0
    this.playerSpeedBoosts = {}
  }

  initializePlayer(socketId, username, width, height) {
    this.players[socketId] = {
      x: GAME.CANVAS_WIDTH * Math.random(),
      y: GAME.CANVAS_HEIGHT * Math.random(),
      color: `hsl(${360 * Math.random()}, 100%, 50%)`,
      sequenceNumber: 0,
      score: 0,
      username,
      canvas: { width, height },
      radius: GAME.PLAYER_RADIUS,
      isRespawning: false
    }

    console.log(`Player initialized: ${username} (${socketId})`) // Debug log
    return this.players[socketId]
  }

  createProjectile(socketId, x, y, angle) {
    this.projectileId++
    const baseSpeed = 5
    const speedMultiplier = this.playerSpeedBoosts[socketId] ? 10 : 1

    this.projectiles[this.projectileId] = {
      x,
      y,
      velocity: {
        x: Math.cos(angle) * baseSpeed * speedMultiplier,
        y: Math.sin(angle) * baseSpeed * speedMultiplier
      },
      playerId: socketId
    }
    return this.projectiles[this.projectileId]
  }

  handleKeydown(socketId, keycode, sequenceNumber) {
    const player = this.players[socketId]
    if (!player) return null

    // Update sequence number
    player.sequenceNumber = sequenceNumber

    // Update position based on keycode
    switch (keycode) {
      case 'KeyW':
        player.y -= GAME.MOVE_SPEED
        break
      case 'KeyA':
        player.x -= GAME.MOVE_SPEED
        break
      case 'KeyS':
        player.y += GAME.MOVE_SPEED
        break
      case 'KeyD':
        player.x += GAME.MOVE_SPEED
        break
    }

    // Calculate player sides exactly as in old version
    const playerSides = {
      left: player.x - player.radius,
      right: player.x + player.radius,
      top: player.y - player.radius,
      bottom: player.y + player.radius
    }

    // Boundary checking exactly as in old version
    if (playerSides.left < 0) {
      player.x = player.radius
    }
    if (playerSides.right > GAME.CANVAS_WIDTH) {
      player.x = GAME.CANVAS_WIDTH - player.radius
    }
    if (playerSides.top < 0) {
      player.y = player.radius
    }
    if (playerSides.bottom > GAME.CANVAS_HEIGHT) {
      player.y = GAME.CANVAS_HEIGHT - player.radius
    }

    return player
  }

  updateProjectiles() {
    for (const id in this.projectiles) {
      const projectile = this.projectiles[id]
      projectile.x += projectile.velocity.x
      projectile.y += projectile.velocity.y

      // Check if projectile is out of bounds
      if (
        projectile.x - GAME.PROJECTILE_RADIUS >= GAME.CANVAS_WIDTH ||
        projectile.x + GAME.PROJECTILE_RADIUS <= 0 ||
        projectile.y - GAME.PROJECTILE_RADIUS >= GAME.CANVAS_HEIGHT ||
        projectile.y + GAME.PROJECTILE_RADIUS <= 0
      ) {
        delete this.projectiles[id]
        continue
      }

      // Check collisions with players
      this.checkProjectileCollisions(id)
    }
  }

  checkProjectileCollisions(projectileId) {
    const projectile = this.projectiles[projectileId]
    if (!projectile) return

    for (const playerId in this.players) {
      const player = this.players[playerId]

      // Skip collision check if player is respawning
      if (player.isRespawning) continue

      const distance = Math.hypot(
        projectile.x - player.x,
        projectile.y - player.y
      )

      if (
        distance < GAME.PROJECTILE_RADIUS + player.radius &&
        projectile.playerId !== playerId
      ) {
        if (this.players[projectile.playerId]) {
          this.players[projectile.playerId].score++
        }

        delete this.projectiles[projectileId]

        player.isRespawning = true
        player.explosionFrame = 0
        player.lastTickTime = Date.now()

        // Start 3-second countdown
        setTimeout(() => {
          const spawnPosition = this.getSpawnPosition()
          player.x = spawnPosition.x
          player.y = spawnPosition.y
          player.isRespawning = false
        }, 3000)

        break
      }
    }
  }

  updateGameState() {
    // Update explosion frames based on TICK_RATE
    for (const playerId in this.players) {
      const player = this.players[playerId]
      if (player.isRespawning) {
        const currentTime = Date.now()
        if (currentTime - player.lastTickTime >= GAME.TICK_RATE) {
          player.explosionFrame = (player.explosionFrame + 1) % 5
          player.lastTickTime = currentTime
        }
      }
    }

    // Rest of your update logic
    this.updateProjectiles()
  }

  getSpawnPosition() {
    // Define spawn position logic (e.g., random spawn points)
    return {
      x: Math.random() * 800, // Example: canvas width
      y: Math.random() * 600 // Example: canvas height
    }
  }

  removePlayer(socketId) {
    delete this.players[socketId]
  }

  getGameState() {
    // Debug log current player count
    console.log(`Current players: ${Object.keys(this.players).length}`)
    console.log(
      'Players:',
      Object.keys(this.players).map((id) => this.players[id].username)
    )
    console.log(
      'Players:',
      Object.keys(this.players).map((id) => this.players[id].isRespawning)
    )
    console.log(
      'Players:',
      Object.keys(this.players).map((id) => this.players[id].isRespawning)
    )

    return {
      players: this.players,
      projectiles: this.projectiles
    }
  }

  setSpeedBoost(socketId, isActive) {
    this.playerSpeedBoosts[socketId] = isActive
  }
}

module.exports = new GameService()
