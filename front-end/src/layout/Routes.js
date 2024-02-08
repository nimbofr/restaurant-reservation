import React from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import { today } from "../utils/date-time";
import NotFound from "../Errors/NotFound";
import ReservationForm from "../reservations/ReservationForm";
import TableForm from "../Tables/TableForm";

import Seating from "../dashboard/Seating";
import Search from "../dashboard/Search"; 
import Dashboard from "../dashboard/Dashboard"; 

/**
 * Defines all the routes for the application.
 *
 * You will need to make changes to this file.
 *
 * @returns {JSX.Element}
 */
function Routes() {
  return (
    <Switch>
      <Route exact={true} path="/">
        <Redirect to={"/dashboard"} />
      </Route>
      <Route exact={true} path="/reservations">
        <Redirect to={"/dashboard"} />
      </Route>
      <Route exact={true} path="/reservations/new">
        <ReservationForm type="Create a New" />
      </Route>
      <Route path="/dashboard">
        <Dashboard date={today()} />
      </Route>
     <Route path="/Tables/new">
        <TableForm />
      </Route>
      <Route path="/reservations/:reservation_id/seat">
        <Seating />
      </Route>
      <Route path="/reservations/:reservation_id/edit">
      <ReservationForm type="Edit" />
      </Route>
      <Route path="/search">
        <Search />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

export default Routes;