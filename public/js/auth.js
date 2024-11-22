class AuthManager {
  constructor() {
    // Add debug logging
    console.log('AuthManager initializing...')

    this.bgm = new Audio('../music/bgm.mp3')
    this.bgm.loop = true

    document.addEventListener('DOMContentLoaded', () => {
      this.loginContainer = document.getElementById('loginContainer')
      this.signupContainer = document.getElementById('signupContainer')
      this.startButton = document.getElementById('startButton')

      // Debug logging
      console.log('Login container:', this.loginContainer)
      console.log('Signup container:', this.signupContainer)
      console.log('Start button:', this.startButton)

      if (!this.loginContainer || !this.signupContainer || !this.startButton) {
        console.error('Required DOM elements not found:', {
          loginContainer: !!this.loginContainer,
          signupContainer: !!this.signupContainer,
          startButton: !!this.startButton
        })
        return
      }

      this.initializeEventListeners()
    })
  }

  initializeEventListeners() {
    // Toggle forms
    document
      .getElementById('showSignup')
      .addEventListener('click', () => this.toggleForms('signup'))
    document
      .getElementById('showLogin')
      .addEventListener('click', () => this.toggleForms('login'))

    // Form submissions
    document
      .getElementById('loginForm')
      .addEventListener('submit', (e) => this.handleLogin(e))
    document
      .getElementById('signupForm')
      .addEventListener('submit', (e) => this.handleSignup(e))

    // Add start button listener
    this.startButton.addEventListener('click', () => {
      this.bgm.play()
      this.startButton.style.display = 'none'
      socket.emit('initGame', {
        username: this.currentUsername,
        width: canvas.width,
        height: canvas.height
      })
    })

    // Check session on load
    this.checkSession()
  }

  async handleLogin(e) {
    e.preventDefault()
    const username = document.getElementById('usernameInput').value
    const password = document.getElementById('passwordInput').value

    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (response.ok) {
        this.loginContainer.style.display = 'none'
        this.startButton.style.display = 'block'
        this.currentUsername = username
      } else {
        const data = await response.json()
        alert(data.message || 'Invalid credentials')
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Login failed')
    }
  }

  async checkSession() {
    try {
      const response = await fetch('/check-session')
      const data = await response.json()

      if (data.success) {
        this.loginContainer.style.display = 'none'
        this.startButton.style.display = 'block'
        this.currentUsername = data.username
      }
    } catch (error) {
      console.error('Session check error:', error)
    }
  }

  toggleForms(form) {
    if (!this.loginContainer || !this.signupContainer) return

    this.loginContainer.style.display = form === 'login' ? 'flex' : 'none'
    this.signupContainer.style.display = form === 'signup' ? 'flex' : 'none'
  }

  async handleSignup(e) {
    e.preventDefault()
    const username = document.getElementById('signupUsername').value
    const password = document.getElementById('signupPassword').value

    try {
      const response = await fetch('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (response.ok) {
        alert('Signup successful! Please login.')
        this.toggleForms('login')
      } else {
        const data = await response.json()
        alert(data.message || 'Signup failed')
      }
    } catch (error) {
      console.error('Signup error:', error)
      alert('Signup failed')
    }
  }

  logout() {
    document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    window.location.reload()
  }
}

// Initialize auth manager
const authManager = new AuthManager()
