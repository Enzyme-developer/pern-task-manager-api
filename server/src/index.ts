const PORT = process.env.DB_PORT || 8000
const express = require('express')
const { v4: uuidv4 } = require('uuid')
const cors = require('cors')
const app = express()
const pool = require('./db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

//middlewares
app.use(cors())
app.use(express.json())


//endpoints
app.get('/tasks', async (req: string, res: { send: (arg0: string) => void; status: (arg0: number) => { (): string; new(): string; send: { (arg0: string): void; new(): string } } }) => {
    try {
      const result = await pool.query('SELECT * FROM tasks');
      res.send(result.rows);
      console.log(res)
    } catch (err) {
      console.log(err);
      res.status(500).send('Server error');
    }
});


app.post('/tasks', async(req: { body: { user_email: string; title: string; progress: string; date: string } }, res: { json: (arg0: any) => void }) => {
  const { user_email, title, progress, date } = req.body
  const id = uuidv4()
  try {
    const newToDo = pool? await pool.query(`INSERT INTO tasks(id, user_email, title, progress, date) VALUES($1, $2, $3, $4, $5)`,
      [id, user_email, title, progress, date]) : console.log('no pool')
    res.json(newToDo)
  } catch (err) {
    console.error(err)
  }
})


app.put('/tasks/:id', async (req: { params: { id: string }; body: { user_email: string; title: string; progress: string; date: string } }, res: { json: (arg0: string) => void }) => {
  const { id } = req.params
  const { user_email, title, progress, date } = req.body
  try {
    const editToDo =
      await pool.query('UPDATE todos SET user_email = $1, title = $2, progress = $3, date = $4 WHERE id = $5;',
      [user_email, title, progress, date, id])
    res.json(editToDo)
  } catch (err) {
    console.error(err)
  }
})

// delete a todo
app.delete('/tasks/:id', async (req: { params: { id: string } }, res: { json: (arg0: string) => void }) => {
  const { id } = req.params
  try {
    const deleteToDo = await pool.query('DELETE FROM todos WHERE id = $1;', [id])
    res.json(deleteToDo)
  } catch (err) {
    console.error(err)
  }
})


app.post('/signup', async (req: { body: { email: string; password: string } }, res: { json: (arg0: any) => void }) => {
  const { email, password } = req.body
  const salt = bcrypt.genSaltSync(10)
  const hashedPassword = bcrypt.hashSync(password, salt)
  try {
    const users = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (users) {
      res.json('user already exists')
    } else {
      const signUp = await pool.query(`INSERT INTO users (email, hashed_password) VALUES($1, $2)`,
        [email, hashedPassword])
      const token = jwt.sign({ email }, 'secret', { expiresIn: '1hr' })
      signUp ?   res.json({ email, token }) : res.json('signup failed')
    }
  } catch (err) {
    console.error(err)
  }
})


// login
app.post('/login', async (req: { body: { email: string; password: string } }, res: { json: (arg0: { detail?: string; email?: string; token?: string }) => string }) => {
  const { email, password } = req.body
  try {
    const users = await pool.query('SELECT * FROM users WHERE email = $1', [email])

    if (!users.rows.length) {
      return res.json({ detail: 'User does not exist!' })
    } else {
      const isValid = await bcrypt.compare(password, users.rows[0].hashed_password)
      const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1hr' })
      isValid ? res.json({ 'email' : users.rows[0].email, token}) : res.json({ detail: "Login failed"})
    }
  } catch (err) {
    console.error(err)
  }
})


app.listen(PORT, () => {
    console.log(`server has started on port ${PORT}`)
})