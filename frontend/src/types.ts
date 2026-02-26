export interface RouteStep {
  name: string;
  line: string;
}

export interface RouteInfo {
  path: RouteStep[];
  total_time: number;
  fare: number;
  interchanges: number;
}

export interface ResultType {
  meet_station: string;
  max_travel_time: number;
  meetup_spot?: string;
  routes: RouteInfo[];
}
