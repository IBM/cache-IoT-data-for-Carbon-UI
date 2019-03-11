import { Entity, model, property } from '@loopback/repository';

@model()
export class Endpoint extends Entity {
  @property({
    type: 'number',
    id: true,
    required: true,
  })
  endpointID: number;

  @property({
    type: 'string',
    required: true,
  })
  endpointPath: string;

  @property({
    type: 'number',
    required: true,
  })
  collectionID: number;

  @property({
    type: 'object',
    required: false,
  })
  credentials?: object;

  @property({
    type: 'number',
    required: false,
  })
  refreshInterval?: number;

  @property({
    type: 'string',
    required: false,
  })
  authenticationType?: string;

  @property({
    type: 'string',
    required: false,
  })
  baseURL?: string;

  @property.array(String, {
    required: false
  })
  endpointList?: string[];


  constructor(data?: Partial<Endpoint>) {
    super(data);
  }
}
