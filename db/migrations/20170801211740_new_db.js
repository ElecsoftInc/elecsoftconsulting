
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('courses', (table)=> {
      table.increments('course_id').primary();
      table.string('title');
      table.string('date_of_event');
      table.string('event_url');
      table.text('event_description');
    }),

    knex.schema.createTable('users', (table)=> {
      table.increments('id').primary();
      table.string('name');
      table.string('email');
      table.string('password');
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('courses'),
    knex.schema.dropTable('users')
  ])
};

