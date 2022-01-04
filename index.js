const express = require('express')
const app = express()

const cors = require('cors')
app.use(cors())

const knex = require('knex')
const config = require('./knexfile').development
const database = knex(config)

const bodyParser = require("body-parser")
app.use(bodyParser.json())

const port = 5000

app.listen(port, () => {console.log(`listenting to ${port}`)})

app.get('/', (request, response) => {
    database("users")
    .select()
    .returning("*")
    .then((users) => {
        response.json(users)
    }).catch(error => {
        response.json({error: error.message})
    })
})

app.post("/users", (request, response) => {
    const { user } = request.body

    database("users")
    .insert({
        username: user.username,
        password_hash: user.password
    }) 
    .returning("*")
    .then(users => {
        const user = users[0]
        response.json({ user })
    }).catch(error => {
        response.json({ error: error.message })
    })
})