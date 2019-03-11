import { Provider, ValueOrPromise, inject } from '@loopback/context';
import { Strategy } from 'passport';
import { BasicStrategy } from 'passport-http';
import { AuthenticationMetadata, UserProfile, AuthenticationBindings } from '@loopback/authentication';
import { UserRepository } from '../repositories';
import { repository } from '@loopback/repository';
export class MyAuthStrategyProvider implements Provider<Strategy | undefined> {
  constructor(
    @inject(AuthenticationBindings.METADATA)
    private metadata: AuthenticationMetadata,
    @repository(UserRepository)
    private userRepository: UserRepository,
  ) { }

  value(): ValueOrPromise<Strategy | undefined> {
    // The function was not decorated, so we shouldn't attempt authentication
    if (!this.metadata) {
      return undefined;
    }

    const name = this.metadata.strategy;
    if (name === 'BasicStrategy') {
      return new BasicStrategy({ realm: '', passReqToCallback: true }, this.verify.bind(this));
    } else {
      return Promise.reject(`The strategy ${name} is not available.`);
    }
  }

  verify(req: any,
    username: string,
    password: string,
    done: (err: Error | null, user?: UserProfile | false) => void,
  ) {
    // find user by name & password
    // call done(null, false) when user not found
    // call done(null, user) when user is authenticated
    const headers = req.headers;
    let user = this.userRepository.findOne({ where: { username: username } });
    user.then((val) => {
      if (!val) {
        console.log("User not found, invalid username");
        done(null, false);
      }
      else if (val.password !== password) {
        console.log("User not found, authentication failed");
        done(null, false);
      }
      else {
        console.log("User found, authenticated");
        done(null, { id: username });
      }
    }).catch((reason) => {
      done(null, false);
    });
  }
}
