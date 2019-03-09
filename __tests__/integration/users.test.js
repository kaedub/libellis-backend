process.env.NODE_ENV = 'test';
const db = require('../../db');
const request = require('supertest');
const app = require('../../app');
const User = require('../../models/user');
const {
  createTables,
  insertTestData,
  dropTables
} = require('../../test_helpers/setup');

let survey1,
  survey2,
  question1,
  question2,
  user1,
  user2,
  user3,
  choice1,
  choice2,
  choice3,
  choice4,
  choice5,
  choice6,
  choice7,
  choice8;

//Insert 2 users before each test
beforeEach(async function () {
  await createTables();
  ({
    question1,
    question2,
    survey1,
    survey2,
    user1,
    user2,
    choice1,
    choice2,
    choice3,
    choice4,
    choice5,
    choice6,
    choice7,
    choice8
  } = await insertTestData());
  const response = await request(app)
    .post('/users')
    .send({
      username: 'georgetheman',
      password: 'georgeisawesome',
      first_name: 'george',
      last_name: 'johnson',
      email: 'george@gmail.com'
    });
  user3 = await User.get('georgetheman');
  user3._token = response.body.token;
  adminUser = await User.get('joerocket');
  const response2 = await request(app)
    .post('/login')
    .send({
      username: 'joerocket',
      password: 'testpass'
    });
  adminUser._token = response2.body.token;
});

//Test get users route
describe('GET /users', () => {
  it('should give 401 for any request made by no user', async function () {
    const response = await request(app).get('/users');
    expect(response.statusCode).toBe(401);
  });

  it('should give 401 for a request made by valid user who is not an admin', async function () {
    const response = await request(app).get('/users')
      .send({ _token: user3._token });
    expect(response.statusCode).toBe(401);
  });

  it('should correctly give users list to an admin', async function () {
    const response = await request(app).get('/users')
      .send({ _token: adminUser._token });
    expect(response.statusCode).toBe(200);
  });

});


//Test create user route
describe('POST /users', () => {
  it('should correctly create a new user and return it', async function () {
    const response = await request(app)
      .post('/users')
      .send({
        username: 'bobcat',
        password: 'bob',
        first_name: 'bob',
        last_name: 'johnson',
        email: 'bob@gmail.com'
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  it('should validate for proper email address format', async function () {
    // TEST FOR JSON SCHEMA
    const invalidResponse = await request(app)
      .post('/users')
      .send({
        username: 'bobcat',
        password: 'bob',
        first_name: 'bob',
        last_name: 'johnson',
        email: 'bob.com'
      });

    expect(invalidResponse.statusCode).toBe(400);
  })

  it('should throw an error if we try to create a user that already exists', async function () {
    const response = await request(app)
      .post('/users')
      .send({
        username: 'georgetheman',
        password: 'georgeisawesome',
        first_name: 'george',
        last_name: 'johnson',
        email: 'george@gmail.com'
      });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(`Username "georgetheman" already exists`);
  })
});


//Test get one user route
describe('GET /users/:username', () => {
  it('should correctly return a user by username', async function () {
    const response = await request(app)
      .get(`/users/${user3.username}`)
      .query({
        _token: user3._token
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.user).toEqual({
      "_username": "georgetheman",
      "email": "george@gmail.com",
      "first_name": "george",
      "last_name": "johnson",
      "photo_url": "https://moonvillageassociation.org/wp-content/uploads/2018/06/default-profile-picture1.jpg",
    })
  });

  it('should provide a helpful error message when asking for non-existent user (admin request)', async function () {
    const response = await request(app)
      .get(`/users/superfakeusertest`)
      .query({
        _token: adminUser._token
      });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toEqual("Cannot find user by username: superfakeusertest")
  });

  it('should reject requests for other users information', async function () {
    const response = await request(app)
      .get(`/users/${user2.username}`)
      .query({
        _token: user3._token
      });
    expect(response.statusCode).toBe(401);
  });
});


// test get surveys created by user
describe('GET /users/:username/surveys', () => {
  it('should get an empty array of surveys for existing user with no created surveys', async function () {
    const response = await request(app)
      .get(`/users/${user3.username}/surveys`)
      .query({
        _token: user3._token
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      surveys: []
    });
  });

  it('should reject requests for other users information', async function () {
    const response = await request(app)
      .get(`/users/${user2.username}/surveys`)
      .query({
        _token: user3._token
      });
    expect(response.statusCode).toBe(401);
  });
});

// test get user's history, list of survey id's that user has voted on
describe('GET /users/:username/history', () => {
  it('should return array of the survey ids the user has voted on', async function () {
    const response = await request(app)
      .get(`/users/${user1.username}/history`)
      .query({
        _token: user1._token
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      "surveys": [{
        "anonymous": true,
        "date_posted": expect.any(String),
        "description": "hot fiya",
        "author": "joerocket",
        "published": false,
        "survey_id": 1,
        "title": "best albums of 2009",
      }
      ],
    });
  });

  it('should get an empty array of survey ids for existing user without voted on surveys', async function () {
    const response = await request(app)
      .get(`/users/${user3.username}/history`)
      .query({
        _token: user3._token
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      surveys: []
    });
  });

  it('should reject requests for other users information', async function () {
    const response = await request(app)
      .get(`/users/${user2.username}/history`)
      .query({
        _token: user3._token
      });
    expect(response.statusCode).toBe(401);
  });
});

//Test updating a user route
describe('PATCH /users/:username', () => {
  it('should correctly update a user and return it', async function () {
    const response = await request(app)
      .patch(`/users/${user3.username}`)
      .send({
        first_name: 'Josephina'
      })
      .query({
        _token: user3._token
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.user._username).toBe(user3.username);
    expect(response.body.user.first_name).toBe('Josephina');

    //TEST FOR JSON SCHEMA
    const invalidResponse = await request(app)
      .patch(`/users/${user3.username}`)
      .send({
        first_name: 20,
        last_name: null,
        _token: user3._token
      });
    expect(invalidResponse.statusCode).toBe(400);
  });

  it('should fail to patch a username to another users username in db', async function () {
    const invalidResponse = await request(app)
      .patch(`/users/${user3.username}`)
      .send({
        username: 'joerocket'
      })
      .query({
        _token: user3._token
      });

    expect(invalidResponse.statusCode).toBe(400);
  });

  it('should fail to patch a user that has been deleted', async function () {
    const response = await request(app)
      .delete(`/users/${user3.username}`)
      .send({
        _token: user3._token
      });
    const invalidResponse = await request(app)
      .patch(`/users/${user3.username}`)
      .send({
        first_name: 'dumby'
      })
      .query({
        _token: user3._token
      });

    expect(invalidResponse.statusCode).toBe(400);
    expect(invalidResponse.body.error).toMatch(`Cannot find user by username: georgetheman`);
  });
});


//Test deleting a user route
describe('DELETE /users/:username', () => {
  it('should correctly delete a user', async function () {
    const response = await request(app)
      .delete(`/users/${user3.username}`)
      .send({
        _token: user3._token
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('User Deleted');
  });

  it('should fail to delete a user who tries to delete themselves more than once', async function () {
    const response = await request(app)
      .delete(`/users/${user3.username}`)
      .send({
        _token: user3._token
      });
    const badResponse = await request(app)
      .delete(`/users/${user3.username}`)
      .send({
        _token: user3._token
      });
    expect(badResponse.statusCode).toBe(400);
    expect(badResponse.body.error).toBe('Cannot find user by username: georgetheman');
  });
});

//Delete tables after each tets
afterEach(async function () {
  await dropTables();
});

//Close db connection
afterAll(async function () {
  await db.end();
});
