const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())
let database = null

const dbPath = path.join(__dirname, 'covid19India.db')

const intiallizeDBAndrunserver = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('running')
    })
  } catch (e) {
    console.log(e.message)
    process.exit(1)
  }
}
intiallizeDBAndrunserver()

const convertdbintocamelcase = eachobj => {
  return {
    stateId: eachobj.state_id,
    stateName: eachobj.state_name,
    population: eachobj.population,
  }
}

const convertdistrictdbintocamelcase = eachobj => {
  return {
    districId: eachobj.district_id,
    districtName: eachobj.district_name,
    stateId: eachobj.state_id,
    cases: eachobj.cases,
    cured: eachobj.cured,
    active: eachobj.active,
    deaths: eachobj.deaths,
  }
}

//getallstates
app.get('/states/', async (request, response) => {
  const getallstatesquery = `
    SELECT
        *
    FROM state
    ORDER BY state_id;`

  const states = await database.all(getallstatesquery)
  response.send(
    states.map(dbobj => {
      return convertdbintocamelcase(dbobj)
    }),
  )
})

//getstate

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getastatequery = `SELECT 
    * 
  FROM 
    state
  WHERE 
    state_id= ${stateId};`

  const state = await database.get(getastatequery)

  response.send(convertdbintocamelcase(state))
})

//createdistrict

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const cratedistrictquery = `INSERT INTO district (district_name, state_id,cases,cured,active,deaths)
    VALUES("${districtName}", ${stateId},${cases},${cured},${active},${deaths});`

  await database.run(cratedistrictquery)

  response.send('District Successfully Added')
})

//getdistrict
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getadistrictquery = `SELECT 
    * 
  FROM 
    district
  WHERE district_id= ${districtId};`

  const districtresult = await database.get(getadistrictquery)

  response.send(convertdistrictdbintocamelcase(districtresult))
})

//deletedistrict

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params

  const deletedistrictquery = `DELETE FROM district WHERE district_id=${districtId};`

  await database.run(deletedistrictquery)
  response.send('District Removed')
})

//UPDATEdistrict

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body

  const updatedisquery = `
  UPDATE 
    district 
  SET 
    district_name="${districtName}",
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths},
  WHERE 
    district_id=${districtId};  
  `
  await database.run(updatedisquery)
  response.send('District Details Updated')
})

//getstatestats
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getadistrictquery = `SELECT 
    * 
  FROM 
    district
  WHERE 
    state_id= ${stateId};`

  const districtresult = await database.all(getadistrictquery)

  let totalCases = 0
  let totalCured = 0
  let totalActive = 0
  let totalDeaths = 0

  for (let eachobj of districtresult) {
    ;(totalCases += eachobj.cases),
      (totalCured += eachobj.cured),
      (totalActive += eachobj.active),
      (totalDeaths += eachobj.deaths)
  }

  response.send({
    totalCases: totalCases,
    totalCured: totalCured,
    totalActive: totalActive,
    totalDeaths: totalDeaths,
  })
})

//getthestateofadistrict
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getadistrictquery = `SELECT 
    state.state_name 
  FROM 
    (state NATURAL JOIN district) 
  WHERE 
    district.district_id= ${districtId};`

  const districtresult = await database.get(getadistrictquery)
  console.log(districtresult)
  response.send(convertdbintocamelcase(districtresult))
})

module.exports = app
