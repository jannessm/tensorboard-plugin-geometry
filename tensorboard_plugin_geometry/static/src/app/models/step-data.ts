import { Group, Mesh, Points } from "three";

export interface StepData {
  geometry?: Points | Group;
  features?: Group;
}