process.env.NODE_ENV = 'test';
const Choice = require('../../models/choice');
const db = require('../../db');
const {
  createTables,
  insertTestData,
  dropTables
} = require('../../test_helpers/setup');

let question1, question2, choice1, choice2, choice3, choice4, user1, user2;
// Insert 2 choices before each test
beforeEach(async function () {
  // Build up our test tables and return inserted test choices, questions and users
  await createTables();
  ({ choice1, choice2, choice3, choice4, question1, question2, user1, user2 } = await insertTestData());
});

// Test getting all choices by a question_id
describe('get()', () => {
  it('should correctly return a list of choices', async function () {
    const choices = await Choice.getAll({ db }, { question_id: question1.id });

    // Check that returned structure matches this exactly
    expect(choices).toEqual([
      {
        _id: choice1.id,
        title: choice1.title,
        content: choice1.content,
        _question_id: question1.id,
        content_type: choice1.content_type,
        db,
      },
      {
        _id: choice2.id,
        title: choice2.title,
        content: choice2.content,
        _question_id: question1.id,
        content_type: choice2.content_type,
        db,
      },
      {
        _id: choice3.id,
        title: choice3.title,
        content: choice3.content,
        _question_id: question1.id,
        content_type: choice3.content_type,
        db,
      },
      {
        _id: choice4.id,
        title: choice4.title,
        content: choice4.content,
        _question_id: question1.id,
        content_type: choice4.content_type,
        db,
      }
    ]);
  });
});

//Test creating choice
describe('create()', () => {
  it('should correctly add a choice', async function () {
    const newChoice = await Choice.create({ db }, {
      title: 'Elie Schoppik',
      content: 'Youtube-Embed-Code-Elie-Dancing',
      content_type: 'youtube',
      question_id: question2.id,
    });

    const choices = await Choice.getAll({ db }, { question_id: question2.id });
    expect(choices.length).toEqual(5);
  });

  it('should fail to add a choice with no type', async function () {
    try {
      const newChoice = await Choice.create({ db }, {
        title: 'Elie Schoppik',
        content: 'Youtube-Embed-Code-Elie-Dancing',
        question_id: question2.id,
      });
      throw new Error();  
    } catch(e) {
      expect(e.message).toMatch(`Must supply title, content_type and question_id`);
    }
  });
});

//Test get one choice
describe('get()', () => {
  it('should correctly return a choice by id', async function () {
    const choice = await Choice.get({ db }, { id: choice1.id });
    expect(choice.id).toEqual(choice1.id);
    expect(choice.content).toEqual(choice1.content);

    //get a choice that doesn't exist and check failure
    try {
      await Choice.get({ db }, { id: -30 });
      throw new Error();
    } catch (e) {
      expect(e.message).toMatch(`Cannot find choice by id: -30`);
    }
  });

  it('should throw a missing id parameter if get is called with a missing or falsey id', async function() {
    try {
      await Choice.get({ db }, {});
      throw new Error();
    } catch (e) {
      expect(e.message).toMatch(`Missing id parameter`);
    }
  }); 
});

//Update a choice test
describe('updateChoice()', () => {
  it('should correctly update a choice', async function () {
    let choice = await Choice.get({ db }, { id: choice1.id });
    choice.title = 'Slugabed';

    await choice.save();
    choice = await Choice.get({ db }, { id: choice1.id });
    expect(choice.title).toEqual('Slugabed');

    const choices = await Choice.getAll({ db }, { question_id: question1.id });
    expect(choices.length).toEqual(4);

    expect(() => {
      choice.id = 'THISSHOULDFAIL';
    }).toThrowError(`Can't change id!`);
  });

  it('should fail to update a non-existent choice', async function () {
    let choice = new Choice({ id: 987, question_id: -20, content: '', title: 'blah', content_type: 'text', db, });
    
    try {
      choice.title = "nice-buns";
      await choice.save();
      throw new Error();
    } catch (e) {
      expect(e.message).toMatch(`Cannot find choice to update`);
    }
  });
});

//Delete a choice test
describe('deleteChoice()', () => {
  it('should correctly delete a choice', async function () {
    const choiceToBeDeleted = await Choice.get({ db }, { id: choice1.id });
    const message = await choiceToBeDeleted.delete();
    expect(message).toBe('Choice Deleted');
  });
});

//Delete choices after each tets
afterEach(async function () {
  await dropTables();
});

//Close db connection
afterAll(async function () {
  await db.end();
});
