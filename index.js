const express = require('express')
const app = express()

const cors = require('cors')
app.use(cors())

const knex = require('knex')
const config = require('./knexfile').development
const database = knex(config)

const bodyParser = require("body-parser")
app.use(bodyParser.json())

const bcrypt = require("bcrypt")
let jwt = require('jsonwebtoken');

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

app.post("/users", ( request, response ) => {
    const { user } = request.body

    bcrypt.hash(user.password, 12)
        .then(hashed_password => {
           return database("users")
                .insert({
                    username: user.username,
                    password_hash: hashed_password
                }) 
                .returning("*")
                .then(users => {
                    const user = users[0]
                    response.json({ user })
                }).catch(error => {
                    response.json({ error: error.message })
                })
        }
    )
})

app.post("/login", ( request, response ) => {
    const { user } = request.body

    database("users")
        .where({username: user.username })
        .first()
        .then(retrievedUser => {
            if(!retrievedUser) throw new Error("user not found!")

            return Promise.all([
                bcrypt.compare(user.password, retrievedUser.password_hash),
                Promise.resolve(retrievedUser)
            ]).then(results => {
                const areSamePasswords = results[0]
                if(!areSamePasswords) throw new Error("wrong Password!")
                const user = results[1]
                const payload = {username: user.username}
                const secret =  "SECRET"

                jwt.sign(payload, secret, (error, token) => {
                    if(error) throw new Error("Sign in error!")
                    response.json(token)
                }).catch(error => {
                    response.json({message: error.message})
                })
            })
        })
})

app.get('/authenticate', authenticate, (request, response) => {
    response.json({message: `Welcome ${request.user.username}!` })
})

function authenticate(request, response, next) {
    const authHeader = request.get("Authorization")
    const token = authHeader.split(" ")[1]
    const secret = "SECRET"

    jwt.verify(token, secret, (error, payload) => {
        if(error) throw new Error("sign in error!")

        database("users")
        .where({username: payload.username})
        .first()
        .then(user => {
            request.user = user
            next()
        }).catch(error => {
            console.error({message: error.message})
        })
    })
}