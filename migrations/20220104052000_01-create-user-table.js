
exports.up = async knex => {
  await knex.schema.createTable("users", (table)=> {
        table.increments("id")
        table.string("username")
        table.string("password_hash")
        }
    )
};

exports.down = async knex => {
    await knex.schema.dropTableIfExists("users")
};
