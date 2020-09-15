import { Group, Mesh, Points } from "three";

export interface StepData {
  geometry?: Mesh | Points;
  features?: Group;
}