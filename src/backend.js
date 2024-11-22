const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cookieParser = require('cookie-parser')
const authService = require('./services/authService')
const gameService = require('./services/gameService')
const { GAME, AUTH } = require('./config/constants')

class GameServer {
  constructor() {
    this.app = express()
    this.server = http.createServer(this.app)
    this.io = new Server(this.server, {
      pingInterval: 2000,
      pingTimeout: 5000
    })

    this.timer = null // Timer variable
    this.remainingTime = 15 // Game duration in seconds
    this.gameInitialized = false // Track whether the game has started

    this.setupMiddleware()
    this.setupRoutes()
    this.setupSocketHandlers()
    this.setupGameLoop()
  }

  setupMiddleware() {
    this.app.use(express.json())
    this.app.use(express.static('public'))
    this.app.use(cookieParser())
  }

  setupRoutes() {
    this.app.post('/signup', async (req, res) => {
      try {
        await authService.signup(req.body.username, req.body.password)
        res.json({ success: true })
      } catch (error) {
        res.status(400).json({ success: false, message: error.message })
      }
    })

    this.app.post('/login', async (req, res) => {
      try {
        const { sessionToken, username } = await authService.login(
          req.body.username,
          req.body.password
        )

        res.cookie('sessionToken', sessionToken, {
          maxAge: AUTH.COOKIE_MAX_AGE,
          httpOnly: true,
          path: '/'
        })
        res.cookie('username', username, {
          maxAge: AUTH.COOKIE_MAX_AGE,
          path: '/'
        })

        res.json({ success: true })
      } catch (error) {
        res.status(401).json({ success: false, message: error.message })
      }
    })

    this.app.get('/check-session', async (req, res) => {
      const { sessionToken, username } = this.extractCookies(req)
      if (!sessionToken || !username) {
        return res.json({ success: false })
      }

      const isValid = await authService.validateSession(sessionToken, username)
      res.json({ success: isValid, username: isValid ? username : null })
    })
  }

  extractCookies(req) {
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {})

    return {
      sessionToken: cookies?.sessionToken,
      username: cookies?.username
    }
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Player connected:', socket.id)

      // Send current game state to new player
      socket.emit('updatePlayers', gameService.getGameState().players)

      // Send the remaining timer to the newly connected client
      socket.emit('updateTimer', this.remainingTime)

      socket.on('shoot', ({ x, y, angle }) => {
        gameService.createProjectile(socket.id, x, y, angle)
      })

      socket.on('initGame', ({ username, width, height }) => {
        console.log(`Game initialized for ${username}`)
        gameService.initializePlayer(socket.id, username, width, height)

        // Broadcast to all clients including sender
        this.io.emit('updatePlayers', gameService.getGameState().players)

        // Start the timer if it's not already running
        if (!this.gameInitialized) {
          this.startGameTimer()
          this.gameInitialized = true
        }
      })

      socket.on('keydown', ({ keycode, sequenceNumber }) => {
        gameService.handleKeydown(socket.id, keycode, sequenceNumber)
      })

      socket.on('disconnect', (reason) => {
        console.log(`Player disconnected: ${socket.id}, reason: ${reason}`)
        gameService.removePlayer(socket.id)
        this.io.emit('updatePlayers', gameService.getGameState().players)
      })

      socket.on('speedBoostChange', (isActive) => {
        gameService.setSpeedBoost(socket.id, isActive)
        this.io.emit('speedBoostUpdate', { playerId: socket.id, isActive })
      })
    })
  }

  setupGameLoop() {
    setInterval(() => {
      gameService.updateProjectiles()
      const gameState = gameService.getGameState()
      this.io.emit('updateProjectiles', gameState.projectiles)
      this.io.emit('updatePlayers', gameState.players)
    }, GAME.TICK_RATE)
  }

  startGameTimer() {
    this.timer = setInterval(() => {
      if (this.remainingTime > 0) {
        this.remainingTime -= 1
        this.io.emit('updateTimer', this.remainingTime) // Broadcast remaining time
      } else {
        clearInterval(this.timer) // Stop the timer when it reaches 0
        this.timer = null
        console.log('Game over!')

        // Broadcast game over to all clients
        this.io.emit('updateTimer', 0)
        this.gameInitialized = false // Allow the game to reinitialize
        this.remainingTime = 15 // Reset the timer for the next game
      }
    }, 1000) // Update every second
  }

  start(port) {
    this.server.listen(port, () => {
      console.log(`Game server running on port ${port}`)
    })
  }
}

const gameServer = new GameServer()
gameServer.start(8000)