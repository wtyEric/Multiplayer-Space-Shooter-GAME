const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const socket = io()

const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = 1
canvas.width = 1024 * devicePixelRatio
canvas.height = 576 * devicePixelRatio

c.scale(devicePixelRatio, devicePixelRatio)

const x = canvas.width
const y = canvas.height

const frontEndPlayers = {}
const frontEndProjectiles = {}

// Track speed boost state
const gameState = {
  playerSpeedBoosts: {}
}

// Use the existing timer element
const timerEl = document.getElementById('gameTimer')
timerEl.style.position = 'absolute'
timerEl.style.top = '25%' // Use percentage for top position
timerEl.style.left = '50%'
timerEl.style.transform = 'translateX(-50%)'
timerEl.style.fontFamily = 'sans-serif'
timerEl.style.fontSize = '2rem' // Use relative units for responsive font size
timerEl.style.color = 'white'
timerEl.style.zIndex = '1000'

// Add a variable to track if the game is over
let isGameOver = false
let eiofwhweiofhfweiho = false
// Listen for timer updates from the server
socket.on('updateTimer', (remainingTime) => {
  timerEl.textContent = `${remainingTime}s`
  if (remainingTime >= 15) {
    eiofwhweiofhfweiho = true
  } else {
    eiofwhweiofhfweiho = false
  }
  // Change color to red in the last 10 seconds
  if (remainingTime <= 10) {
    timerEl.style.color = 'red'
  } else {
    timerEl.style.color = 'white'
  }

  // Hide the timer when the game is over
  if (remainingTime <= 0) {
    timerEl.textContent = 'Game Over !'
    isGameOver = true
    showRestartButton()
    document.dispatchEvent(new Event('gameOver'))
  }
})

const restartButton = document.getElementById('restartButton')
function showRestartButton() {
  restartButton.style.display = 'block' // Show the restart button
  restartButton.addEventListener('click', () => {
    location.reload() // Reload the page to restart the game
  })
}

// Ensure the restart button is hidden initially
restartButton.style.display = 'none'

socket.on('updateProjectiles', (backEndProjectiles) => {
  for (const id in backEndProjectiles) {
    const backEndProjectile = backEndProjectiles[id]

    if (!frontEndProjectiles[id]) {
      //console.log('create:', backEndProjectile)
      frontEndProjectiles[id] = new Projectile({
        x: backEndProjectile.x,
        y: backEndProjectile.y,
        radius: 5,
        color: frontEndPlayers[backEndProjectile.playerId]?.color,
        velocity: backEndProjectile.velocity
      })
    } else {
      frontEndProjectiles[id].x += backEndProjectiles[id].velocity.x
      frontEndProjectiles[id].y += backEndProjectiles[id].velocity.y
    }
  }

  for (const frontEndProjectileId in frontEndProjectiles) {
    if (!backEndProjectiles[frontEndProjectileId]) {
      delete frontEndProjectiles[frontEndProjectileId]
    }
  }
})

socket.on('updatePlayers', (backEndPlayers) => {
  for (const id in backEndPlayers) {
    const backEndPlayer = backEndPlayers[id]

    if (!frontEndPlayers[id]) {
      // Create new player instance
      frontEndPlayers[id] = new Player({
        x: backEndPlayer.x,
        y: backEndPlayer.y,
        radius: 10,
        color: backEndPlayer.color,
        username: backEndPlayer.username,
        isRespawning: backEndPlayer.isRespawning,
        shipType: backEndPlayer.shipType
      })

      // Add player label to leaderboard
      document.querySelector(
        '#playerLabels'
      ).innerHTML += `<div data-id="${id}" data-score="${backEndPlayer.score}">${backEndPlayer.username}: ${backEndPlayer.score}</div>`

      console.log(`New player joined: ${backEndPlayer.username}`) // Debug log
    }

    // Update player position
    frontEndPlayers[id].target = {
      x: backEndPlayer.x,
      y: backEndPlayer.y
    }

    //update isRespawning
    frontEndPlayers[id].isRespawning = backEndPlayer.isRespawning

    //update shipType
    frontEndPlayers[id].shipType = backEndPlayer.shipType

    // Update score
    document.querySelector(
      `div[data-id="${id}"]`
    ).innerHTML = `${backEndPlayer.username}: ${backEndPlayer.score}`
  }

  // Remove disconnected players
  for (const id in frontEndPlayers) {
    if (!backEndPlayers[id]) {
      const divToDelete = document.querySelector(`div[data-id="${id}"]`)
      if (divToDelete) {
        divToDelete.parentNode.removeChild(divToDelete)
      }
      delete frontEndPlayers[id]
      console.log(`Player disconnected: ${id}`) // Debug log
    }
  }
})

let animationId
function animate() {
  if (isGameOver) return // Stop the animation if the game is over

  animationId = requestAnimationFrame(animate)
  c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  c.clearRect(0, 0, canvas.width, canvas.height)

  for (const id in frontEndPlayers) {
    const frontEndPlayer = frontEndPlayers[id]

    // linear interpolation
    if (frontEndPlayer.target) {
      frontEndPlayers[id].x +=
        (frontEndPlayers[id].target.x - frontEndPlayers[id].x) * 0.5
      frontEndPlayers[id].y +=
        (frontEndPlayers[id].target.y - frontEndPlayers[id].y) * 0.5
    }

    frontEndPlayer.draw()
  }

  for (const id in frontEndProjectiles) {
    const frontEndProjectile = frontEndProjectiles[id]
    frontEndProjectile.draw()
  }
}

animate()

const keys = {
  w: {
    pressed: false
  },
  a: {
    pressed: false
  },
  s: {
    pressed: false
  },
  d: {
    pressed: false
  }
}

let sequenceNumber = 0
setInterval(() => {
  if (keys.w.pressed) {
    sequenceNumber++

    socket.emit('keydown', { keycode: 'KeyW', sequenceNumber })
  }

  if (keys.a.pressed) {
    sequenceNumber++

    socket.emit('keydown', { keycode: 'KeyA', sequenceNumber })
  }

  if (keys.s.pressed) {
    sequenceNumber++

    socket.emit('keydown', { keycode: 'KeyS', sequenceNumber })
  }

  if (keys.d.pressed) {
    sequenceNumber++

    socket.emit('keydown', { keycode: 'KeyD', sequenceNumber })
  }
}, 15)

window.addEventListener('keydown', (event) => {
  console.log('key down')
  if (!frontEndPlayers[socket.id]) return

  switch (event.code) {
    case 'KeyW':
      keys.w.pressed = true
      break

    case 'KeyA':
      keys.a.pressed = true
      break

    case 'KeyS':
      keys.s.pressed = true
      break

    case 'KeyD':
      keys.d.pressed = true
      break
  }

  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
    console.log('Shift key pressed') // Debug shift specifically
    gameState.playerSpeedBoosts[socket.id] = true
    socket.emit('speedBoostChange', true)
  }
})

window.addEventListener('keyup', (event) => {
  if (!frontEndPlayers[socket.id]) return

  switch (event.code) {
    case 'KeyW':
      keys.w.pressed = false
      break

    case 'KeyA':
      keys.a.pressed = false
      break

    case 'KeyS':
      keys.s.pressed = false
      break

    case 'KeyD':
      keys.d.pressed = false
      break
  }

  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
    console.log('Shift key released') // Debug shift specifically
    gameState.playerSpeedBoosts[socket.id] = false
    socket.emit('speedBoostChange', false)
  }
})

document.querySelector('#usernameForm').addEventListener('submit', (event) => {
  event.preventDefault()
  document.querySelector('#usernameForm').style.display = 'none'
  socket.emit('initGame', {
    width: canvas.width,
    height: canvas.height,
    devicePixelRatio,
    username: document.querySelector('#usernameInput').value
  })
})

// Listen for speed boost updates from server
socket.on('speedBoostUpdate', ({ playerId, isActive }) => {
  gameState.playerSpeedBoosts[playerId] = isActive
})

// Update projectile rendering
socket.on('updateProjectiles', (backEndProjectiles) => {
  for (const id in backEndProjectiles) {
    const backEndProjectile = backEndProjectiles[id]

    if (!frontEndProjectiles[id]) {
      frontEndProjectiles[id] = new Projectile({
        x: backEndProjectile.x,
        y: backEndProjectile.y,
        radius: 5,
        color: frontEndPlayers[backEndProjectile.playerId]?.color,
        velocity: backEndProjectile.velocity
      })
    } else {
      frontEndProjectiles[id].x = backEndProjectile.x
      frontEndProjectiles[id].y = backEndProjectile.y

      // Only show speed boost effect for projectiles from players using boost
      if (gameState.playerSpeedBoosts[backEndProjectile.playerId]) {
        c.save()
        c.beginPath()
        c.arc(
          frontEndProjectiles[id].x,
          frontEndProjectiles[id].y,
          frontEndProjectiles[id].radius + 5,
          0,
          Math.PI * 2,
          false
        )
        c.strokeStyle = 'yellow'
        c.stroke()
        c.restore()
      }
    }
  }
})

// Make sure these listeners are added after the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, key listeners initialized') // Debug initialization
})
