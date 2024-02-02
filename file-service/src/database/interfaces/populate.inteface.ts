export interface IPopulate {
  path: string;
  model: string;
  select?: [] | string;
  populate?: IPopulate;
}
