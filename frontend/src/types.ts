export type RouteNode = { name: string; line: string };
export type RouteInfo = { fare: number; steps: RouteNode[] };
export type ResultType = {
  meet_station: string;
  time_taken: number;
  meetup_spot: string;
  routes: RouteInfo[];
};
