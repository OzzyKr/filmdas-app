import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodError, ZodTypeAny, z } from 'zod';

@Injectable()
export class ZodValidationPipe<T extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: formatIssues(result.error),
      });
    }
    return result.data;
  }
}

function formatIssues(error: ZodError): Array<{ path: (string | number)[]; message: string }> {
  return error.issues.map((issue) => ({
    path: [...issue.path] as (string | number)[],
    message: issue.message,
  }));
}
