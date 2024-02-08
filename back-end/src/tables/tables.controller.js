const tablesService = require("./tables.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");
const hasProperties = require("../errors/hasProperties");
const reservationsService = require("../reservations/reservations.service")
//VALIDATION MIDDLEWARE

const VALID_PROPERTIES = ["table_name", "capacity", "reservation_id"];

const hasRequiredProperties = hasProperties(VALID_PROPERTIES[0], VALID_PROPERTIES[1]);

function hasOnlyValidProperties(req, res, next) {
  const { data = {} } = req.body;

  const invalidFields = Object.keys(data).filter(
    (field) => !VALID_PROPERTIES.includes(field)
  );

  if (invalidFields.length) {
    return next({
      status: 400,
      message: `Invalid field(s): ${invalidFields.join(", ")}`,
    });
  }
  next();
}

async function tableExists(req, res, next) {
  const { table_id } = req.params;
  const table = await tablesService.read(table_id);

  if (!table) {
    return next({
      status: 404,
      message: `Table ${table_id} does not exist.`,
    });
  } else {
    res.locals.table = table;
    return next();
  }
}

async function reservationExists(req, res, next) {
  const data = req.body.data;
  if (!data || !data.reservation_id) {
    return next({
      status: 400,
      message: "Data or reservation_id are missing.",
    });
  }
  const reservation = await tablesService.readReservation(data.reservation_id);
  if (reservation) {
    res.locals.reservation = reservation;
    return next();
  } else {
    return next({
      status: 404,
      message: `${data.reservation_id} cannot be found.`,
    });
  }
}

async function sufficientCap(req, res, next) {
  const data = req.body.data;
  const reservation = await tablesService.readReservation(data.reservation_id);
  const { table_id } = req.params;
  const table = await tablesService.read(table_id);
  if (reservation.people > table.capacity) {
    return next({
      status: 400,
      message: `Table does not have sufficient capacity.`,
    });
  }
  next();
}

async function tableOccupied(req, res, next) {
  const { table_id } = req.params;
  const table = await tablesService.read(table_id);
  let reservation = res.locals.reservation;
  if (table.reservation_id) {
    return next({
      status: 400,
      message: "Table is occupied.",
    });
  } else if(reservation.status === 'seated'){
    return next({
      status: 400,
      message: "Table is already seated.",
    });
  }
  next();
}

function tableNameValid(req, res, next) {
  const table_name = req.body.data.table_name;
  if (table_name.length < 2) {
    return next({
      status: 400,
      message: "Invalid field(s): table_name must be more than one character.",
    });
  }
  next();
}

function capIsNum(req, res, next) {
  const cap = req.body.data.capacity;
  if (typeof cap != "number") {
    return next({
      status: 400,
      message: "Invalid field(s): capacity must be a number.",
    });
  }
  next();
}

function destroyValid(req, res, next){
  const {table} = res.locals;

  if(!table.reservation_id) {
    return next({
      status:400,
      message:"Table is not occupied."
    })
  }
  return next();
}

//CRUD OPERATIONS

async function create(req, res) {
  const data = await tablesService.create(req.body.data);
  res.status(201).json({ data });
}

async function list(req, res) {
  const tables = await tablesService.list();
  res.json({ data: tables });
}

async function update(req, res) {
  const { table_id } = res.locals.table;
  const { reservation_id } = req.body.data;

  await reservationsService.update(Number(reservation_id), "seated");

  const data = await tablesService.update(Number(table_id), reservation_id);
  res.status(200).json({ data });
}

async function destroy(req, res){
  await tablesService.destroy(res.locals.table.table_id, res.locals.table.reservation_id);

  res.sendStatus(200).json(`${req.params.table_id} table_id is occupied`);
}

module.exports = {
  create: [
    hasRequiredProperties,
    hasOnlyValidProperties,
    tableNameValid,
    capIsNum,
    asyncErrorBoundary(create),
  ],
  list: asyncErrorBoundary(list),
  update: [
    asyncErrorBoundary(tableExists),
    asyncErrorBoundary(reservationExists),
    asyncErrorBoundary(sufficientCap),
    asyncErrorBoundary(tableOccupied),
    asyncErrorBoundary(update),
  ],
  delete: [
    asyncErrorBoundary(tableExists),
    asyncErrorBoundary(destroyValid),
    asyncErrorBoundary(destroy)
  ],
};