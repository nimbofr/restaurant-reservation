const knex = require("../db/connection");

function list(date){
    if(date){
        return knex("reservations")
        .select("*")
        .where({reservation_date: date})
        .whereNot({ status: "finished"})
        .orderBy("reservation_time", "asc")
    }

    return knex("reservations").select("*")
}

function create(reservation){
    return knex("reservations")
        .insert(reservation)
        .returning("*")
        .then((createdRes) => createdRes[0])
}

function read(reservation_id){
    return knex("reservations")
    .select("reservations.*")
    .where({"reservations.reservation_id": reservation_id})
    .first()
}

function update(reservation_id, status){
    return knex("reservations")
    .where({ reservation_id })
    .update("status", status)
    .returning("*")
    .then((res) => res[0])
}

function mobileSearch(mobile_phone){
    return knex("reservations")
    .whereRaw(
        "translate(mobile_number, '() -', '') like ?",
        `%${mobile_phone.replace(/\D/g, "")}%`
      )
    .orderBy("reservation_date")
}

function updateReservation(reservation_id, reservation){
    return knex("reservations")
    .where({reservation_id})
    .update(reservation)
    .returning("*")
    .then((res) => res[0])
}

module.exports = {
    list,
    create,
    read,
    update,
    mobileSearch,
    updateReservation,
};