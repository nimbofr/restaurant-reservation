// Your existing imports...
const reservationsService = require("./reservations.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");
const hasProperties = require("../errors/hasProperties");
const e = require("express");

// VALIDATION MIDDLEWARE

async function reservationExists(req, res, next) {
  const reservation = await reservationsService.read(req.params.reservationId);
  if (reservation) {
    res.locals.reservation = reservation;
    return next();
  }
  next({
    status: 404,
    message: `Reservation ${req.params.reservationId} cannot be found.`,
  });
}

const VALID_PROPERTIES = [
  "first_name",
  "last_name",
  "mobile_number",
  "reservation_date",
  "reservation_time",
  "people",
  "status",
];

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

const hasRequiredProperties = hasProperties(
  "first_name",
  "last_name",
  "mobile_number",
  "reservation_date",
  "reservation_time",
  "people"
);

function peopleIsNumber(req, res, next) {
  const { data = {} } = req.body;
  const { people, mobile_number } = data;

  if (typeof people !== "number") {
    return next({
      status: 400,
      message: "Invalid field: people is not a number.",
    });
  }

  // Check if mobile_number is a valid number (you might need to adjust the condition)
  if (isNaN(mobile_number)) {
    return next({
      status: 400,
      message: "Invalid field: mobile_number should be a number.",
    });
  }

  next();
}

function validDateTime(req, res, next) {
  if (
    Number.isNaN(
      Date.parse(
        `${req.body.data.reservation_date} ${req.body.data.reservation_time}`
      )
    )
  ) {
    return next({
      status: 400,
      message:
        "'reservation_date' or 'reservation_time' field is in an incorrect format",
    });
  }
  next();
}

function timeAvailable(req, res, next) {
  const { reservation_time } = req.body.data;
  const { reservation_date } = req.body.data;
  let today = new Date();
  let currentTime =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  let todayDate =
    today.getUTCFullYear() +
    "-" +
    (today.getMonth() + 1) +
    "-" +
    today.getUTCDate();
  if (reservation_time < "10:30") {
    return next({
      status: 400,
      message: "Invalid field: Restaurant not open until 10:30.",
    });
  } else if (reservation_time > "21:30") {
    return next({
      status: 400,
      message: "Invalid field: Restaurant closes at 22:30.",
    });
  } else {
    next();
  }
}

function pastReservation(req, res, next) {
  const reserveDate = new Date(
    `${req.body.data.reservation_date}T${req.body.data.reservation_time}:00.000`
  );
  const todaysDate = new Date();

  if (reserveDate < todaysDate) {
    return next({
      status: 400,
      message:
        "'reservation_date' and 'reservation_time' field must be in the future",
    });
  }
  next();
}

function getDayOfWeek(date) {
  const dayOfWeek = new Date(`${date} 02:30`).getDay();
  return isNaN(dayOfWeek)
    ? null
    : [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][dayOfWeek];
}

function isTuesday(req, res, next) {
  const { data = {} } = req.body;
  const { reservation_date } = data;
  if (getDayOfWeek(reservation_date) === "Tuesday") {
    return next({
      status: 400,
      message: "Restaurant closed on Tuesday.",
    });
  }
  next();
}

function validStatus(req, res, next) {
  const { status } = req.body.data;
  console.log;
  if (status === "seated") {
    return next({
      status: 400,
      message: "Reservation is seated.",
    });
  } else if (status === "finished") {
    return next({
      status: 400,
      message: "Reservation is finished.",
    });
  }
  next();
}

function statusValidator(req, res, next) {
  const status = req.body.data.status;
  const currentStatus = res.locals.reservation.status;
  const validStatuses = ["booked", "seated", "finished", "cancelled"];

  if (!validStatuses.includes(status)) {
    return next({
      status: 400,
      message: "Status of reservation is unknown.",
    });
  } else if (currentStatus === "finished") {
    return next({
      status: 400,
      message: "Reservation is already finished.",
    });
  }
  next();
}

// CRUD OPERATIONS

function read(req, res, next) {
  const { reservation: data } = res.locals;
  res.json({ data });
}

async function list(req, res) {
  const date = req.query.date;
  const mobile_number = req.query.mobile_number;
  if (mobile_number) {
    return res.json({
      data: await reservationsService.mobileSearch(mobile_number),
    });
  } else {
    return res.json({ data: await reservationsService.list(date) });
  }
}

async function create(req, res) {
  const data = await reservationsService.create(req.body.data);
  res.status(201).json({ data });
}

async function update(req, res) {
  const reservation_id = req.params.reservationId;
  const status = req.body.data.status;

  const statusUpdate = await reservationsService.update(reservation_id, status);
  res.status(200).json({ data: statusUpdate });
}

async function updateReservation(req, res) {
  const reservation_id = req.params.reservationId;
  const reservationUpdated = req.body.data;

  const updatedReservation = await reservationsService.updateReservation(
    reservation_id,
    reservationUpdated
  );
  res.status(200).json({ data: updatedReservation });
}

module.exports = {
  read: [asyncErrorBoundary(reservationExists), read],
  list: asyncErrorBoundary(list),
  create: [
    hasOnlyValidProperties,
    hasRequiredProperties,
    peopleIsNumber,
    validDateTime,
    pastReservation,
    isTuesday,
    timeAvailable,
    validStatus,
    asyncErrorBoundary(create),
  ],
  update: [
    asyncErrorBoundary(reservationExists),
    statusValidator,
    asyncErrorBoundary(update),
  ],
  updateReservation: [
    asyncErrorBoundary(reservationExists),
    hasRequiredProperties,
    validDateTime,
    peopleIsNumber,
    asyncErrorBoundary(updateReservation),
  ],
};
