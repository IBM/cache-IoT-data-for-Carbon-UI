import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getFilterSchemaFor,
  getWhereSchemaFor,
  patch,
  put,
  del,
  requestBody,
  HttpErrors
} from '@loopback/rest';
import { Endpoint } from '../models';
import { EndpointRepository, CollectionRepository } from '../repositories';
import { inject } from '@loopback/context';
import {
  AuthenticationBindings,
  UserProfile,
  authenticate,
} from '@loopback/authentication';

export class EndpointController {
  constructor(
    @repository(EndpointRepository)
    public endpointRepository: EndpointRepository,
    @repository(CollectionRepository)
    public collectionRepository: CollectionRepository,
    @inject(AuthenticationBindings.CURRENT_USER) private user: UserProfile,
  ) { }

  async validate(endpoint?: Endpoint) {
    if (!endpoint) {
      throw new HttpErrors.BadRequest("Error: no endpoint given")
    }

    switch (endpoint.endpointID) {
      case null:
        throw new HttpErrors.BadRequest("Error: baseURL was null")
        break;
      case undefined:
        throw new HttpErrors.BadRequest("Error: baseURL was undefined")
      case '':
        throw new HttpErrors.BadRequest('Error: baseURL was empty')
      default:
        if (endpoint.endpointID.trim().length === 0) {
          throw new HttpErrors.BadRequest("Error: baseURL cannot be only whitespace")
        }
        break;
    }

    switch (endpoint.endpointPath) {
      case null:
        throw new HttpErrors.BadRequest("Error: endpointPath was null")
        break;
      case undefined:
        throw new HttpErrors.BadRequest("Error: endpointPath was undefined")
        break;
      case '':
        throw new HttpErrors.BadRequest('Error: endpointPath was empty')
        break;
      default:
        if (endpoint.endpointPath.trim().length === 0) {
          throw new HttpErrors.BadRequest("Error: endpointPath cannot be only whitespace")
        }
        break;
    }

    let collection = await this.collectionRepository.findById(endpoint.collectionID)
    if (!collection) {
      throw new HttpErrors.BadRequest(`Error: no collection found with id ${endpoint.collectionID}`)
    }

    if (endpoint['baseURL']) {
      switch (endpoint.baseURL) {
        case null:
          throw new HttpErrors.BadRequest("Error: baseURL was null")
          break;
        case undefined:
          throw new HttpErrors.BadRequest("Error: baseURL was undefined")
        case '':
          throw new HttpErrors.BadRequest('Error: baseURL was empty')
        default:
          if (endpoint.baseURL.trim().length === 0) {
            throw new HttpErrors.BadRequest("Error: baseURL cannot be only whitespace")
          }
          break;
      }
    }

    if (endpoint['authenticationType']) {
      switch (endpoint.authenticationType.toLowerCase()) {
        case 'basic': case 'bearer':
          break;
        default:
          throw new HttpErrors.BadRequest('Error: authentication tpye must be either Basic or Bearer')
      }
    }

    if (endpoint['refreshInterval']) {
      if (endpoint.refreshInterval <= 0) {
        throw new HttpErrors.BadRequest("Error: refreshInterval must be positive and nonzero")
      }
    }

    if (endpoint['credentials']) {
      if (!endpoint.credentials['username']) {
        throw new HttpErrors.BadRequest('Error: credentials does not contain a username')
      }

      if (!endpoint.credentials['password']) {
        throw new HttpErrors.BadRequest('Error: credentials does not contain a password')
      }

      switch (endpoint.credentials['username']) {
        case null:
          throw new HttpErrors.BadRequest("Error: username was null")
          break;
        case undefined:
          throw new HttpErrors.BadRequest("Error: username was undefined")
          break;
        case '':
          throw new HttpErrors.BadRequest('Error: username was empty')
          break;
        default:
          if (endpoint.credentials['username'].trim().length === 0) {
            throw new HttpErrors.BadRequest("Error: username cannot be only whitespace")
          }
          break;
      }

      switch (endpoint.credentials['password']) {
        case null:
          throw new HttpErrors.BadRequest("Error: password was null")
          break;
        case undefined:
          throw new HttpErrors.BadRequest("Error: password was undefined")
          break;
        case '':
          throw new HttpErrors.BadRequest('Error: password was empty')
          break;
        default:
          if (endpoint.credentials['password'].trim().length === 0) {
            throw new HttpErrors.BadRequest("Error: password cannot be only whitespace")
          }
          break;
      }
    }
    return endpoint
  }

  @authenticate('BasicStrategy')
  @post('/endpoints', {
    responses: {
      '200': {
        description: 'Endpoint model instance',
        content: { 'application/json': { schema: { 'x-ts-type': Endpoint } } },
      },
    },
  })
  async create(@requestBody() endpoint: Endpoint): Promise<Endpoint> {
    let validatedEndpoint = await this.validate(endpoint)
    Object.assign(endpoint, validatedEndpoint)
    return await this.endpointRepository.create(endpoint);
  }

  @authenticate('BasicStrategy')
  @get('/endpoints/count', {
    responses: {
      '200': {
        description: 'Endpoint model count',
        content: { 'application/json': { schema: CountSchema } },
      },
    },
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(Endpoint)) where?: Where,
  ): Promise<Count> {
    return await this.endpointRepository.count(where);
  }

  @authenticate('BasicStrategy')
  @get('/endpoints', {
    responses: {
      '200': {
        description: 'Array of Endpoint model instances',
        content: {
          'application/json': {
            schema: { type: 'array', items: { 'x-ts-type': Endpoint } },
          },
        },
      },
    },
  })
  async find(
    @param.query.object('filter', getFilterSchemaFor(Endpoint)) filter?: Filter,
  ): Promise<Endpoint[]> {
    return await this.endpointRepository.find(filter);
  }

  @authenticate('BasicStrategy')
  @patch('/endpoints', {
    responses: {
      '200': {
        description: 'Endpoint PATCH success count',
        content: { 'application/json': { schema: CountSchema } },
      },
    },
  })
  async updateAll(
    @requestBody() endpoint: Endpoint,
    @param.query.object('where', getWhereSchemaFor(Endpoint)) where?: Where,
  ): Promise<Count> {
    return await this.endpointRepository.updateAll(endpoint, where);
  }

  @authenticate('BasicStrategy')
  @get('/endpoints/{id}', {
    responses: {
      '200': {
        description: 'Endpoint model instance',
        content: { 'application/json': { schema: { 'x-ts-type': Endpoint } } },
      },
    },
  })
  async findById(@param.path.string('id') id: string): Promise<Endpoint> {
    return await this.endpointRepository.findById(id);
  }

  @authenticate('BasicStrategy')
  @patch('/endpoints/{id}', {
    responses: {
      '204': {
        description: 'Endpoint PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody() endpoint: Endpoint,
  ): Promise<void> {
    await this.endpointRepository.updateById(id, endpoint);
  }

  @authenticate('BasicStrategy')
  @put('/endpoints/{id}', {
    responses: {
      '204': {
        description: 'Endpoint PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() endpoint: Endpoint,
  ): Promise<void> {
    await this.endpointRepository.replaceById(id, endpoint);
  }

  @authenticate('BasicStrategy')
  @del('/endpoints/{id}', {
    responses: {
      '204': {
        description: 'Endpoint DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.endpointRepository.deleteById(id);
  }
}
