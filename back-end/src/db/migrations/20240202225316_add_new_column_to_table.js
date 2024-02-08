exports.up = function (knex) {
    return knex.schema.alterTable("tables", (table) => {
      table.boolean("occupied");
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.alterTable("tables", (table) => {
      table.dropColumn("occupied")
    });
  };