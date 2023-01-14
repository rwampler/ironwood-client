import Action from './action';


export class Posture {
  x: number = 0;
  y: number = 0;
  bearing: number = 0;

  constructor (x: number, y: number, bearing: number) {
    this.x = x;
    this.y = y;
    this.bearing = bearing;
  }

  toJson () {
    return {
      x: this.x,
      y: this.y,
      bearing: this.bearing
    };
  }

  static fromJson (json: any): Posture {
    return new Posture(
      json.x ?? 0,
      json.y ?? 0,
      json.bearing ?? 0
    );
  }
}

export class Vision {
  fov: number = 0;
  range: number = 0;

  constructor (fov: number, range: number) {
    this.fov = fov;
    this.range = range;
  }

  toJson () {
    return {
      fov: this.fov,
      range: this.range
    };
  }

  static fromJson (json: any): Vision {
    return new Vision(
      json.fov ?? 0,
      json.range ?? 0
    );
  }
}

export default class Actor {
  id: string;
  type: string;
  name: string;

  posture: Posture;
  vision: Vision;

  actions: Array<Action>;

  constructor (id: string, type: string, name: string, posture: Posture, vision: Vision, actions: Array<Action>) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.posture = posture;
    this.vision = vision;
    this.actions = actions;
  }

  cleanupActions (simulationTimeSeconds: number): boolean {
    for (let index = this.actions.length - 1; index >= 0; index--) {
      if (this.actions[index].finishAt < simulationTimeSeconds) {
        const action = this.actions.splice(index, 1)[0];

        if (action.type == 'ROTATE') {
          this.posture.bearing = action.parameters.toBearing ?? this.posture.bearing;
        }
        else if (action.type == 'MOVE') {
          this.posture.x = action.parameters.toX ?? this.posture.x;
          this.posture.y = action.parameters.toY ?? this.posture.y;
        }
      }
    }
    return this.actions.length > 0;
  }

  getPosition (simulationTimeSeconds: number): any {
    for (let action of this.actions) {
      if (action.finishAt > simulationTimeSeconds && action.type == 'MOVE') {
        const progress = (simulationTimeSeconds - action.startAt) / (action.finishAt - action.startAt);
        return {
          x: action.parameters.fromX + progress * (action.parameters.toX - action.parameters.fromX),
          y: action.parameters.fromY + progress * (action.parameters.toY - action.parameters.fromY)
        }
      }
    }
    return { x: this.posture.x, y: this.posture.y };
  }

  getAzimuth (simulationTimeSeconds: number): number {
    for (let action of this.actions) {
      if (action.finishAt > simulationTimeSeconds && action.type == 'ROTATE') {
        const progress = (simulationTimeSeconds - action.startAt) / (action.finishAt - action.startAt);
        return this.posture.bearing + action.parameters.delta * progress;
      }
    }
    return this.posture.bearing;
  }


  toJson (): any {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      posture: this.posture.toJson(),
      vision: this.vision.toJson(),
      actions: this.actions.map(a => a.toJson())
    };
  }

  static fromJson (json: any): Actor {
    return new Actor(
      json.id ?? 'unknown',
      json.type ?? 'NONE',
      json.name ?? 'Nameless',
      Posture.fromJson(json.posture),
      Vision.fromJson(json.vision),
      (json.actions ?? []).map(Action.fromJson)
    );
  }

}
