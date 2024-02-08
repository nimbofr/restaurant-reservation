const knex = require("../db/connection");
const reservationsService = require("../reservations/reservations.service");

function list(){
    return knex("tables")
    .select("*")
    .orderBy("table_name")
}

function create(table){
    return knex("tables")
        .insert(table)
        .returning("*")
        .then((createdRes) => createdRes[0])
}

function read(table_id){
    return knex("tables")
    .select("tables.*")
    .where({table_id})
    .first()
}

function readReservation(reservation_id){
    return knex("reservations")
    .select("reservations.*")
    .where({reservation_id})
    .first()
}

function update(table_id, reservation_id){
    return knex("tables")
    .where({ table_id })
    .update({reservation_id})
    .returning("*")
}


function destroy(table_id, reservationId){
    return knex("tables")
    .where({ table_id })
    .update("reservation_id", null)
    .then(() => reservationsService.update(reservationId, "finished"))
}

module.exports = {
    list,
    read,
    readReservation,
    create,
    update,
    destroy,
};