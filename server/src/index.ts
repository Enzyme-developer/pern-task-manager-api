const PORT = process.env.PORT ?? 8000
const express = require('express')
const { v4: uuidv4 } = require('uuid')
const cors = require('cors')
const app = express()
const { pool } = require('./db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

app.use(cors())
app.use(express.json())

app.get('/users', async (req: any, res: { send: (arg0: any) => void; status: (arg0: number) => { (): any; new(): any; send: { (arg0: string): void; new(): any } } }) => {
    try {
      const result = await pool.query('SELECT * FROM users');
      res.send(result.rows);
    } catch (err) {
      console.log(err);
      res.status(500).send('Server error');
    }
});

app.listen(PORT, () => {
    console.log(`server has started on port ${PORT}`)
})
