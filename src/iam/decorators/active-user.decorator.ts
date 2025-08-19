import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { REQUEST_USER_KEY } from '../constants/iam.constants';
import { ActiveUserData } from '../interfaces/active-user.data.interface';

export const ActiveUser = createParamDecorator(
  (key: string, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const user = request[REQUEST_USER_KEY];
    // console.log("================ active-user.decorator.ts ==================");
    // console.log(REQUEST_USER_KEY, request);
    return key ? user?.[key] : user;
  },
);
